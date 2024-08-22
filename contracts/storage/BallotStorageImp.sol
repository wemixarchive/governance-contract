// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../abstract/BallotEnums.sol";
import "../GovChecker.sol";
import "../interface/IEnvStorage.sol";
import "../interface/IBallotStorage.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract BallotStorageImp is GovChecker, BallotEnums, IBallotStorage, UUPSUpgradeable {
    event SetPrevBallotStorage(address indexed previous);

    event BallotCreated(uint256 indexed ballotId, uint256 indexed ballotType, address indexed creator);
    event BallotCanceled(uint256 indexed ballotId);
    event BallotStarted(uint256 indexed ballotId, uint256 indexed startTime, uint256 indexed endTime);

    event Voted(uint256 indexed voteid, uint256 indexed ballotId, address indexed voter, uint256 decision);

    event BallotUpdated(uint256 indexed ballotId, address indexed updatedBy);
    event BallotFinalized(uint256 indexed ballotId, uint256 state);

    struct BallotBasic {
        //Ballot ID
        uint256 id;
        //시작 시간
        uint256 startTime;
        //종료 시간
        uint256 endTime;
        // 투표 종류
        uint256 ballotType;
        // 제안자
        address creator;
        // 투표 내용
        bytes memo;
        //총 투표자수
        uint256 totalVoters;
        // 진행상태
        uint256 powerOfAccepts;
        // 진행상태
        uint256 powerOfRejects;
        // 상태
        uint256 state;
        // 완료유무
        bool isFinalized;
        // 투표 기간
        uint256 duration;
    }

    //For MemberAdding/MemberRemoval/MemberSwap
    struct BallotMember {
        uint256 id;
        address oldStakerAddress;
        address newStakerAddress;
        address newVoterAddress;
        address newRewardAddress;
        bytes newNodeName; // name
        bytes newNodeId; // admin.nodeInfo.id is 512 bit public key
        bytes newNodeIp;
        uint256 newNodePort;
        uint256 lockAmount;
    }

    //For GovernanceChange
    struct BallotAddress {
        uint256 id;
        address newGovernanceAddress;
    }

    //For EnvValChange
    struct BallotVariable {
        //Ballot ID
        uint256 id;
        bytes32 envVariableName;
        uint256 envVariableType;
        bytes envVariableValue;
    }

    struct BallotExit {
        // For exit
        uint256 unlockAmount;
        uint256 slashing;
    }

    struct BallotExecute {
        address target;
        uint256 value;
        bytes data;
    }

    struct Vote {
        uint256 voteId;
        uint256 ballotId;
        address voter;
        uint256 decision;
        uint256 power;
        uint256 time;
    }

    mapping(uint => BallotBasic) private _ballotBasicMap;
    mapping(uint => BallotMember) private _ballotMemberMap;
    mapping(uint => BallotAddress) private _ballotAddressMap;
    mapping(uint => BallotVariable) private _ballotVariableMap;

    mapping(uint => Vote) private _voteMap;
    mapping(uint => mapping(address => bool)) private _hasVotedMap;

    address private _previousBallotStorage;

    uint256 private _ballotCount;

    // For exit
    mapping(uint => BallotExit) private _ballotExitMap;

    mapping(uint => BallotExecute) private _ballotExecuteMap;

    modifier onlyGovOrCreator(uint256 _ballotId) {
        require((getContractAddress(GOV_NAME) == msg.sender) || (_ballotBasicMap[_ballotId].creator == msg.sender), "No Permission");
        _;
    }

    modifier notDisabled() {
        require(!isDisabled(), "Is Disabled");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _registry) external initializer {
        __Ownable_init();
        setRegistry(_registry);
    }

    function setPreviousBallotStorage(address _address) public onlyOwner {
        require(_address != address(0), "Invalid address");
        _previousBallotStorage = _address;
        emit SetPrevBallotStorage(_address);
    }

    //------------------ addProposal

    //For MemberAdding/MemberRemoval/MemberSwap
    function createBallotForMember(
        uint256 _id,
        uint256 _ballotType,
        uint256 _duration,
        address _creator,
        address _oldStakerAddress,
        address _newStakerAddress,
        address _newVoterAddress,
        address _newRewardAddress,
        bytes memory _newNodeName, // name
        bytes memory _newNodeId, // admin.nodeInfo.id is 512 bit public key
        bytes memory _newNodeIp,
        uint _newNodePort
    ) public override onlyGov notDisabled {
        require(
            _areMemberBallotParamValid(
                _ballotType,
                _oldStakerAddress,
                _newStakerAddress,
                _newVoterAddress,
                _newRewardAddress,
                _newNodeName,
                _newNodeId,
                _newNodeIp,
                _newNodePort
            ),
            "Invalid Parameter"
        );
        _createBallot(_id, _ballotType, _duration, _creator);
        BallotMember memory newBallot;
        newBallot.id = _id;
        newBallot.oldStakerAddress = _oldStakerAddress;
        newBallot.newStakerAddress = _newStakerAddress;
        newBallot.newVoterAddress = _newVoterAddress;
        newBallot.newRewardAddress = _newRewardAddress;
        newBallot.newNodeName = _newNodeName;
        newBallot.newNodeId = _newNodeId;
        newBallot.newNodeIp = _newNodeIp;
        newBallot.newNodePort = _newNodePort;

        _ballotMemberMap[_id] = newBallot;
    }
    // GovImp.addProposalToRemoveMember
    function createBallotForExit(uint256 _id, uint256 _unlockAmount, uint256 _slashing) public override onlyGov notDisabled {
        _ballotExitMap[_id].unlockAmount = _unlockAmount;
        _ballotExitMap[_id].slashing = _slashing;
    }

    // GovImp.addProposalToChangeGov
    function createBallotForAddress(
        uint256 _id,
        uint256 _ballotType,
        uint256 _duration,
        address _creator,
        address _newGovernanceAddress
    ) public override onlyGov notDisabled returns (uint256) {
        require(_ballotType == uint256(BallotTypes.GovernanceChange), "Invalid Ballot Type");
        require(_newGovernanceAddress != address(0), "Invalid Parameter");
        _createBallot(_id, _ballotType, _duration, _creator);
        BallotAddress memory newBallot;
        newBallot.id = _id;
        newBallot.newGovernanceAddress = _newGovernanceAddress;
        _ballotAddressMap[_id] = newBallot;
        return _id;
    }

    // GovImp.addProposalToChangeEnv
    function createBallotForVariable(
        uint256 _id,
        uint256 _ballotType,
        uint256 _duration,
        address _creator,
        bytes32 _envVariableName,
        uint256 _envVariableType,
        bytes memory _envVariableValue
    ) public override onlyGov notDisabled returns (uint256) {
        require(_areVariableBallotParamValid(_ballotType, _envVariableName, _envVariableValue), "Invalid Parameter");
        _createBallot(_id, _ballotType, _duration, _creator);
        BallotVariable memory newBallot;
        newBallot.id = _id;
        newBallot.envVariableName = _envVariableName;
        newBallot.envVariableType = _envVariableType;
        newBallot.envVariableValue = _envVariableValue;
        _ballotVariableMap[_id] = newBallot;
        return _id;
    }

    // GovImp.addProposalToExecute
    function createBallotForExecute(
        uint256 _id,
        uint256 _ballotType,
        uint256 _duration,
        address _creator,
        address _target,
        uint256 _value,
        bytes memory _calldata
    ) external override onlyGov notDisabled {
        require(_ballotType == uint256(BallotTypes.Execute), "Invalid Ballot Type");
        require(_target != address(0), "Invalid target address");
        // ballot basic
        _createBallot(_id, _ballotType, _duration, _creator);
        // ballot executeMap
        _ballotExecuteMap[_id] = BallotExecute({ target: _target, value: _value, data: _calldata });
    }

    //------------------ addProposal end

    //------------------ vote

    function createVote(uint256 _voteId, uint256 _ballotId, address _voter, uint256 _decision, uint256 _power) public override onlyGov notDisabled {
        // Check decision type
        require((_decision == uint256(DecisionTypes.Accept)) || (_decision == uint256(DecisionTypes.Reject)), "Invalid decision");
        // Check if ballot exists
        require(_ballotBasicMap[_ballotId].id == _ballotId, "not existed Ballot");
        // Check if vote exists
        require(_voteMap[_voteId].voteId != _voteId, "already existed voteId");
        // Check if voted
        require(!_hasVotedMap[_ballotId][_voter], "already voted");
        require(_ballotBasicMap[_ballotId].state == uint256(BallotStates.InProgress), "Not InProgress State");

        _voteMap[_voteId] = Vote(_voteId, _ballotId, _voter, _decision, _power, getTime());
        _updateBallotForVote(_ballotId, _voter, _decision, _power);

        emit Voted(_voteId, _ballotId, _voter, _decision);
    }

    function startBallot(uint256 _ballotId, uint256 _startTime, uint256 _endTime) public override onlyGov notDisabled {
        // XXX onlyValidTime
        require(_startTime > 0 && _endTime > 0, "start or end is 0");
        require(_endTime > _startTime, "start >= end"); // && _startTime > getTime()
        // XXX onlyValidTime end

        require(_ballotBasicMap[_ballotId].id == _ballotId, "not existed Ballot");
        require(_ballotBasicMap[_ballotId].isFinalized == false, "already finalized");
        require(_ballotBasicMap[_ballotId].state == uint256(BallotStates.Ready), "Not Ready State");

        BallotBasic storage _ballot = _ballotBasicMap[_ballotId];
        _ballot.startTime = _startTime;
        _ballot.endTime = _endTime;
        _ballot.state = uint256(BallotStates.InProgress);
        emit BallotStarted(_ballotId, _startTime, _endTime);
    }

    // finalize ballot info
    function finalizeBallot(uint256 _ballotId, uint256 _ballotState) public override onlyGov notDisabled {
        require(_ballotBasicMap[_ballotId].id == _ballotId, "not existed Ballot");
        require(_ballotBasicMap[_ballotId].isFinalized == false, "already finalized");
        require((_ballotState == uint256(BallotStates.Accepted)) || (_ballotState == uint256(BallotStates.Rejected)), "Invalid Ballot State");

        BallotBasic storage _ballot = _ballotBasicMap[_ballotId];
        _ballot.state = _ballotState;
        _ballot.isFinalized = true;
        emit BallotFinalized(_ballotId, _ballotState);
    }

    //------------------ vote end

    //------------------ update proposal

    // cancel ballot info
    function cancelBallot(uint256 _ballotId) public onlyGovOrCreator(_ballotId) notDisabled {
        require(_ballotBasicMap[_ballotId].id == _ballotId, "not existed Ballot");
        require(_ballotBasicMap[_ballotId].isFinalized == false, "already finalized");

        require(_ballotBasicMap[_ballotId].state == uint256(BallotStates.Ready), "Not Ready State");
        BallotBasic storage _ballot = _ballotBasicMap[_ballotId];
        _ballot.state = uint256(BallotStates.Canceled);
        emit BallotCanceled(_ballotId);
    }

    function updateBallotMemo(uint256 _ballotId, bytes memory _memo) public override onlyGovOrCreator(_ballotId) notDisabled {
        require(_ballotBasicMap[_ballotId].id == _ballotId, "not existed Ballot");
        require(_ballotBasicMap[_ballotId].isFinalized == false, "already finalized");
        BallotBasic storage _ballot = _ballotBasicMap[_ballotId];
        _ballot.memo = _memo;
        emit BallotUpdated(_ballotId, msg.sender);
    }

    function updateBallotDuration(uint256 _ballotId, uint256 _duration) public override onlyGovOrCreator(_ballotId) notDisabled {
        _checkValidDuration(_duration);
        require(_ballotBasicMap[_ballotId].id == _ballotId, "not existed Ballot");
        require(_ballotBasicMap[_ballotId].isFinalized == false, "already finalized");
        require(_ballotBasicMap[_ballotId].state == uint256(BallotStates.Ready), "Not Ready State");

        BallotBasic storage _ballot = _ballotBasicMap[_ballotId];
        _ballot.duration = _duration;
        emit BallotUpdated(_ballotId, msg.sender);
    }

    function updateBallotMemberLockAmount(uint256 _ballotId, uint256 _lockAmount) public override onlyGov notDisabled {
        require(_ballotBasicMap[_ballotId].id == _ballotId, "not existed Ballot");
        require(_ballotMemberMap[_ballotId].id == _ballotId, "not existed BallotMember");
        require(_ballotBasicMap[_ballotId].isFinalized == false, "already finalized");
        require(_ballotBasicMap[_ballotId].state == uint256(BallotStates.Ready), "Not Ready State");
        BallotMember storage _ballot = _ballotMemberMap[_ballotId];
        _ballot.lockAmount = _lockAmount;
        emit BallotUpdated(_ballotId, msg.sender);
    }

    //------------------ update proposal end

    //------------------ public views

    function getBallotVotingInfo(uint256 _id) public view override returns (uint256 totalVoters, uint256 powerOfAccepts, uint256 powerOfRejects) {
        BallotBasic memory tBallot = _ballotBasicMap[_id];
        totalVoters = tBallot.totalVoters;
        powerOfAccepts = tBallot.powerOfAccepts;
        powerOfRejects = tBallot.powerOfRejects;
    }

    function getBallotState(uint256 _id) public view override returns (uint256 ballotType, uint256 state, bool isFinalized) {
        BallotBasic memory tBallot = _ballotBasicMap[_id];
        ballotType = tBallot.ballotType;
        state = tBallot.state;
        isFinalized = tBallot.isFinalized;
    }
    function getBallotPeriod(uint256 _id) public view override returns (uint256 startTime, uint256 endTime, uint256 duration) {
        BallotBasic memory tBallot = _ballotBasicMap[_id];
        startTime = tBallot.startTime;
        endTime = tBallot.endTime;
        duration = tBallot.duration;
    }
    function getBallotCount() public view returns (uint256) {
        return _ballotCount;
    }

    function getBallotBasic(
        uint256 _id
    )
        public
        view
        override
        returns (
            uint256 startTime,
            uint256 endTime,
            uint256 ballotType,
            address creator,
            bytes memory memo,
            uint256 totalVoters,
            uint256 powerOfAccepts,
            uint256 powerOfRejects,
            uint256 state,
            bool isFinalized,
            uint256 duration
        )
    {
        BallotBasic memory tBallot = _ballotBasicMap[_id];
        startTime = tBallot.startTime;
        endTime = tBallot.endTime;
        ballotType = tBallot.ballotType;
        creator = tBallot.creator;
        memo = tBallot.memo;
        totalVoters = tBallot.totalVoters;
        powerOfAccepts = tBallot.powerOfAccepts;
        powerOfRejects = tBallot.powerOfRejects;
        state = tBallot.state;
        isFinalized = tBallot.isFinalized;
        duration = tBallot.duration;
    }

    function getBallotMember(
        uint256 _id
    )
        public
        view
        override
        returns (
            address oldStakerAddress,
            address newStakerAddress,
            address newVoterAddress,
            address newRewardAddress,
            bytes memory newNodeName, // name
            bytes memory newNodeId, // admin.nodeInfo.id is 512 bit public key
            bytes memory newNodeIp,
            uint256 newNodePort,
            uint256 lockAmount
        )
    {
        BallotMember storage tBallot = _ballotMemberMap[_id];
        oldStakerAddress = tBallot.oldStakerAddress;
        newStakerAddress = tBallot.newStakerAddress;
        newVoterAddress = tBallot.newVoterAddress;
        newRewardAddress = tBallot.newRewardAddress;
        newNodeName = tBallot.newNodeName;
        newNodeId = tBallot.newNodeId;
        newNodeIp = tBallot.newNodeIp;
        newNodePort = tBallot.newNodePort;
        lockAmount = tBallot.lockAmount;
    }

    function getBallotForExit(uint256 _id) public view override returns (uint256 unlockAmount, uint256 slashing) {
        unlockAmount = _ballotExitMap[_id].unlockAmount;
        slashing = _ballotExitMap[_id].slashing;
    }

    function getBallotAddress(uint256 _id) public view override returns (address newGovernanceAddress) {
        BallotAddress storage tBallot = _ballotAddressMap[_id];
        newGovernanceAddress = tBallot.newGovernanceAddress;
    }

    function getBallotVariable(
        uint256 _id
    ) public view override returns (bytes32 envVariableName, uint256 envVariableType, bytes memory envVariableValue) {
        BallotVariable storage tBallot = _ballotVariableMap[_id];
        envVariableName = tBallot.envVariableName;
        envVariableType = tBallot.envVariableType;
        envVariableValue = tBallot.envVariableValue;
    }

    function getBallotExecute(uint256 _id) external view override returns (address, uint256, bytes memory) {
        BallotExecute memory _ballot = _ballotExecuteMap[_id];
        return (_ballot.target, _ballot.value, _ballot.data);
    }

    function hasAlreadyVoted(uint56 _ballotId, address _voter) public view returns (bool) {
        return _hasVotedMap[_ballotId][_voter];
    }

    function getVote(
        uint256 _voteId
    ) public view returns (uint256 voteId, uint256 ballotId, address voter, uint256 decision, uint256 power, uint256 time) {
        require(_voteMap[_voteId].voteId == _voteId, "not existed voteId");
        Vote memory _vote = _voteMap[_voteId];
        voteId = _vote.voteId;
        ballotId = _vote.ballotId;
        voter = _vote.voter;
        decision = _vote.decision;
        power = _vote.power;
        time = _vote.time;
    }

    function getTime() public view returns (uint256) {
        return block.timestamp;
    }

    function isDisabled() public view returns (bool) {
        return (address(this) != getContractAddress(BALLOT_STORAGE_NAME));
    }

    function getMinVotingDuration() public view returns (uint256) {
        return IEnvStorage(getContractAddress(ENV_STORAGE_NAME)).getBallotDurationMin();
    }

    function getMaxVotingDuration() public view returns (uint256) {
        return IEnvStorage(getContractAddress(ENV_STORAGE_NAME)).getBallotDurationMax();
    }

    function getPreviousBallotStorage() public view returns (address) {
        return _previousBallotStorage;
    }

    //------------------ public views end

    //------------------ Code reduction for creation gas

    function _createBallot(uint256 _id, uint256 _ballotType, uint256 _duration, address _creator) private {
        _checkValidDuration(_duration);
        require(_ballotBasicMap[_id].id != _id, "Already existed ballot");

        BallotBasic memory newBallot;
        newBallot.id = _id;
        newBallot.ballotType = _ballotType;
        newBallot.creator = _creator;
        //        newBallot.memo = _memo;
        newBallot.state = uint256(BallotStates.Ready);
        newBallot.isFinalized = false;
        newBallot.duration = _duration;
        _ballotBasicMap[_id] = newBallot;
        _ballotCount = _ballotCount + 1;
        emit BallotCreated(_id, _ballotType, _creator);
    }

    // update ballot
    function _updateBallotForVote(uint256 _ballotId, address _voter, uint256 _decision, uint256 _power) private {
        // c1. actionType 범위
        require((_decision == uint256(DecisionTypes.Accept)) || (_decision == uint256(DecisionTypes.Reject)), "Invalid decision");
        // c2. ballotId 존재 하는지 확인
        require(_ballotBasicMap[_ballotId].id == _ballotId, "not existed Ballot");
        // c3. 이미 vote 했는지 확인
        require(_hasVotedMap[_ballotId][_voter] == false, "already voted");

        //1.get ballotBasic
        BallotBasic storage _ballot = _ballotBasicMap[_ballotId];
        //2. 투표 여부 등록
        _hasVotedMap[_ballotId][_voter] = true;
        //3. update totalVoters
        _ballot.totalVoters = _ballot.totalVoters + 1;
        //4. Update power of accept/reject
        if (_decision == uint256(DecisionTypes.Accept)) {
            _ballot.powerOfAccepts = _ballot.powerOfAccepts + _power;
        } else {
            _ballot.powerOfRejects = _ballot.powerOfRejects + _power;
        }
    }

    function _areMemberBallotParamValid(
        uint256 _ballotType,
        address _oldStakerAddress,
        address _newStakerAddress,
        address _newVoterAddress,
        address _newRewardAddress,
        bytes memory _newName,
        bytes memory _newNodeId, // admin.nodeInfo.id is 512 bit public key
        bytes memory _newNodeIp,
        uint _newNodePort
    ) private pure returns (bool) {
        require((_ballotType >= uint256(BallotTypes.MemberAdd)) && (_ballotType <= uint256(BallotTypes.MemberChange)), "Invalid Ballot Type");

        if (_ballotType == uint256(BallotTypes.MemberRemoval)) {
            require(_oldStakerAddress != address(0), "Invalid old staker address");
            require(_newStakerAddress == address(0), "Invalid new staker address");
            require(_newVoterAddress == address(0), "Invalid new voter address");
            require(_newRewardAddress == address(0), "Invalid new reward address");
            require(_newName.length == 0, "Invalid new node name");
            require(_newNodeId.length == 0, "Invalid new node id");
            require(_newNodeIp.length == 0, "Invalid new node IP");
            require(_newNodePort == 0, "Invalid new node Port");
        } else {
            require(_newName.length > 0, "Invalid new node name");
            require(_newNodeId.length == 64, "Invalid new node id");
            require(_newNodeIp.length > 0, "Invalid new node IP");
            require(_newNodePort > 0, "Invalid new node Port");
            if (_ballotType == uint256(BallotTypes.MemberAdd)) {
                require(_oldStakerAddress == address(0), "Invalid old staker address");
                require(_newStakerAddress != address(0), "Invalid new staker address");
                require(_newVoterAddress != address(0), "Invalid new voter address");
                require(_newRewardAddress != address(0), "Invalid new reward address");
            } else if (_ballotType == uint256(BallotTypes.MemberChange)) {
                require(_oldStakerAddress != address(0), "Invalid old staker address");
                require(_newStakerAddress != address(0), "Invalid new staker address");
                require(_newVoterAddress != address(0), "Invalid new voter address");
                require(_newRewardAddress != address(0), "Invalid new reward address");
            }
        }

        return true;
    }

    function _areVariableBallotParamValid(uint256 _ballotType, bytes32 _envVariableName, bytes memory _envVariableValue) private pure returns (bool) {
        require(_ballotType == uint256(BallotTypes.EnvValChange), "Invalid Ballot Type");
        require(_envVariableName > 0, "Invalid environment variable name");
        require(_envVariableValue.length > 0, "Invalid environment variable value");

        return true;
    }

    function _checkValidDuration(uint256 _duration) private view {
        require(getMinVotingDuration() <= _duration, "Under min value of  duration");
        require(_duration <= getMaxVotingDuration(), "Over max value of duration");
    }

    //------------------ Code reduction for creation gas end

    //------------------ Upgradeables
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[40] private __gap;
    //------------------ Upgradeables end
}
