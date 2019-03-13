pragma solidity ^0.4.13;

contract Ownable {
  address private _owner;

  event OwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
  );

  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  constructor() internal {
    _owner = msg.sender;
    emit OwnershipTransferred(address(0), _owner);
  }

  /**
   * @return the address of the owner.
   */
  function owner() public view returns(address) {
    return _owner;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(isOwner());
    _;
  }

  /**
   * @return true if `msg.sender` is the owner of the contract.
   */
  function isOwner() public view returns(bool) {
    return msg.sender == _owner;
  }

  /**
   * @dev Allows the current owner to relinquish control of the contract.
   * @notice Renouncing to ownership will leave the contract without an owner.
   * It will not be possible to call the functions with the `onlyOwner`
   * modifier anymore.
   */
  function renounceOwnership() public onlyOwner {
    emit OwnershipTransferred(_owner, address(0));
    _owner = address(0);
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    _transferOwnership(newOwner);
  }

  /**
   * @dev Transfers control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function _transferOwnership(address newOwner) internal {
    require(newOwner != address(0));
    emit OwnershipTransferred(_owner, newOwner);
    _owner = newOwner;
  }
}

contract GovChecker is Ownable {
    IRegistry public reg;

    bytes32 public constant GOV_NAME = "GovernanceContract";
    bytes32 public constant STAKING_NAME = "Staking";
    bytes32 public constant BALLOT_STORAGE_NAME = "BallotStorage";
    bytes32 public constant ENV_STORAGE_NAME = "EnvStorage";
    bytes32 public constant REWARD_POOL_NAME = "RewardPool";

    /**
     * @dev Function to set registry address. Contract that wants to use registry should setRegistry first.
     * @param _addr address of registry
     * @return A boolean that indicates if the operation was successful.
     */
    function setRegistry(address _addr) public onlyOwner {
        reg = IRegistry(_addr);
    }
    
    modifier onlyGov() {
        require(getGovAddress() == msg.sender, "No Permission");
        _;
    }

    modifier onlyGovMem() {
        require(IGov(getGovAddress()).isMember(msg.sender), "No Permission");
        _;
    }

    modifier anyGov() {
        require(getGovAddress() == msg.sender || IGov(getGovAddress()).isMember(msg.sender), "No Permission");
        _;
    }

    function getContractAddress(bytes32 name) internal view returns (address) {
        return reg.getContractAddress(name);
    }

    function getGovAddress() internal view returns (address) {
        return getContractAddress(GOV_NAME);
    }

    function getStakingAddress() internal view returns (address) {
        return getContractAddress(STAKING_NAME);
    }

    function getBallotStorageAddress() internal view returns (address) {
        return getContractAddress(BALLOT_STORAGE_NAME);
    }

    function getEnvStorageAddress() internal view returns (address) {
        return getContractAddress(ENV_STORAGE_NAME);
    }

    function getRewardPoolAddress() internal view returns (address) {
        return getContractAddress(REWARD_POOL_NAME);
    }
}

interface IGov {
    function isMember(address) external view returns (bool);
    function getMember(uint256) external view returns (address);
    function getMemberLength() external view returns (uint256);
    function getReward(uint256) external view returns (address);
    function getNodeIdxFromMember(address) external view returns (uint256);
    function getMemberFromNodeIdx(uint256) external view returns (address);
    function getNodeLength() external view returns (uint256);
    function getNode(uint256) external view returns (bytes, bytes, bytes, uint);
    function getBallotInVoting() external view returns (uint256);
}

interface IRegistry {
    function getContractAddress(bytes32) external view returns (address);
}

contract Proxy {
    /**
    * @dev Fallback function allowing to perform a delegatecall to the given implementation.
    * This function will return whatever the implementation call returns
    */
    function () public payable {
        address _impl = implementation();
        require(_impl != address(0));

        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize)
            let result := delegatecall(gas, _impl, ptr, calldatasize, 0, 0)
            let size := returndatasize
            returndatacopy(ptr, 0, size)

            switch result
            case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }
    }

    /**
    * @dev Tells the address of the implementation where every call will be delegated.
    * @return address of the implementation to which it will be delegated
    */
    function implementation() public view returns (address);
}

