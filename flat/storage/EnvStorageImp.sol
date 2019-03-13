pragma solidity ^0.4.13;

library SafeMath {

  /**
  * @dev Multiplies two numbers, reverts on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
    // benefit is lost if 'b' is also tested.
    // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
    if (a == 0) {
      return 0;
    }

    uint256 c = a * b;
    require(c / a == b);

    return c;
  }

  /**
  * @dev Integer division of two numbers truncating the quotient, reverts on division by zero.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b > 0); // Solidity only automatically asserts when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold

    return c;
  }

  /**
  * @dev Subtracts two numbers, reverts on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b <= a);
    uint256 c = a - b;

    return c;
  }

  /**
  * @dev Adds two numbers, reverts on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a);

    return c;
  }

  /**
  * @dev Divides two numbers and returns the remainder (unsigned integer modulo),
  * reverts when dividing by zero.
  */
  function mod(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b != 0);
    return a % b;
  }
}

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

contract EnvConstants {
    bytes32 public constant BLOCKS_PER_NAME = keccak256("blocksPer"); 
    uint256 public constant BLOCKS_PER_TYPE = uint256(VariableTypes.Uint);

    bytes32 public constant BALLOT_DURATION_MIN_NAME = keccak256("ballotDurationMin"); 
    uint256 public constant BALLOT_DURATION_MIN_TYPE = uint256(VariableTypes.Uint);

    bytes32 public constant BALLOT_DURATION_MAX_NAME = keccak256("ballotDurationMax"); 
    uint256 public constant BALLOT_DURATION_MAX_TYPE = uint256(VariableTypes.Uint);

    bytes32 public constant STAKING_MIN_NAME = keccak256("stakingMin"); 
    uint256 public constant STAKING_MIN_TYPE = uint256(VariableTypes.Uint);

    bytes32 public constant STAKING_MAX_NAME = keccak256("stakingMax"); 
    uint256 public constant STAKING_MAX_TYPE = uint256(VariableTypes.Uint);

    bytes32 public constant GAS_PRICE_NAME = keccak256("gasPrice"); 
    uint256 public constant GAS_PRICE_TYPE = uint256(VariableTypes.Uint);

    bytes32 public constant MAX_IDLE_BLOCK_INTERVAL_NAME = keccak256("MaxIdleBlockInterval"); 
    uint256 public constant MAX_IDLE_BLOCK_INTERVAL_TYPE = uint256(VariableTypes.Uint);


    enum VariableTypes {
        Invalid,
        Int,
        Uint,
        Address,
        Bytes32,
        Bytes,
        String
    }
    
    bytes32 internal constant TEST_INT = keccak256("TEST_INT"); 
    bytes32 internal constant TEST_ADDRESS = keccak256("TEST_ADDRESS"); 
    bytes32 internal constant TEST_BYTES32 = keccak256("TEST_BYTES32"); 
    bytes32 internal constant TEST_BYTES = keccak256("TEST_BYTES"); 
    bytes32 internal constant TEST_STRING = keccak256("TEST_STRING"); 
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

contract EnvStorageImp is AEnvStorage, EnvConstants {
    using SafeMath for uint256;

    function initialize(
        uint256 _blocksPer, 
        uint256 _ballotDurationMin,
        uint256 _ballotDurationMax,
        uint256 _stakingMin,
        uint256 _stakingMax,
        uint256 _gasPrice,
        uint256 _maxIdleBlockInterval
    ) public onlyOwner {
        uint256 blocksPer = getBlocksPer();
        uint256 ballotDurationMin = getBallotDurationMin();
        uint256 ballotDurationMax = getBallotDurationMax();
        uint256 stakingMin = getStakingMin();
        uint256 stakingMax = getStakingMax();
        uint256 gasPrice = getGasPrice();
        uint256 maxIdleBlockInterval = getMaxIdleBlockInterval();
        require(_blocksPer != 0 || blocksPer != 0, "invalid blocksPer values");
        require(_ballotDurationMin != 0 || ballotDurationMin != 0, "invalid ballotDurationMin values");
        require(_ballotDurationMax != 0 || ballotDurationMax != 0, "invalid ballotDurationMax values");
        require(_stakingMin != 0 || stakingMin != 0, "invalid stakingMin values");
        require(_stakingMax != 0 || stakingMax != 0, "invalid stakingMax values");
        require(_gasPrice != 0 || gasPrice != 0, "invalid gasPrice values");
        require(_maxIdleBlockInterval != 0 || maxIdleBlockInterval != 0, "invalid max Idle Block Interval values");
        if (blocksPer == 0) {
            setUint(BLOCKS_PER_NAME, _blocksPer);
        }
        if (ballotDurationMin == 0) {
            setUint(BALLOT_DURATION_MIN_NAME, _ballotDurationMin);
        }
        if (ballotDurationMax == 0) {
            setUint(BALLOT_DURATION_MAX_NAME, _ballotDurationMax);
        }
        if (stakingMin == 0) {
            setUint(STAKING_MIN_NAME, _stakingMin);
        }
        if (stakingMax == 0) {
            setUint(STAKING_MAX_NAME, _stakingMax);
        }
        if (gasPrice == 0) {
            setUint(GAS_PRICE_NAME,_gasPrice);
        }
        if (maxIdleBlockInterval == 0) {
            setUint(MAX_IDLE_BLOCK_INTERVAL_NAME,_maxIdleBlockInterval);
        }
    }

    function getBlocksPer() public view returns (uint256) {
        return getUint(BLOCKS_PER_NAME);
    }

    function getBallotDurationMin() public view returns (uint256) {
        return getUint(BALLOT_DURATION_MIN_NAME);
    }

    function getBallotDurationMax() public view returns (uint256) {
        return getUint(BALLOT_DURATION_MAX_NAME);
    }

    function getStakingMin() public view returns (uint256) {
        return getUint(STAKING_MIN_NAME);
    }

    function getStakingMax() public view returns (uint256) {
        return getUint(STAKING_MAX_NAME);
    }

    function getGasPrice() public view returns (uint256) {
        return getUint(GAS_PRICE_NAME);
    }
    function getMaxIdleBlockInterval() public view returns (uint256) {
        return getUint(MAX_IDLE_BLOCK_INTERVAL_NAME);
    }

    function setBlocksPer(uint256 _value) public onlyGov { 
        setUint(BLOCKS_PER_NAME, _value);
    }

    function setBallotDurationMin(uint256 _value) public onlyGov { 
        setUint(BALLOT_DURATION_MIN_NAME, _value);
    }

    function setBallotDurationMax(uint256 _value) public onlyGov { 
        setUint(BALLOT_DURATION_MAX_NAME, _value);
    }

    function setStakingMin(uint256 _value) public onlyGov { 
        setUint(STAKING_MIN_NAME, _value);
    }

    function setStakingMax(uint256 _value) public onlyGov { 
        setUint(STAKING_MAX_NAME, _value);
    }

    function setGasPrice(uint256 _value) public onlyGov { 
        setUint(GAS_PRICE_NAME, _value);
    }
    
    function setMaxIdleBlockInterval(uint256 _value) public onlyGov { 
        setUint(MAX_IDLE_BLOCK_INTERVAL_NAME, _value);
    }

    function setBlocksPerByBytes(bytes _value) public onlyGov { 
        setBlocksPer(toUint(_value));
    }

    function setBallotDurationMinByBytes(bytes _value) public onlyGov { 
        setBallotDurationMin(toUint(_value));
    }

    function setBallotDurationMaxByBytes(bytes _value) public onlyGov { 
        setBallotDurationMax(toUint(_value));
    }

    function setStakingMinByBytes(bytes _value) public onlyGov { 
        setStakingMin(toUint(_value));
    }

    function setStakingMaxByBytes(bytes _value) public onlyGov { 
        setStakingMax(toUint(_value));
    }

    function setGasPriceByBytes(bytes _value) public onlyGov { 
        setStakingMax(toUint(_value));
    }

    function setMaxIdleBlockIntervalByBytes(bytes _value) public onlyGov { 
        setStakingMax(toUint(_value));
    }

    function getTestInt() public view returns (int256) {
        return getInt(TEST_INT);
    }

    function getTestAddress() public view returns (address) {
        return getAddress(TEST_ADDRESS);
    }

    function getTestBytes32() public view returns (bytes32) {
        return getBytes32(TEST_BYTES32);
    }

    function getTestBytes() public view returns (bytes) {
        return getBytes(TEST_BYTES);
    }

    function getTestString() public view returns (string) {
        return getString(TEST_STRING);
    }

    function setTestIntByBytes(bytes _value) public onlyGov { 
        setInt(TEST_INT, toInt(_value));
    }

    function setTestAddressByBytes(bytes _value) public onlyGov { 
        setAddress(TEST_ADDRESS, toAddress(_value));
    }

    function setTestBytes32ByBytes(bytes _value) public onlyGov { 
        setBytes32(TEST_BYTES32, toBytes32(_value));
    }

    function setTestBytesByBytes(bytes _value) public onlyGov { 
        setBytes(TEST_BYTES, _value);
    }

    function setTestStringByBytes(bytes _value) public onlyGov { 
        setString(TEST_STRING, string(_value));
    }

    function toBytes32(bytes memory _input) internal pure returns (bytes32 _output) {
        assembly {
            _output := mload(add(_input, 32))
        }
    }

    function toInt(bytes memory _input) internal pure returns (int256 _output) {
        assembly {
            _output := mload(add(_input, 32))
        }
    }

    function toUint(bytes memory _input) internal pure returns (uint256 _output) {
        
        assembly {
            _output := mload(add(_input, 32))
        }
    }

    function toAddress(bytes memory _input) internal pure returns (address _output) {
        assembly {
            _output := mload(add(_input, 20))
        }
    }
}

