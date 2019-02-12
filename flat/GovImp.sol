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

contract ReentrancyGuard {

  /// @dev counter to allow mutex lock with only one SSTORE operation
  uint256 private _guardCounter;

  constructor() internal {
    // The counter starts at one to prevent changing it from zero to a non-zero
    // value, which is a more expensive operation.
    _guardCounter = 1;
  }

  /**
   * @dev Prevents a contract from calling itself, directly or indirectly.
   * Calling a `nonReentrant` function from another `nonReentrant`
   * function is not supported. It is possible to prevent this from happening
   * by making the `nonReentrant` function external, and make it call a
   * `private` function that does the actual work.
   */
  modifier nonReentrant() {
    _guardCounter += 1;
    uint256 localCounter = _guardCounter;
    _;
    require(localCounter == _guardCounter);
  }

}

contract GovChecker is Ownable {
    IRegistry public reg;
    bytes32 public constant GOV_NAME = "GovernanceContract";
    bytes32 public constant STAKING_NAME = "Staking";
    bytes32 public constant BALLOT_STORAGE_NAME = "BallotStorage";
    bytes32 public constant ENV_STORAGE_NAME = "EnvStorage";

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
}

contract BallotEnums {
    enum BallotStates {
        Invalid,
        Ready,
        InProgress,
        Accepted,
        Rejected
    }

    enum DecisionTypes {
        Invalid,
        Accept,
        Reject
    }

    enum BallotTypes {
        Invalid,
        MemberAdd,  // new Member Address, new Node id, new Node ip, new Node port
        MemberRemoval, // old Member Address
        MemberChange,     // Old Member Address, New Member Address, new Node id, New Node ip, new Node port
        GovernanceChange, // new Governace Impl Address
        EnvValChange    // Env variable name, type , value
    }
}