contract UpgradeabilityProxy is Proxy {
    /**
     * @dev This event will be emitted every time the implementation gets upgraded
     * @param implementation representing the address of the upgraded implementation
     */
    event Upgraded(address indexed implementation);

    // Storage position of the address of the current implementation
    bytes32 private constant IMPLEMENT_POSITION = keccak256("org.metadium.proxy.implementation");

    /**
     * @dev Constructor function
     */
    constructor() public {}

    /**
     * @dev Tells the address of the current implementation
     * @return address of the current implementation
     */
    function implementation() public view returns (address impl) {
        bytes32 position = IMPLEMENT_POSITION;
        assembly {
            impl := sload(position)
        }
    }

    /**
     * @dev Sets the address of the current implementation
     * @param newImplementation address representing the new implementation to be set
     */
    function setImplementation(address newImplementation) internal {
        bytes32 position = IMPLEMENT_POSITION;
        assembly {
            sstore(position, newImplementation)
        }
    }

    /**
     * @dev Upgrades the implementation address
     * @param newImplementation representing the address of the new implementation to be set
     */
    function _upgradeTo(address newImplementation) internal {
        address currentImplementation = implementation();
        require(currentImplementation != newImplementation);
        setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }
}

contract EternalStorage {
    struct Storage {
        mapping(bytes32 => bool) _bool;
        mapping(bytes32 => int256) _int;
        mapping(bytes32 => uint256) _uint;
        mapping(bytes32 => string) _string;
        mapping(bytes32 => address) _address;
        mapping(bytes32 => bytes) _bytes;
        mapping(bytes32 => bytes32) _bytes32;
    }

    Storage internal s;

    /**
    * @dev Get the value stored of a boolean variable by the hash name
    * @param h The keccak256 hash of the variable name
    */
    function getBoolean(bytes32 h) public view returns (bool) {
        return s._bool[h];
    }

    /**
    * @dev Get the value stored of a int variable by the hash name
    * @param h The keccak256 hash of the variable name
    */
    function getInt(bytes32 h) public view returns (int) {
        return s._int[h];
    }

    /**
    * @dev Get the value stored of a uint variable by the hash name
    * @param h The keccak256 hash of the variable name
    */
    function getUint(bytes32 h) public view returns (uint256) {
        return s._uint[h];
    }

    /**
    * @dev Get the value stored of a address variable by the hash name
    * @param h The keccak256 hash of the variable name
    */
    function getAddress(bytes32 h) public view returns (address) {
        return s._address[h];
    }

    /**
    * @dev Get the value stored of a string variable by the hash name
    * @param h The keccak256 hash of the variable name
    */
    function getString(bytes32 h) public view returns (string) {
        return s._string[h];
    }

    /**
    * @dev Get the value stored of a bytes variable by the hash name
    * @param h The keccak256 hash of the variable name
    */
    function getBytes(bytes32 h) public view returns (bytes) {
        return s._bytes[h];
    }

    /**
    * @dev Get the value stored of a bytes variable by the hash name
    * @param h The keccak256 hash of the variable name
    */
    function getBytes32(bytes32 h) public view returns (bytes32) {
        return s._bytes32[h];
    }

    /**
    * @dev Allows the owner to set a value for a boolean variable.
    * @param h The keccak256 hash of the variable name
    * @param v The value to be stored
    */
    function _setBoolean(bytes32 h, bool v) internal {
        s._bool[h] = v;
    }

    /**
    * @dev Allows the owner to set a value for a int variable.
    * @param h The keccak256 hash of the variable name
    * @param v The value to be stored
    */
    function _setInt(bytes32 h, int256 v) internal {
        s._int[h] = v;
    }

    /**
    * @dev Allows the owner to set a value for a boolean variable.
    * @param h The keccak256 hash of the variable name
    * @param v The value to be stored
    */
    function _setUint(bytes32 h, uint256 v) internal {
        s._uint[h] = v;
    }

    /**
    * @dev Allows the owner to set a value for a address variable.
    * @param h The keccak256 hash of the variable name
    * @param v The value to be stored
    */
    function _setAddress(bytes32 h, address v) internal {
        s._address[h] = v;
    }

    /**
    * @dev Allows the owner to set a value for a string variable.
    * @param h The keccak256 hash of the variable name
    * @param v The value to be stored
    */
    function _setString(bytes32 h, string v) internal {
        s._string[h] = v;
    }

    /**
    * @dev Allows the owner to set a value for a bytes variable.
    * @param h The keccak256 hash of the variable name
    * @param v The value to be stored
    */
    function _setBytes(bytes32 h, bytes v) internal {
        s._bytes[h] = v;
    }

    /**
    * @dev Allows the owner to set a value for a bytes32 variable.
    * @param h The keccak256 hash of the variable name
    * @param v The value to be stored
    */
    function _setBytes32(bytes32 h, bytes32 v) internal {
        s._bytes32[h] = v;
    }
}

