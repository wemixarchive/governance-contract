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
        require(_addr != address(0), "Address should be non-zero");
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

interface IStaking {
    function deposit() external payable;
    function withdraw(uint256) external;
    function lock(address, uint256) external;
    function unlock(address, uint256) external;
    function transferLocked(address, uint256) external;
    function balanceOf(address) external view returns (uint256);
    function lockedBalanceOf(address) external view returns (uint256);
    function availableBalanceOf(address) external view returns (uint256);
    function calcVotingWeight(address) external view returns (uint256);
    function calcVotingWeightWithScaleFactor(address, uint32) external view returns (uint256);
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
        require(newImplementation != address(0), "newImplementation should be non-zero");
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
        require(newImplementation != address(0), "newImplementation should be non-zero");
        address currentImplementation = implementation();
        require(currentImplementation != newImplementation, "newImplementation should be not same as currentImplementation");
        setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }
}

contract AGov is UpgradeabilityProxy, GovChecker {

    uint public modifiedBlock;
  

    // For voting member
    mapping(uint256 => address) internal members;
    mapping(address => uint256) internal memberIdx;
    uint256 internal memberLength;

    // For reward member
    mapping(uint256 => address) internal rewards;
    mapping(address => uint256) internal rewardIdx;

    // For enode
    struct Node {
        bytes name;
        bytes enode;
        bytes ip;
        uint port;
    }

    mapping(uint256 => Node) internal nodes;
    mapping(address => uint256) internal nodeIdxFromMember;
    mapping(uint256 => address) internal nodeToMember;
    uint256 internal nodeLength;

    // For ballot
    uint256 public ballotLength;
    uint256 public voteLength;
    uint256 internal ballotInVoting;

    constructor() public {
        //_initialized = false;
        // memberLength = 0;
        // nodeLength = 0;
        // ballotLength = 0;
        // voteLength = 0;
        // ballotInVoting = 0;
    }

    function isMember(address addr) public view returns (bool) { return (memberIdx[addr] != 0); }
    function getMember(uint256 idx) public view returns (address) { return members[idx]; }
    function getMemberLength() public view returns (uint256) { return memberLength; }
    function getReward(uint256 idx) public view returns (address) { return rewards[idx]; }
    function getNodeIdxFromMember(address addr) public view returns (uint256) { return nodeIdxFromMember[addr]; }
    function getMemberFromNodeIdx(uint256 idx) public view returns (address) { return nodeToMember[idx]; }
    function getNodeLength() public view returns (uint256) { return nodeLength; }

    function getNode(uint256 idx) public view returns (bytes name, bytes enode, bytes ip, uint port) {
        return (nodes[idx].name, nodes[idx].enode, nodes[idx].ip, nodes[idx].port);
    }

    function getBallotInVoting() public view returns (uint256) { return ballotInVoting; }
}

contract Gov is AGov {
    // "Metadium Governance"
    uint public magic = 0x4d6574616469756d20476f7665726e616e6365;
    bool private _initialized;
    
    function init(
        address registry,
        address implementation,
        uint256 lockAmount,
        bytes name,
        bytes enode,
        bytes ip,
        uint port
    )
        public onlyOwner
    {
        require(_initialized == false, "Already initialized");
        require(lockAmount > 0, "lockAmount should be more then zero");
        setRegistry(registry);
        setImplementation(implementation);

        // Lock
        IStaking staking = IStaking(getStakingAddress());
        require(staking.availableBalanceOf(msg.sender) >= lockAmount, "Insufficient staking");
        staking.lock(msg.sender, lockAmount);

        // Add voting member
        memberLength = 1;
        members[memberLength] = msg.sender;
        memberIdx[msg.sender] = memberLength;

        // Add reward member
        rewards[memberLength] = msg.sender;
        rewardIdx[msg.sender] = memberLength;

        // Add node
        nodeLength = 1;
        Node storage node = nodes[nodeLength];
        node.name = name;
        node.enode = enode;
        node.ip = ip;
        node.port = port;
        nodeIdxFromMember[msg.sender] = nodeLength;
        nodeToMember[nodeLength] = msg.sender;

        _initialized = true;
        modifiedBlock = block.number;
    }

    function initOnce(
        address registry,
        address implementation,
        bytes data
    )
        public onlyOwner
    {
        require(_initialized == false, "Already initialized");

        setRegistry(registry);
        setImplementation(implementation);

        _initialized = true;
        modifiedBlock = block.number;

        // []{uint addr, bytes name, bytes enode, bytes ip, uint port}
        // 32 bytes, [32 bytes, <data>] * 3, 32 bytes
        address addr;
        bytes memory name;
        bytes memory enode;
        bytes memory ip;
        uint port;
        uint idx = 0;

        uint ix;
        uint eix;
        assembly {
            ix := add(data, 0x20)
        }
        eix = ix + data.length;
        while (ix < eix) {
            assembly {
                port := mload(ix)
            }
            addr = address(port);
            ix += 0x20;
            require(ix < eix);

            assembly {
                name := ix
            }
            ix += 0x20 + name.length;
            require(ix < eix);

            assembly {
                enode := ix
            }
            ix += 0x20 + enode.length;
            require(ix < eix);

            assembly {
                ip := ix
            }
            ix += 0x20 + ip.length;
            require(ix < eix);

            assembly {
                port := mload(ix)
            }
            ix += 0x20;

            idx += 1;
            members[idx] = addr;
            memberIdx[addr] = idx;
            rewards[idx] = addr;
            rewardIdx[addr] = idx;

            Node storage node = nodes[idx];
            node.name = name;
            node.enode = enode;
            node.ip = ip;
            node.port = port;
            nodeToMember[idx] = addr;
            nodeIdxFromMember[addr] = idx;
        }
        memberLength = idx;
        nodeLength = idx;
    }
}