contract EnvConstants {
    bytes32 internal constant BLOCK_PER_NAME = keccak256("blockPer"); 
    uint256 internal constant BLOCK_PER_TYPE = uint256(VariableTypes.Uint);

    bytes32 internal constant BALLOT_DURATION_MIN_NAME = keccak256("ballotDurationMin"); 
    uint256 internal constant BALLOT_DURATION_MIN_TYPE = uint256(VariableTypes.Uint);

    bytes32 internal constant BALLOT_DURATION_MAX_NAME = keccak256("ballotDurationMax"); 
    uint256 internal constant BALLOT_DURATION_MAX_TYPE = uint256(VariableTypes.Uint);

    bytes32 internal constant STAKING_MIN_NAME = keccak256("stakingMin"); 
    uint256 internal constant STAKING_MIN_TYPE = uint256(VariableTypes.Uint);

    bytes32 internal constant STAKING_MAX_NAME = keccak256("stakingMax"); 
    uint256 internal constant STAKING_MAX_TYPE = uint256(VariableTypes.Uint);

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

interface IBallotStorage {
    function createBallotForMemeber(
        uint256, uint256, address, address,
        address, bytes, bytes, uint) external;

    function createBallotForAddress(uint256, uint256, address, address)external returns (uint256);
    function createBallotForVariable(uint256, uint256, address, bytes32, uint256, bytes) external returns (uint256);
    function createVote(uint256, uint256, address, uint256, uint256) external returns (uint256);
    function finalizeBallot(uint256, uint256) external;
    function startBallot(uint256, uint256, uint256) external;
    function updateBallotMemo(uint256, bytes) external;
    function updateBallotDuration(uint256, uint256) external;
    function updateBallotMemberLockAmount(uint256, uint256) external;

    function getBallotPeriod(uint256) external view returns (uint256, uint256, uint256);
    function getBallotVotingInfo(uint256) external view returns (uint256, uint256, uint256);
    function getBallotState(uint256) external view returns (uint256, uint256, bool);

    function getBallotBasic(uint256) external view returns (
        uint256, uint256, uint256, address, bytes, uint256,
        uint256, uint256, uint256, bool, uint256);

    function getBallotMember(uint256) external view returns (address, address, bytes, bytes, uint256, uint256);
    function getBallotAddress(uint256) external view returns (address);
    function getBallotVariable(uint256) external view returns (bytes32, uint256, bytes);
}

interface IEnvStorage {
    function setBlockPerByBytes(bytes) external;
    function setBallotDurationMinByBytes(bytes) external;
    function setBallotDurationMaxByBytes(bytes) external;
    function setStakingMinByBytes(bytes) external;
    function setStakingMaxByBytes(bytes) external;
    function getBlockPer() external view returns (uint256);
    function getStakingMin() external view returns (uint256);
    function getStakingMax() external view returns (uint256);
    function getBallotDurationMin() external view returns (uint256);
    function getBallotDurationMax() external view returns (uint256);
}

interface IGov {
    function isMember(address) external view returns (bool);
    function getMember(uint256) external view returns (address);
    function getMemberLength() external view returns (uint256);
    function getReward(uint256) external view returns (address);
    function getNodeIdxFromMember(address) external view returns (uint256);
    function getMemberFromNodeIdx(uint256) external view returns (address);
    function getNodeLength() external view returns (uint256);
    function getNode(uint256) external view returns (bytes, bytes, uint);
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

contract Gov is UpgradeabilityProxy, GovChecker {
    bool private _initialized;

    // For voting member
    mapping(uint256 => address) internal members;
    mapping(address => uint256) internal memberIdx;
    uint256 internal memberLength;

    // For reward member
    mapping(uint256 => address) internal rewards;
    mapping(address => uint256) internal rewardIdx;

    // For enode
    struct Node {
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
        _initialized = false;
        memberLength = 0;
        nodeLength = 0;
        ballotLength = 0;
        voteLength = 0;
        ballotInVoting = 0;
    }

    function isMember(address addr) public view returns (bool) { return (memberIdx[addr] != 0); }
    function getMember(uint256 idx) public view returns (address) { return members[idx]; }
    function getMemberLength() public view returns (uint256) { return memberLength; }
    function getReward(uint256 idx) public view returns (address) { return rewards[idx]; }
    function getNodeIdxFromMember(address addr) public view returns (uint256) { return nodeIdxFromMember[addr]; }
    function getMemberFromNodeIdx(uint256 idx) public view returns (address) { return nodeToMember[idx]; }
    function getNodeLength() public view returns (uint256) { return nodeLength; }

    function getNode(uint256 idx) public view returns (bytes enode, bytes ip, uint port) {
        return (nodes[idx].enode, nodes[idx].ip, nodes[idx].port);
    }
    
    function getBallotInVoting() public view returns (uint256) { return ballotInVoting; }

    function init(
        address registry,
        address implementation,
        uint256 lockAmount,
        bytes enode,
        bytes ip,
        uint port
    )
        public onlyOwner
    {
        require(_initialized == false, "Already initialized");

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
        node.enode = enode;
        node.ip = ip;
        node.port = port;
        nodeIdxFromMember[msg.sender] = nodeLength;
        nodeToMember[nodeLength] = msg.sender;

        _initialized = true;
    }
}

contract GovImp is Gov, ReentrancyGuard, BallotEnums, EnvConstants {
    using SafeMath for uint256;

    event MemberAdded(address indexed addr);
    event MemberRemoved(address indexed addr);
    event MemberChanged(address indexed oldAddr, address indexed newAddr);
    event EnvChanged(bytes32 envName, uint256 envType, bytes envVal);

    function addProposalToAddMember(
        address member,
        bytes enode,
        bytes ip,
        uint port,
        uint256 lockAmount
    )
        external
        onlyGovMem
        nonReentrant
        returns (uint256 ballotIdx)
    {
        require(msg.sender != member, "Cannot add self");
        require(!isMember(member), "Already member");

        ballotIdx = ballotLength.add(1);
        createBallotForMemeber(
            ballotIdx, // ballot id
            uint256(BallotTypes.MemberAdd), // ballot type
            msg.sender, // creator
            address(0), // old member address
            member, // new member address
            enode, // new enode
            ip, // new ip
            port // new port
        );
        updateBallotLock(ballotIdx, lockAmount);
        ballotLength = ballotIdx;
    }

    function addProposalToRemoveMember(
        address member,
        uint256 lockAmount
    )
        external
        onlyGovMem
        nonReentrant
        returns (uint256 ballotIdx)
    {
        require(isMember(member), "Non-member");
        require(getMemberLength() > 1, "Cannot remove a sole member");

        ballotIdx = ballotLength.add(1);
        createBallotForMemeber(
            ballotIdx, // ballot id
            uint256(BallotTypes.MemberRemoval), // ballot type
            msg.sender, // creator
            member, // old member address
            address(0), // new member address
            new bytes(0), // new enode
            new bytes(0), // new ip
            0 // new port
        );
        updateBallotLock(ballotIdx, lockAmount);
        ballotLength = ballotIdx;
    }

    function addProposalToChangeMember(
        address target,
        address nMember,
        bytes nEnode,
        bytes nIp,
        uint nPort,
        uint256 lockAmount
    )
        external
        onlyGovMem
        nonReentrant
        returns (uint256 ballotIdx)
    {
        require(isMember(target), "Non-member");

        ballotIdx = ballotLength.add(1);
        createBallotForMemeber(
            ballotIdx, // ballot id
            uint256(BallotTypes.MemberChange), // ballot type
            msg.sender, // creator
            target, // old member address
            nMember, // new member address
            nEnode, // new enode
            nIp, // new ip
            nPort // new port
        );
        updateBallotLock(ballotIdx, lockAmount);
        ballotLength = ballotIdx;
    }

    function addProposalToChangeGov(
        address newGovAddr
    )
        external
        onlyGovMem
        nonReentrant
        returns (uint256 ballotIdx)
    {
        require(newGovAddr != address(0), "Implementation cannot be zero");
        require(newGovAddr != implementation(), "Same contract address");

        ballotIdx = ballotLength.add(1);
        IBallotStorage(getBallotStorageAddress()).createBallotForAddress(
            ballotLength.add(1), // ballot id
            uint256(BallotTypes.GovernanceChange), // ballot type
            msg.sender, // creator
            newGovAddr // new governance address
        );
        ballotLength = ballotIdx;
    }

    function addProposalToChangeEnv(
        bytes32 envName,
        uint256 envType,
        bytes envVal
    )
        external
        onlyGovMem
        nonReentrant
        returns (uint256 ballotIdx)
    {
        require(uint256(VariableTypes.Int) <= envType && envType <= uint256(VariableTypes.String), "Invalid type");

        ballotIdx = ballotLength.add(1);
        IBallotStorage(getBallotStorageAddress()).createBallotForVariable(
            ballotIdx, // ballot id
            uint256(BallotTypes.EnvValChange), // ballot type
            msg.sender, // creator
            envName, // env name
            envType, // env type
            envVal // env value
        );
        ballotLength = ballotIdx;
    }

    function vote(uint256 ballotIdx, bool approval) external onlyGovMem nonReentrant {
        // Check if some ballot is in progress
        checkUnfinalized(ballotIdx);

        // Check if the ballot can be voted
        uint256 ballotType = checkVotable(ballotIdx);

        // Vote
        createVote(ballotIdx, approval);

        // Finalize
        (, uint256 accept, uint256 reject) = getBallotVotingInfo(ballotIdx);
        if (accept.add(reject) < getThreshould()) {
            return;
        }
        finalizeVote(ballotIdx, ballotType, accept > reject);
    }

    function getMinStaking() public view returns (uint256) {
        return IEnvStorage(getEnvStorageAddress()).getStakingMin();
    }

    function getMaxStaking() public view returns (uint256) {
        return IEnvStorage(getEnvStorageAddress()).getStakingMax();
    }

    function getMinVotingDuration() public view returns (uint256) {
        return IEnvStorage(getEnvStorageAddress()).getBallotDurationMin();
    }
    
    function getMaxVotingDuration() public view returns (uint256) {
        return IEnvStorage(getEnvStorageAddress()).getBallotDurationMax();
    }

    function getThreshould() public pure returns (uint256) { return 5100; } // 51% from 5100 of 10000

    function checkUnfinalized(uint256 ballotIdx) private {
        if (ballotInVoting != 0) {
            (, uint256 state, ) = getBallotState(ballotInVoting);
            (, uint256 endTime, ) = getBallotPeriod(ballotInVoting);
            if (state == uint256(BallotStates.InProgress)) {
                if (endTime < block.timestamp) {
                    finalizeBallot(ballotIdx, uint256(BallotStates.Rejected));
                    ballotInVoting = 0;
                    if (ballotIdx == ballotInVoting) {
                        return;
                    }
                } else if (ballotIdx != ballotInVoting) {
                    revert("Now in voting with different ballot");
                }
            }
        }
    }

    function checkVotable(uint256 ballotIdx) private returns (uint256) {
        (uint256 ballotType, uint256 state, ) = getBallotState(ballotIdx);
        if (state == uint256(BallotStates.Ready)) {
            (, , uint256 duration) = getBallotPeriod(ballotIdx);
            if (duration < getMinVotingDuration()) {
                startBallot(ballotIdx, block.timestamp, block.timestamp + getMinVotingDuration());
            } else if (getMaxVotingDuration() < duration) {
                startBallot(ballotIdx, block.timestamp, block.timestamp + getMaxVotingDuration());
            } else {
                startBallot(ballotIdx, block.timestamp, block.timestamp + duration);
            }
            ballotInVoting = ballotIdx;
        } else if (state == uint256(BallotStates.InProgress)) {
            // Nothing to do
        } else {
            revert("Expired");
        }
        return ballotType;
    }

    function createVote(uint256 ballotIdx, bool approval) private {
        uint256 voteIdx = voteLength.add(1);
        uint256 weight = IStaking(getStakingAddress()).calcVotingWeightWithScaleFactor(msg.sender, 1e4);
        if (approval) {
            IBallotStorage(getBallotStorageAddress()).createVote(
                voteIdx,
                ballotIdx,
                msg.sender,
                uint256(DecisionTypes.Accept),
                weight
            );
        } else {
            IBallotStorage(getBallotStorageAddress()).createVote(
                voteIdx,
                ballotIdx,
                msg.sender,
                uint256(DecisionTypes.Reject),
                weight
            );
        }
        voteLength = voteIdx;
    }

    function finalizeVote(uint256 ballotIdx, uint256 ballotType, bool isAccepted) private {
        uint256 ballotState = uint256(BallotStates.Rejected);
        if (isAccepted) {
            if (ballotType == uint256(BallotTypes.MemberAdd)) {
                addMember(ballotIdx);
            } else if (ballotType == uint256(BallotTypes.MemberRemoval)) {
                removeMember(ballotIdx);
            } else if (ballotType == uint256(BallotTypes.MemberChange)) {
                changeMember(ballotIdx);
            } else if (ballotType == uint256(BallotTypes.GovernanceChange)) {
                changeGov(ballotIdx);
            } else if (ballotType == uint256(BallotTypes.EnvValChange)) {
                applyEnv(ballotIdx);
            }
            ballotState = uint256(BallotStates.Accepted);
        }
        finalizeBallot(ballotIdx, ballotState);
        ballotInVoting = 0;
    }

    function addMember(uint256 ballotIdx) private {
        (uint256 ballotType, uint256 state, ) = getBallotState(ballotIdx);
        require(ballotType == uint256(BallotTypes.MemberAdd), "Not voting for addMember");
        require(state == uint(BallotStates.InProgress), "Invalid voting state");
        (, uint256 accept, uint256 reject) = getBallotVotingInfo(ballotIdx);
        require(accept.add(reject) >= getThreshould(), "Not yet finalized");

        (
            , address addr,
            bytes memory enode,
            bytes memory ip,
            uint port,
            uint256 lockAmount
        ) = getBallotMember(ballotIdx);
        if (isMember(addr)) {
            return; // Already member. it is abnormal case
        }

        // Lock
        require(getMinStaking() <= lockAmount && lockAmount <= getMaxStaking(), "Invalid lock amount");
        lock(addr, lockAmount);

        // Add member
        uint256 nMemIdx = memberLength.add(1);
        members[nMemIdx] = addr;
        memberIdx[addr] = nMemIdx;

        // Add node
        uint256 nNodeIdx = nodeLength.add(1);
        Node storage node = nodes[nNodeIdx];
        node.enode = enode;
        node.ip = ip;
        node.port = port;
        nodeIdxFromMember[addr] = nNodeIdx;
        nodeToMember[nNodeIdx] = addr;

        memberLength = nMemIdx;
        nodeLength = nNodeIdx;

        emit MemberAdded(addr);
    }

    function removeMember(uint256 ballotIdx) private {
        (uint256 ballotType, uint256 state, ) = getBallotState(ballotIdx);
        require(ballotType == uint256(BallotTypes.MemberRemoval), "Not voting for removeMember");
        require(state == uint(BallotStates.InProgress), "Invalid voting state");
        (, uint256 accept, uint256 reject) = getBallotVotingInfo(ballotIdx);
        require(accept.add(reject) >= getThreshould(), "Not yet finalized");

        (address addr, , , , , uint256 unlockAmount) = getBallotMember(ballotIdx);
        if (!isMember(addr)) {
            return; // Non-member. it is abnormal case
        }

        // Remove member
        if (memberIdx[addr] != memberLength) {
            (members[memberIdx[addr]], members[memberLength]) = (members[memberLength], members[memberIdx[addr]]);
        }
        memberIdx[addr] = 0;
        members[memberLength] = address(0);
        memberLength = memberLength.sub(1);

        // Remove node
        if (nodeIdxFromMember[addr] != nodeLength) {
            Node storage node = nodes[nodeIdxFromMember[addr]];
            node.enode = nodes[nodeLength].enode;
            node.ip = nodes[nodeLength].ip;
            node.port = nodes[nodeLength].port;
        }
        nodeIdxFromMember[addr] = 0;
        nodeToMember[nodeLength] = address(0);
        nodeLength = nodeLength.sub(1);

        // Unlock
        unlock(addr, unlockAmount);

        emit MemberRemoved(addr);
    }

    function changeMember(uint256 ballotIdx) private {
        (uint256 ballotType, uint256 state, ) = getBallotState(ballotIdx);
        require(ballotType == uint256(BallotTypes.MemberChange), "Not voting for changeMember");
        require(state == uint(BallotStates.InProgress), "Invalid voting state");
        (, uint256 accept, uint256 reject) = getBallotVotingInfo(ballotIdx);
        require(accept.add(reject) >= getThreshould(), "Not yet finalized");
        
        (
            address addr,
            address nAddr,
            bytes memory enode,
            bytes memory ip,
            uint port,
            uint256 lockAmount
        ) = getBallotMember(ballotIdx);
        if (!isMember(addr)) {
            return; // Non-member. it is abnormal case
        }

        if (addr != nAddr) {
            // Lock
            require(getMinStaking() <= lockAmount && lockAmount <= getMaxStaking(), "Invalid lock amount");
            lock(nAddr, lockAmount);
            // Change member
            members[memberIdx[addr]] = nAddr;
        }

        // Change node
        uint256 nodeIdx = nodeIdxFromMember[addr];
        Node storage node = nodes[nodeIdx];
        node.enode = enode;
        node.ip = ip;
        node.port = port;
        if (addr != nAddr) {
            nodeToMember[nodeIdx] = nAddr;
            nodeIdxFromMember[nAddr] = nodeIdx;
            nodeIdxFromMember[addr] = 0;
            // Unlock
            unlock(addr, lockAmount);

            emit MemberChanged(addr, nAddr);
        }
    }

    function changeGov(uint256 ballotIdx) private {
        (uint256 ballotType, uint256 state, ) = getBallotState(ballotIdx);
        require(ballotType == uint256(BallotTypes.GovernanceChange), "Not voting for applyGov");
        require(state == uint(BallotStates.InProgress), "Invalid voting state");

        address newImp = IBallotStorage(getBallotStorageAddress()).getBallotAddress(ballotIdx);
        if (newImp != address(0)) {
            setImplementation(newImp);
        }
    }

    function applyEnv(uint256 ballotIdx) private {
        (uint256 ballotType, uint256 state, ) = getBallotState(ballotIdx);
        require(ballotType == uint256(BallotTypes.EnvValChange), "Not voting for applyEnv");
        require(state == uint(BallotStates.InProgress), "Invalid voting state");

        (
            bytes32 envKey,
            uint256 envType,
            bytes memory envVal
        ) = IBallotStorage(getBallotStorageAddress()).getBallotVariable(ballotIdx);

        IEnvStorage envStorage = IEnvStorage(getEnvStorageAddress());
        if (envKey == BLOCK_PER_NAME && envType == BLOCK_PER_TYPE) {
            envStorage.setBlockPerByBytes(envVal);
        } else if (envKey == BALLOT_DURATION_MIN_NAME && envType == BALLOT_DURATION_MIN_TYPE) {
            envStorage.setBallotDurationMinByBytes(envVal);
        } else if (envKey == BALLOT_DURATION_MAX_NAME && envType == BALLOT_DURATION_MAX_TYPE) {
            envStorage.setBallotDurationMaxByBytes(envVal);
        } else if (envKey == STAKING_MIN_NAME && envType == STAKING_MIN_TYPE) {
            envStorage.setStakingMinByBytes(envVal);
        } else if (envKey == STAKING_MAX_NAME && envType == STAKING_MAX_TYPE) {
            envStorage.setStakingMaxByBytes(envVal);
        }

        emit EnvChanged(envKey, envType, envVal);
    }

    //------------------ Code reduction
    function createBallotForMemeber(
        uint256 id,
        uint256 bType,
        address creator,
        address oAddr,
        address nAddr,
        bytes enode,
        bytes ip,
        uint port
    )
        private
    {
        IBallotStorage(getBallotStorageAddress()).createBallotForMemeber(
            id, // ballot id
            bType, // ballot type
            creator, // creator
            oAddr, // old member address
            nAddr, // new member address
            enode, // new enode
            ip, // new ip
            port // new port
        );
    }

    function updateBallotLock(uint256 id, uint256 amount) private {
        IBallotStorage(getBallotStorageAddress()).updateBallotMemberLockAmount(id, amount);
    }

    function startBallot(uint256 id, uint256 s, uint256 e) private {
        IBallotStorage(getBallotStorageAddress()).startBallot(id, s, e);
    }

    function finalizeBallot(uint256 id, uint256 state) private {
        IBallotStorage(getBallotStorageAddress()).finalizeBallot(id, state);
    }

    function getBallotState(uint256 id) private view returns (uint256, uint256, bool) {
        return IBallotStorage(getBallotStorageAddress()).getBallotState(id);
    }

    function getBallotPeriod(uint256 id) private view returns (uint256, uint256, uint256) {
        return IBallotStorage(getBallotStorageAddress()).getBallotPeriod(id);
    }

    function getBallotVotingInfo(uint256 id) private view returns (uint256, uint256, uint256) {
        return IBallotStorage(getBallotStorageAddress()).getBallotVotingInfo(id);
    }

    function getBallotMember(uint256 id) private view returns (address, address, bytes, bytes, uint256, uint256) {
        return IBallotStorage(getBallotStorageAddress()).getBallotMember(id);
    }

    function lock(address addr, uint256 amount) private {
        IStaking(getStakingAddress()).lock(addr, amount);
    }

    function unlock(address addr, uint256 amount) private {
        IStaking(getStakingAddress()).unlock(addr, amount);
    }
    //------------------ Code reduction end
}