contract AEnvStorage is EternalStorage, GovChecker {
    // struct Variable {
    //     bytes32 _name;
    //     uint256 _type;
    //     string _value;
    // }
   
    event StringVarableChanged ( 
        bytes32 indexed _name,
        string _value
    );

    event UintVarableChanged ( 
        bytes32 indexed _name,
        uint _value
    );

    event IntVarableChanged ( 
        bytes32 indexed _name,
        int _value
    );

    event AddressVarableChanged ( 
        bytes32 indexed _name,
        address _value
    );

    event Bytes32VarableChanged ( 
        bytes32 indexed _name,
        bytes32 _value
    );

    event BytesVarableChanged ( 
        bytes32 indexed _name,
        bytes _value
    );

    event VarableChanged ( 
        bytes32 indexed _name,
        uint256 indexed _type,
        string _value
    );
   
    /**
    * @dev Allows the owner to set a value for a int variable.
    * @param h The keccak256 hash of the variable name
    * @param v The value to be stored
    */
    function setInt(bytes32 h, int256 v) internal {
        _setInt(h, v);
        emit IntVarableChanged(h, v);
    }

    /**
    * @dev Allows the owner to set a value for a boolean variable.
    * @param h The keccak256 hash of the variable name
    * @param v The value to be stored
    */
    function setUint(bytes32 h, uint256 v) internal {
        _setUint(h, v);
        emit UintVarableChanged(h, v);
    }

    /**
    * @dev Allows the owner to set a value for a address variable.
    * @param h The keccak256 hash of the variable name
    * @param v The value to be stored
    */
    function setAddress(bytes32 h, address v) internal {
        _setAddress(h, v);
        emit AddressVarableChanged(h, v);
    }

    /**
    * @dev Allows the owner to set a value for a string variable.
    * @param h The keccak256 hash of the variable name
    * @param v The value to be stored
    */
    function setString(bytes32 h, string v) internal  {
        _setString(h, v);
        emit StringVarableChanged(h, v);
    }

    /**
    * @dev Allows the owner to set a value for a bytes variable.
    * @param h The keccak256 hash of the variable name
    * @param v The value to be stored
    */
    function setBytes(bytes32 h, bytes v) internal {
        _setBytes(h, v);
        emit BytesVarableChanged(h, v);
    }

    /**
    * @dev Allows the owner to set a value for a bytes32 variable.
    * @param h The keccak256 hash of the variable name
    * @param v The value to be stored
    */
    function setBytes32(bytes32 h, bytes32 v) internal {
        _setBytes32(h, v);
        emit Bytes32VarableChanged(h, v);
    }

    // mapping(bytes32 => Variable) internal s;

    // /**
    // * @dev Add a new variable .
    // * @param _h The keccak256 hash of the variable name
    // * @param _t The type of value
    // * @param _v The value to be stored
    // */
    // function _add(bytes32 _h, uint256 _t, string _v) internal  {
    //     require(s[_h]._name == "","not found");
    //     s[_h] = Variable(_h,_t,_v);
    //     emit VarableAdded(_h,_t,_v);
    // }
    // /**
    // * @dev Update a new variable .
    // * @param _h The keccak256 hash of the variable name
    // * @param _t The type of value
    // * @param _v The value to be stored
    // */
    // function _change(bytes32 _h, uint256 _t, string _v) internal {
    //     require(s[_h]._name == _h,"not found");
    //     Variable storage v = s[_h];
    //     v._name = _h;
    //     v._type = _t;
    //     v._value = _v;
    //     emit VarableChanged(_h,_t,_v);

    // }
    // /**
    // * @dev Get the type & value stored of a string variable by the hash name
    // * @param _h The keccak256 hash of the variable name
    // */
    // function get(bytes32 _h) public view returns (uint256 varType, string varVal){
    //     //require(s[_h]._name == _h,"not found");
    //     return (s[_h]._type, s[_h]._value);
    // }
    // /**
    // * @dev Get the type stored of a string variable by the hash name
    // * @param _h The keccak256 hash of the variable name
    // */
    // function getType(bytes32 _h) public view returns (uint256){
    //     require(s[_h]._name == _h,"not found");
    //     return s[_h]._type;
    // }
    // /**
    // * @dev Get the value stored of a string variable by the hash name
    // * @param _h The keccak256 hash of the variable name
    // */
    // function getValue(bytes32 _h) public view returns (string){
    //     require(s[_h]._name == _h,"not found");
    //     return s[_h]._value;
    // }
}

contract EnvStorage is UpgradeabilityProxy, AEnvStorage {

    modifier onlyGovOrOwner() {
        require((getGovAddress() == msg.sender) || isOwner(), "No Permission");
        _;
    }

    constructor(address _registry, address _implementation) public {
        setRegistry(_registry);
        setImplementation(_implementation);
    }

    function upgradeTo(address newImplementation) public onlyGovOrOwner {
        require(newImplementation != address(0), "Implementation cannot be zero");
        require(newImplementation != implementation(), "Same contract address");
        _upgradeTo(newImplementation);
    }
}

