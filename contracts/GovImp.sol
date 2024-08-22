// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./abstract/BallotEnums.sol";
import "./abstract/EnvConstants.sol";
import "./abstract/AGov.sol";

import "./interface/IBallotStorage.sol";
import "./interface/IEnvStorage.sol";
import "./interface/IStaking.sol";

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract GovImp is AGov, ReentrancyGuardUpgradeable, BallotEnums, EnvConstants, UUPSUpgradeable {
    enum VariableTypes {
        Invalid,
        Int,
        Uint,
        Uint2,
        Uint3,
        Uint4,
        Address,
        Bytes32,
        Bytes,
        String
    }

    event MemberAdded(address indexed addr, address indexed voter);
    event MemberRemoved(address indexed addr, address indexed voter);
    event MemberChanged(address indexed oldAddr, address indexed newAddr, address indexed newVoter);
    event EnvChanged(bytes32 envName, uint256 envType, bytes envVal);
    event MemberUpdated(address indexed addr, address indexed voter);
    event Executed(bool indexed success, address indexed to, uint256 value, bytes calldatas, bytes returnData);
    // added for case that ballot's result could not be applicable.
    event NotApplicable(uint256 indexed ballotId, string reason);
    event FailReturnValue(uint256 indexed ballotIdx, address indexed creator, uint256 value, bytes result);

    event SetProposalTimePeriod(uint256 newPeriod);
    // added for announced that migration gov data
    event GovDataMigrated(address indexed from);

    struct MemberInfo {
        address staker;
        address voter; // voter
        address reward;
        bytes name;
        bytes enode;
        bytes ip;
        uint256 port;
        uint256 lockAmount;
        bytes memo;
        uint256 duration;
    }

    address constant ZERO = address(0);
    uint256 public proposal_time_period;
    mapping(address => uint256) public lastAddProposalTime;

    modifier whenAddProposal() {
        _whenAddProposal();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function init(address registry, uint256 lockAmount, bytes memory name, bytes memory enode, bytes memory ip, uint port) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
        setRegistry(registry);

        require(lockAmount >= getMinStaking() && getMaxStaking() >= lockAmount, "Invalid lock amount");

        // Lock
        IStaking staking = IStaking(getContractAddress(STAKING_NAME));
        require(staking.availableBalanceOf(msg.sender) >= lockAmount, "Insufficient staking");
        staking.lock(msg.sender, lockAmount);

        // Add voting member
        memberLength = 1;
        voters[memberLength] = msg.sender;
        voterIdx[msg.sender] = memberLength;

        // Add reward member
        rewards[memberLength] = msg.sender;
        rewardIdx[msg.sender] = memberLength;

        stakers[memberLength] = msg.sender;
        stakerIdx[msg.sender] = memberLength;

        // Add node
        nodeLength = 1;
        Node storage node = nodes[nodeLength];
        node.name = name;
        node.enode = enode;
        node.ip = ip;
        node.port = port;
        checkNodeName[name] = true;
        checkNodeEnode[enode] = true;

        checkNodeIpPort[keccak256(abi.encodePacked(ip, port))] = true;

        nodeIdxFromMember[msg.sender] = nodeLength;
        nodeToMember[nodeLength] = msg.sender;

        modifiedBlock = block.number;
        emit MemberAdded(msg.sender, msg.sender);
    }

    function initOnce(address registry, uint256 lockAmount, bytes memory data) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
        setRegistry(registry);

        // _initialized = true;
        modifiedBlock = block.number;

        // Lock
        IStaking staking = IStaking(getContractAddress(STAKING_NAME));

        require(lockAmount >= getMinStaking() && getMaxStaking() >= lockAmount, "Invalid lock amount");

        // []{uint staker, uint voter, uint reward, bytes name, bytes enode, bytes ip, uint port}
        // 32 bytes, 32 bytes, 32 bytes, [32 bytes, <data>] * 3, 32 bytes
        address staker;
        address voter;
        address reward;
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
                staker := mload(ix)
            }
            ix += 0x20;
            require(ix < eix);

            assembly {
                voter := mload(ix)
            }
            ix += 0x20;
            require(ix < eix);

            assembly {
                reward := mload(ix)
            }
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
            require(!isMember(staker) && !isMember(voter) && !isReward(reward), "Already member");
            voters[idx] = voter;
            voterIdx[voter] = idx;
            rewards[idx] = reward;
            rewardIdx[reward] = idx;
            stakers[idx] = staker;
            stakerIdx[staker] = idx;
            emit MemberAdded(staker, voter); // staker, voter

            require(staking.availableBalanceOf(staker) >= lockAmount, "Insufficient staking");

            require(_checkNodeInfoAdd(name, enode, ip, port), "Duplicated node info");

            _lock(staker, lockAmount);

            Node storage node = nodes[idx];
            node.name = name;
            node.enode = enode;
            node.ip = ip;
            node.port = port;
            // checkNodeInfo[getNodeInfoHash(enode, ip, port)] = true;
            checkNodeName[name] = true;
            checkNodeEnode[enode] = true;
            checkNodeIpPort[keccak256(abi.encodePacked(ip, port))] = true;

            nodeToMember[idx] = staker;
            nodeIdxFromMember[staker] = idx;
        }
        memberLength = idx;
        nodeLength = idx;
    }

    function reInit() external reinitializer(2) onlyOwner {
        unchecked {
            for (uint256 i = 0; i < getMemberLength(); i++) {
                Node memory node = nodes[i];
                checkNodeName[node.name] = true;
                checkNodeEnode[node.enode] = true;
                checkNodeIpPort[keccak256(abi.encodePacked(node.ip, node.port))] = true;
            }
        }
    }

    function initMigration(address registry, uint256 oldModifiedBlock, address oldOwner) external override initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
        setRegistry(registry);

        modifiedBlock = oldModifiedBlock;
        transferOwnership(oldOwner);
        emit GovDataMigrated(msg.sender);
    }

    function migrateFromLegacy(address oldGov) external initializer returns (int256) {
        __ReentrancyGuard_init();
        __Ownable_init();

        GovImp ogov = GovImp(oldGov);
        setRegistry(address(ogov.reg()));
        modifiedBlock = block.number;
        transferOwnership(ogov.owner());

        unchecked {
            for (uint256 i = 1; i <= ogov.getMemberLength(); i++) {
                stakers[i] = ogov.getMember(i);
                stakerIdx[stakers[i]] = i;
                voters[i] = ogov.getVoter(i);
                voterIdx[voters[i]] = i;
                rewards[i] = ogov.getReward(i);
                rewardIdx[rewards[i]] = i;
                memberLength = i;

                Node memory node;
                (node.name, node.enode, node.ip, node.port) = ogov.getNode(i);
                require(_checkNodeInfoChange(node.name, node.enode, node.ip, node.port, node), "node info is duplicated");
                checkNodeName[node.name] = true;
                checkNodeEnode[node.enode] = true;
                checkNodeIpPort[keccak256(abi.encodePacked(node.ip, node.port))] = true;
                nodes[i] = node;
                nodeIdxFromMember[stakers[i]] = i;
                nodeToMember[i] = stakers[i];
                nodeLength = i;
                lastAddProposalTime[stakers[i]] = ogov.lastAddProposalTime(stakers[i]);
            }
        }

        proposal_time_period = ogov.proposal_time_period();

        ballotLength = ogov.ballotLength();
        voteLength = ogov.voteLength();
        ballotInVoting = ogov.getBallotInVoting();

        return 0;
    }

    function setProposalTimePeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod < 1 hours, "newPeriod is too long");
        proposal_time_period = newPeriod;
        emit SetProposalTimePeriod(newPeriod);
    }

    //------------------ addProposal

    //Add member address = staker address = voter address
    function addProposalToAddMember(MemberInfo memory info) external whenAddProposal returns (uint256 ballotIdx) {
        _checkMemberInfo(info);
        require(!isMember(info.staker) && !isReward(info.staker), "Already member");
        require(info.staker == info.voter && info.staker == info.reward, "Staker is not voter");
        require(_checkNodeInfoAdd(info.name, info.enode, info.ip, info.port), "Duplicated node info");
        ballotIdx = ballotLength + 1;
        _createBallotForMember(
            ballotIdx, // ballot id
            uint256(BallotTypes.MemberAdd), // ballot type
            msg.sender, // creator
            ZERO, // old staker address
            info
        );
        _updateBallotLock(ballotIdx, info.lockAmount);
        _updateBallotMemo(ballotIdx, info.memo);
        ballotLength = ballotIdx;
    }

    function addProposalToRemoveMember(
        address staker,
        uint256 lockAmount,
        bytes memory memo,
        uint256 duration,
        uint256 unlockAmount,
        uint256 slashing
    ) external whenAddProposal returns (uint256 ballotIdx) {
        require(staker != ZERO, "Invalid address");
        require(isMember(staker), "Non-member");
        require(getMemberLength() > 1, "Cannot remove a sole member");
        require(_lockedBalanceOf(staker) >= lockAmount, "Insufficient balance that can be unlocked.");
        ballotIdx = ballotLength + 1;

        MemberInfo memory info = MemberInfo(
            ZERO, // new staker address
            ZERO,
            ZERO,
            new bytes(0), // new name
            new bytes(0), // new enode
            new bytes(0), // new ip
            0, // new port
            lockAmount,
            memo,
            duration
        );
        _createBallotForMember(
            ballotIdx, // ballot id
            uint256(BallotTypes.MemberRemoval), // ballot type
            msg.sender,
            staker,
            info
        );
        _updateBallotLock(ballotIdx, lockAmount);
        _updateBallotMemo(ballotIdx, memo);
        _createBallotForExit(ballotIdx, unlockAmount, slashing);
        ballotLength = ballotIdx;
    }

    // voter A, staker A -> voter B, staker B Ok with voting
    // voter A, staker B -> voter C, staker C Ok with voting
    // voter A, staker B -> voter A, staker A Ok with voting
    // voter A call : voter A, staker A -> voter A, staker B X
    // staker A call : voter A, staker A-> voter B, staker A Ok without voting
    // only staker A call : voter B, staker A, reward C -> voter B, staker A, reward D Ok without voting only (voter can not change reward)
    // staker only change own info
    // voter can propose and vote anything
    function addProposalToChangeMember(
        MemberInfo memory newInfo,
        address oldStaker,
        uint256 unlockAmount,
        uint256 slashing
    ) external whenAddProposal returns (uint256 ballotIdx) {
        _checkMemberInfo(newInfo);
        require(oldStaker != ZERO, "Invalid old Address");
        require(isMember(oldStaker), "Non-member");

        require(
            (voters[stakerIdx[oldStaker]] == newInfo.voter ||
                newInfo.voter == oldStaker ||
                ((!isMember(newInfo.voter)) && !isReward(newInfo.voter))) &&
                (rewards[stakerIdx[oldStaker]] == newInfo.reward ||
                    newInfo.reward == oldStaker ||
                    ((!isMember(newInfo.reward)) && !isReward(newInfo.reward))),
            "Already a member"
        );
        // For exit
        if (msg.sender == oldStaker && oldStaker == newInfo.staker) {
            // Change member enviroment, finalized
            require(unlockAmount == 0 && slashing == 0, "Invalid proposal");
        } else if (oldStaker != newInfo.staker /* && msg.sender != oldStaker */) {
            // Propose Change or Exit member by other.
            require(unlockAmount + slashing <= getMinStaking(), "Invalid amount: (unlockAmount + slashing) must be equal or low to minStaking");
        }

        ballotIdx = ballotLength + 1;
        _createBallotForMember(
            ballotIdx, // ballot id
            uint256(BallotTypes.MemberChange), // ballot type
            msg.sender, // creator
            oldStaker, // old staker address
            newInfo
        );
        _updateBallotLock(ballotIdx, newInfo.lockAmount);
        _updateBallotMemo(ballotIdx, newInfo.memo);
        _createBallotForExit(ballotIdx, unlockAmount, slashing);
        ballotLength = ballotIdx;
        // 요청자 == 변경할 voting 주소
        if (msg.sender == oldStaker && oldStaker == newInfo.staker) {
            (, , uint256 duration) = _getBallotPeriod(ballotIdx);
            _startBallot(ballotIdx, block.timestamp, block.timestamp + duration);
            _finalizeVote(ballotIdx, uint256(BallotTypes.MemberChange), true, true);
        }
    }

    /* XXX
     * ABI 가 변경되어 수정할 수는 없지만 ChangeGov, ChangeEnv 에서
     * ChangeGov 는 Gov 를 Upgrade 하고
     * ChangeEnv 는 값을 바꾸는 동작 인데
     * 같은 Change 으로 시작해서 혼동을 줄 수 있다.
     *  addProposalToUpgradeGov 으로 바꾸는것도 좋을것 같다.
     */
    function addProposalToChangeGov(address newGovAddr, bytes memory memo, uint256 duration) external whenAddProposal returns (uint256 ballotIdx) {
        require(newGovAddr != ZERO, "Implementation cannot be zero");
        require(newGovAddr != _getImplementation(), "Same contract address");
        //check newGov has proxiableUUID
        try IERC1822Proxiable(newGovAddr).proxiableUUID() returns (bytes32 slot) {
            require(slot == _IMPLEMENTATION_SLOT, "ERC1967Upgrade: unsupported proxiableUUID");
        } catch {
            revert("ERC1967Upgrade: new implementation is not UUPS");
        }
        ballotIdx = ballotLength + 1;
        IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).createBallotForAddress(
            ballotLength + 1, // ballot id
            uint256(BallotTypes.GovernanceChange), // ballot type
            duration,
            msg.sender, // creator
            newGovAddr // new governance address
        );
        _updateBallotMemo(ballotIdx, memo);
        ballotLength = ballotIdx;
    }

    function addProposalToChangeEnv(
        bytes32 envName,
        uint256 envType,
        bytes memory envVal,
        bytes memory memo,
        uint256 duration
    ) external whenAddProposal returns (uint256 ballotIdx) {
        // require(envName != 0, "Invalid name");
        require(uint256(VariableTypes.Int) <= envType && envType <= uint256(VariableTypes.String), "Invalid type");
        require(_checkVariableCondition(envName, envVal), "Invalid value");

        ballotIdx = ballotLength + 1;
        IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).createBallotForVariable(
            ballotIdx, // ballot id
            uint256(BallotTypes.EnvValChange), // ballot type
            duration,
            msg.sender, // creator
            envName, // env name
            envType, // env type
            envVal // env value
        );
        _updateBallotMemo(ballotIdx, memo);
        ballotLength = ballotIdx;
    }

    function addProposalToExecute(address _target, bytes memory _calldata, bytes memory _memo, uint256 _duration) external payable whenAddProposal {
        require(_target != ZERO, "target cannot be zero");

        address _creator = msg.sender;
        if (msg.value != 0) {
            (bool _ok, ) = _creator.call{ value: 0 }("");
            require(_ok, "creator is not payable");
        }

        uint256 _ballotIdx = ballotLength + 1;

        IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).createBallotForExecute(
            _ballotIdx, // ballot id
            uint256(BallotTypes.Execute), // ballot type
            _duration,
            _creator, // creator
            _target,
            msg.value,
            _calldata
        );
        _updateBallotMemo(_ballotIdx, _memo);
        ballotLength = _ballotIdx;
    }

    //------------------ addProposal end

    //------------------ vote

    function vote(uint256 ballotIdx, bool approval) external nonReentrant onlyGovMem {
        // XXX checkLockedAmount
        _checkLockedAmount();

        // Check if some ballot is in progress
        require(checkUnfinalized(), "Expired");

        // Check if the ballot can be voted
        uint256 ballotType = _checkVotable(ballotIdx);
        // Vote
        _createVote(ballotIdx, approval);
        // Finalize
        (, uint256 accept, uint256 reject) = _getBallotVotingInfo(ballotIdx);
        uint256 threshold = getThreshold();
        if (accept >= threshold || reject >= threshold || (accept + reject) == 10000) {
            _finalizeVote(ballotIdx, ballotType, accept > reject, false);
        }
    }

    function finalizeEndedVote() public onlyGovMem {
        require(!checkUnfinalized(), "Voting is not ended");
        _finalizeBallot(ballotInVoting, uint256(BallotStates.Rejected));
        ballotInVoting = 0;
    }

    //------------------ vote end

    //------------------ work approved proposal

    function _addMember(uint256 ballotIdx) private returns (bool) {
        _fromValidBallot(ballotIdx, uint256(BallotTypes.MemberAdd));

        (
            ,
            address newStaker,
            address newVoter,
            address newReward,
            bytes memory name,
            bytes memory enode,
            bytes memory ip,
            uint port,
            uint256 lockAmount
        ) = _getBallotMember(ballotIdx);
        if (isMember(newStaker)) {
            // new staker is already a member or a voter/
            emit NotApplicable(ballotIdx, "Already a member");
            return false;
        }
        if (isReward(newReward)) {
            // new staker is already a member or a voter/
            emit NotApplicable(ballotIdx, "Already a rewarder");
            return false;
        }

        // Lock
        if (lockAmount < getMinStaking() || getMaxStaking() < lockAmount) {
            emit NotApplicable(ballotIdx, "Invalid lock amount");
            return false;
        }

        if (_availableBalanceOf(newStaker) < lockAmount) {
            emit NotApplicable(ballotIdx, "Insufficient balance that can be locked");
            return false;
        }

        if (newStaker != newVoter && newStaker != newReward) {
            emit NotApplicable(ballotIdx, "Invalid member address");
            return false;
        }

        _lock(newStaker, lockAmount);

        // Add voting and reward member
        uint256 nMemIdx = memberLength + 1;
        voters[nMemIdx] = newVoter;
        voterIdx[newVoter] = nMemIdx;
        rewards[nMemIdx] = newReward;
        rewardIdx[newReward] = nMemIdx;
        stakers[nMemIdx] = newStaker;
        stakerIdx[newStaker] = nMemIdx;

        // Add node
        uint256 nNodeIdx = nodeLength + 1;
        Node storage node = nodes[nNodeIdx];

        node.name = name;
        node.enode = enode;
        node.ip = ip;
        node.port = port;
        // checkNodeInfo[getNodeInfoHash(enode, ip, port)] = true;
        checkNodeName[name] = true;
        checkNodeEnode[enode] = true;
        checkNodeIpPort[keccak256(abi.encodePacked(ip, port))] = true;

        nodeToMember[nNodeIdx] = newStaker;
        nodeIdxFromMember[newStaker] = nNodeIdx;
        memberLength = nMemIdx;
        nodeLength = nNodeIdx;
        modifiedBlock = block.number;
        emit MemberAdded(newStaker, newVoter);
        return true;
    }

    function _removeMember(uint256 ballotIdx) private {
        _fromValidBallot(ballotIdx, uint256(BallotTypes.MemberRemoval));

        (address oldStaker, , , , , , , , ) = _getBallotMember(ballotIdx);
        if (!isMember(oldStaker)) {
            emit NotApplicable(ballotIdx, "Not already a member");
            return; // Non-member. it is abnormal case, but passed
        }

        // Remove voting and reward member
        uint256 removeIdx = stakerIdx[oldStaker];
        address endAddr = stakers[memberLength];
        address oldVoter = voters[removeIdx];
        address oldReward = rewards[removeIdx];

        if (stakerIdx[oldStaker] != memberLength) {
            (stakers[removeIdx], stakers[memberLength], stakerIdx[oldStaker], stakerIdx[endAddr]) = (
                stakers[memberLength],
                ZERO,
                0,
                stakerIdx[oldStaker]
            );
            removeIdx = rewardIdx[oldStaker];
            endAddr = rewards[memberLength];
            (rewards[removeIdx], rewards[memberLength], rewardIdx[oldReward], rewardIdx[endAddr]) = (
                rewards[memberLength],
                ZERO,
                0,
                rewardIdx[oldReward]
            );
            removeIdx = voterIdx[oldStaker];
            endAddr = voters[memberLength];
            (voters[removeIdx], voters[memberLength], voterIdx[oldVoter], voterIdx[endAddr]) = (voters[memberLength], ZERO, 0, voterIdx[oldVoter]);
        } else {
            stakers[memberLength] = ZERO;
            stakerIdx[oldStaker] = 0;
            rewards[memberLength] = ZERO;
            rewardIdx[oldReward] = 0;
            voters[memberLength] = ZERO;
            voterIdx[oldVoter] = 0;
        }
        memberLength = memberLength - 1;
        // Remove node

        Node storage node = nodes[removeIdx];
        checkNodeEnode[node.enode] = false;
        checkNodeName[node.name] = false;
        checkNodeIpPort[keccak256(abi.encodePacked(node.ip, node.port))] = false;
        if (nodeIdxFromMember[oldStaker] != nodeLength) {
            removeIdx = nodeIdxFromMember[oldStaker];
            endAddr = nodeToMember[nodeLength];

            node.name = nodes[nodeLength].name;
            node.enode = nodes[nodeLength].enode;
            node.ip = nodes[nodeLength].ip;
            node.port = nodes[nodeLength].port;

            nodeToMember[removeIdx] = endAddr;
            nodeIdxFromMember[endAddr] = removeIdx;
        }
        nodeToMember[nodeLength] = ZERO;
        nodeIdxFromMember[oldStaker] = 0;
        delete nodes[nodeLength];
        nodeLength = nodeLength - 1;
        modifiedBlock = block.number;
        // Unlock and transfer remained to governance
        _transferLockedAndUnlock(ballotIdx, oldStaker);

        emit MemberRemoved(oldStaker, oldVoter);
    }

    function _changeMember(uint256 ballotIdx, bool self) private returns (bool) {
        // isMember=> isStaker and isVoter
        // vote => onlyVoter, staker can change voter without voting, default = staker == voter
        // voter can change staker with voting.(changeMember)
        if (!self) {
            _fromValidBallot(ballotIdx, uint256(BallotTypes.MemberChange));
        }

        (
            address oldStaker,
            address newStaker,
            address newVoter,
            address newReward,
            bytes memory name,
            bytes memory enode,
            bytes memory ip,
            uint port,
            uint256 lockAmount
        ) = _getBallotMember(ballotIdx);
        if (!isMember(oldStaker)) {
            emit NotApplicable(ballotIdx, "Old address is not a member");
            return false; // Non-member. it is abnormal case.
        }

        if (!_checkChangeMember(ballotIdx, self, oldStaker, newStaker, newVoter, newReward, name, enode, ip, port, lockAmount)) return false;

        //old staker
        uint256 memberIdx = stakerIdx[oldStaker];
        if (oldStaker != newStaker) {
            // Change member
            stakers[memberIdx] = newStaker;
            stakerIdx[newStaker] = memberIdx;
            stakerIdx[oldStaker] = 0;

            _lock(newStaker, lockAmount);
        }
        // Change node
        uint256 nodeIdx = nodeIdxFromMember[oldStaker];
        {
            Node storage node = nodes[nodeIdx];

            checkNodeName[node.name] = false;
            checkNodeEnode[node.enode] = false;
            checkNodeIpPort[keccak256(abi.encodePacked(node.ip, node.port))] = false;

            node.name = name;
            node.enode = enode;
            node.ip = ip;
            node.port = port;
            modifiedBlock = block.number;
            // checkNodeInfo[getNodeInfoHash(enode, ip, port)] = true;
            checkNodeName[name] = true;
            checkNodeEnode[enode] = true;
            checkNodeIpPort[keccak256(abi.encodePacked(ip, port))] = true;
        }

        {
            address oldReward = rewards[memberIdx];
            if (oldReward != newReward) {
                rewards[memberIdx] = newReward;
                rewardIdx[newReward] = memberIdx;
                rewardIdx[oldReward] = 0;
            }
        }
        {
            address oldVoter = voters[memberIdx];
            if (oldVoter != newVoter) {
                voters[memberIdx] = newVoter;
                voterIdx[newVoter] = memberIdx;
                voterIdx[oldVoter] = 0;
            }
        }

        if (oldStaker != newStaker) {
            nodeToMember[nodeIdx] = newStaker;
            nodeIdxFromMember[newStaker] = nodeIdx;
            nodeIdxFromMember[oldStaker] = 0;

            // Unlock and transfer remained to governance
            _transferLockedAndUnlock(ballotIdx, oldStaker);

            emit MemberChanged(oldStaker, newStaker, newVoter);
        } else {
            emit MemberUpdated(oldStaker, newStaker);
        }
        return true;
    }

    function _changeGov(uint256 ballotIdx) private {
        _fromValidBallot(ballotIdx, uint256(BallotTypes.GovernanceChange));

        address newImp = IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).getBallotAddress(ballotIdx);
        if (newImp != ZERO) {
            _authorizeUpgrade(newImp);
            _upgradeToAndCallUUPS(newImp, new bytes(0), false);
            modifiedBlock = block.number;
        }
    }

    function _changeEnv(uint256 ballotIdx) private {
        _fromValidBallot(ballotIdx, uint256(BallotTypes.EnvValChange));

        (bytes32 envKey, uint256 envType, bytes memory envVal) = IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).getBallotVariable(ballotIdx);

        IEnvStorage envStorage = IEnvStorage(getContractAddress(ENV_STORAGE_NAME));
        envStorage.setVariable(envKey, envVal);
        modifiedBlock = block.number;

        emit EnvChanged(envKey, envType, envVal);
    }

    function _execute(uint256 _ballotIdx) private {
        _fromValidBallot(_ballotIdx, uint256(BallotTypes.Execute));
        IBallotStorage _ballotStorage = IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME));

        (address _target, uint256 _value, bytes memory _calldata) = _ballotStorage.getBallotExecute(_ballotIdx);
        (bool _success, bytes memory _returnData) = _target.call{ value: _value }(_calldata);

        modifiedBlock = block.number;
        emit Executed(_success, _target, _value, _calldata, _returnData);

        if (!_success) _returnValueToCreator(_ballotStorage, _ballotIdx, _value);
    }

    //------------------ work approved proposal end

    //------------------ public views

    function getMinStaking() public view returns (uint256) {
        return IEnvStorage(getContractAddress(ENV_STORAGE_NAME)).getStakingMin();
    }

    function getMaxStaking() public view returns (uint256) {
        return IEnvStorage(getContractAddress(ENV_STORAGE_NAME)).getStakingMax();
    }

    function getMinVotingDuration() public view returns (uint256) {
        return IEnvStorage(getContractAddress(ENV_STORAGE_NAME)).getBallotDurationMin();
    }

    function getMaxVotingDuration() public view returns (uint256) {
        return IEnvStorage(getContractAddress(ENV_STORAGE_NAME)).getBallotDurationMax();
    }

    // 50.01% from 5001 of 10000
    function getThreshold() public pure returns (uint256) {
        return 5001;
    }

    function checkUnfinalized() public view returns (bool) {
        if (ballotInVoting != 0) {
            (, uint256 state, ) = _getBallotState(ballotInVoting);
            (, uint256 endTime, ) = _getBallotPeriod(ballotInVoting);
            if (state == uint256(BallotStates.InProgress)) {
                if (endTime < block.timestamp) return false;
                // require(endTime > block.timestamp, "Expired");
                // require(ballotIdx == ballotInVoting, "Now in voting with different ballot");
                // if (endTime < block.timestamp) {

                //     _finalizeBallot(ballotInVoting, uint256(BallotStates.Rejected));
                //     ballotInVoting = 0;
                //     // console.log("vote is finalized %s", ballotInVoting);
                // } else if (ballotIdx != ballotInVoting) {
                //     revert("Now in voting with different ballot");
                // }
            }
        }
        return true;
    }

    function getStakerAddr(address _addr) public view returns (address staker) {
        if (isStaker(_addr)) staker = _addr;
        else if (isVoter(_addr)) staker = stakers[voterIdx[_addr]];
    }

    //------------------ public views end

    //------------------ Code reduction for creation gas

    function _checkChangeMember(
        uint256 ballotIdx,
        bool self,
        address oldStaker,
        address newStaker,
        address newVoter,
        address newReward,
        bytes memory name,
        bytes memory enode,
        bytes memory ip,
        uint256 port,
        uint256 lockAmount
    ) private returns (bool) {
        if (!self) {
            _fromValidBallot(ballotIdx, uint256(BallotTypes.MemberChange));
        }

        if (!isMember(oldStaker)) {
            emit NotApplicable(ballotIdx, "Old address is not a member");
            return false; // Non-member. it is abnormal case.
        }

        //old staker
        uint256 memberIdx = stakerIdx[oldStaker];
        if (oldStaker != newStaker) {
            if (isMember(newStaker)) {
                emit NotApplicable(ballotIdx, "new address is already a member");
                return false; // already member. it is abnormal case.
            }
            if (newStaker != newVoter && newStaker != newReward) {
                emit NotApplicable(ballotIdx, "Invalid voter address");
                return false;
            }
            // Lock
            if (lockAmount < getMinStaking() || getMaxStaking() < lockAmount) {
                emit NotApplicable(ballotIdx, "Invalid lock amount");
                return false;
            }
            if (_availableBalanceOf(newStaker) < lockAmount) {
                emit NotApplicable(ballotIdx, "Insufficient balance that can be locked");
                return false;
            }
        }
        // Change node
        uint256 nodeIdx = nodeIdxFromMember[oldStaker];
        {
            Node memory node = nodes[nodeIdx];

            if (
                //if node info is not same
                // node info can not duplicate
                !_checkNodeInfoChange(name, enode, ip, port, node)
            ) {
                emit NotApplicable(ballotIdx, "Duplicated node info");
                return false;
            }
        }

        {
            address oldReward = rewards[memberIdx];
            if ((oldStaker != newReward) && (oldReward != newReward) && (isMember(newReward) || isReward(newReward))) {
                emit NotApplicable(ballotIdx, "Invalid reward address");
                return false;
            }
        }
        {
            address oldVoter = voters[memberIdx];
            if ((oldStaker != newVoter) && (oldVoter != newVoter) && (isMember(newVoter) || isReward(newVoter))) {
                emit NotApplicable(ballotIdx, "Invalid voters address");
                return false;
            }
        }
        return true;
    }

    function _checkVotable(uint256 ballotIdx) private returns (uint256) {
        (uint256 ballotType, uint256 state, ) = _getBallotState(ballotIdx);
        if (state == uint256(BallotStates.Ready)) {
            require(ballotInVoting == 0, "Now in voting with different ballot");
            (, , uint256 duration) = _getBallotPeriod(ballotIdx);
            if (duration < getMinVotingDuration()) {
                _startBallot(ballotIdx, block.timestamp, block.timestamp + getMinVotingDuration());
            } else if (getMaxVotingDuration() < duration) {
                _startBallot(ballotIdx, block.timestamp, block.timestamp + getMaxVotingDuration());
            } else {
                _startBallot(ballotIdx, block.timestamp, block.timestamp + duration);
            }
            ballotInVoting = ballotIdx;
        } else if (state == uint256(BallotStates.InProgress)) {
            // Nothing to do
            require(ballotIdx == ballotInVoting, "Now in voting with different ballot");
        } else {
            // canceled
            revert("Expired");
        }
        return ballotType;
    }

    function _createVote(uint256 ballotIdx, bool approval) private {
        uint256 voteIdx = voteLength + 1;
        address staker = getStakerAddr(msg.sender);
        uint256 weight = 10000 / getMemberLength(); //IStaking(getContractAddress(STAKING_NAME)).calcVotingWeightWithScaleFactor(staker, 10000);
        uint256 decision = approval ? uint256(DecisionTypes.Accept) : uint256(DecisionTypes.Reject);
        IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).createVote(voteIdx, ballotIdx, staker, decision, weight);
        voteLength = voteIdx;
    }

    function _finalizeVote(uint256 ballotIdx, uint256 ballotType, bool isAccepted, bool self) private {
        uint256 ballotState = uint256(BallotStates.Rejected);
        if (isAccepted) {
            ballotState = uint256(BallotStates.Accepted);

            if (ballotType == uint256(BallotTypes.MemberAdd)) {
                if (!_addMember(ballotIdx)) {
                    ballotState = uint256(BallotStates.Rejected);
                }
            } else if (ballotType == uint256(BallotTypes.MemberRemoval)) {
                _removeMember(ballotIdx);
            } else if (ballotType == uint256(BallotTypes.MemberChange)) {
                if (!_changeMember(ballotIdx, self)) {
                    ballotState = uint256(BallotStates.Rejected);
                }
            } else if (ballotType == uint256(BallotTypes.GovernanceChange)) {
                _changeGov(ballotIdx);
            } else if (ballotType == uint256(BallotTypes.EnvValChange)) {
                _changeEnv(ballotIdx);
            } else if (ballotType == uint256(BallotTypes.Execute)) {
                _execute(ballotIdx);
            }
        } else {
            if (ballotType == uint256(BallotTypes.Execute)) {
                IBallotStorage _ballotStorage = IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME));
                (, uint256 _value, ) = _ballotStorage.getBallotExecute(ballotIdx);
                _returnValueToCreator(_ballotStorage, ballotIdx, _value);
            }
        }
        _finalizeBallot(ballotIdx, ballotState);
        if (!self) ballotInVoting = 0;
    }

    function _fromValidBallot(uint256 ballotIdx, uint256 targetType) private view {
        (uint256 ballotType, uint256 state, ) = _getBallotState(ballotIdx);
        require(ballotType == targetType, "Invalid voting type");
        require(state == uint(BallotStates.InProgress), "Invalid voting state");
        (, uint256 accept, uint256 reject) = _getBallotVotingInfo(ballotIdx);
        require(accept >= getThreshold() || reject >= getThreshold() || (accept + reject) == 10000, "Not yet finalized");
    }

    function _createBallotForMember(uint256 id, uint256 bType, address creator, address oAddr, MemberInfo memory info) private {
        IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).createBallotForMember(
            id, // ballot id
            bType, // ballot type
            info.duration,
            creator, // creator
            oAddr, // old member address
            info.staker, // new member address
            info.voter, // old staker address
            info.reward, // new staker address
            info.name, // new name
            info.enode, // new enode
            info.ip, // new ip
            info.port // new port
        );
    }

    function _updateBallotLock(uint256 id, uint256 amount) private {
        IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).updateBallotMemberLockAmount(id, amount);
    }

    function _updateBallotMemo(uint256 id, bytes memory memo) private {
        IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).updateBallotMemo(id, memo);
    }

    function _createBallotForExit(uint256 id, uint256 unlockAmount, uint256 slashing) private {
        IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).createBallotForExit(id, unlockAmount, slashing);
    }

    function _startBallot(uint256 id, uint256 s, uint256 e) private {
        IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).startBallot(id, s, e);
    }

    function _finalizeBallot(uint256 id, uint256 state) private {
        IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).finalizeBallot(id, state);
    }

    function _lock(address addr, uint256 amount) private {
        IStaking(getContractAddress(STAKING_NAME)).lock(addr, amount);
    }

    function _unlock(address addr, uint256 amount) private {
        IStaking(getContractAddress(STAKING_NAME)).unlock(addr, amount);
    }

    function _transferLockedAndUnlock(uint256 ballotIdx, address addr) private {
        (uint256 unlockAmount, uint256 slashing) = _getBallotForExit(ballotIdx);

        require(unlockAmount + slashing <= getMinStaking(), "minStaking value must be greater than or equal to the sum of unlockAmount, slashing");

        IStaking staking = IStaking(getContractAddress(STAKING_NAME));
        uint256 locked = staking.lockedBalanceOf(addr);
        uint256 ext = locked - getMinStaking();

        if (locked > unlockAmount) {
            _unlock(addr, unlockAmount);
            staking.transferLocked(addr, slashing, ext);
        } else {
            _unlock(addr, locked);
        }
    }

    function _returnValueToCreator(IBallotStorage _ballotStorage, uint256 _ballotIDx, uint256 _value) private {
        if (_value == 0) return;

        (, , , address _creator, , , , , , , ) = _ballotStorage.getBallotBasic(_ballotIDx);
        (bool _ok, bytes memory _returnData) = _creator.call{ value: _value }("");
        if (!_ok) {
            emit FailReturnValue(_ballotIDx, _creator, _value, _returnData);
        }
    }

    function _getBallotState(uint256 id) private view returns (uint256, uint256, bool) {
        return IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).getBallotState(id);
    }

    function _getBallotPeriod(uint256 id) private view returns (uint256, uint256, uint256) {
        return IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).getBallotPeriod(id);
    }

    function _getBallotVotingInfo(uint256 id) private view returns (uint256, uint256, uint256) {
        return IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).getBallotVotingInfo(id);
    }

    function _getBallotMember(
        uint256 id
    ) private view returns (address, address, address, address, bytes memory, bytes memory, bytes memory, uint256, uint256) {
        return IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).getBallotMember(id);
    }

    function _getBallotForExit(uint256 id) private view returns (uint256, uint256) {
        return IBallotStorage(getContractAddress(BALLOT_STORAGE_NAME)).getBallotForExit(id);
    }

    function _lockedBalanceOf(address addr) private view returns (uint256) {
        // IStaking staking = IStaking(getContractAddress(STAKING_NAME))._lockedBalanceOf(addr);
        return IStaking(getContractAddress(STAKING_NAME)).lockedBalanceOf(addr);
    }

    function _availableBalanceOf(address addr) private view returns (uint256) {
        return IStaking(getContractAddress(STAKING_NAME)).availableBalanceOf(addr);
    }

    function _checkVariableCondition(bytes32 envKey, bytes memory envVal) private view returns (bool) {
        return IEnvStorage(getContractAddress(ENV_STORAGE_NAME)).checkVariableCondition(envKey, envVal);
    }

    function _checkNodeInfoAdd(bytes memory name, bytes memory enode, bytes memory ip, uint port) private view returns (bool check) {
        //Enode can not be duplicated
        //IP:port can not be duplicated
        //Name can not be duplicated
        check = true;
        if (checkNodeEnode[enode]) check = false;
        if (checkNodeName[name]) check = false;

        bytes32 hvalue = keccak256(abi.encodePacked(ip, port));
        if (checkNodeIpPort[hvalue]) check = false;
    }

    function _checkNodeInfoChange(
        bytes memory name,
        bytes memory enode,
        bytes memory ip,
        uint port,
        Node memory nodeInfo
    ) private view returns (bool check) {
        //Enode can not be duplicated
        //IP:port can not be duplicated
        //Name can not be duplicated
        check = true;
        if ((keccak256(nodeInfo.enode) != keccak256(enode) && checkNodeEnode[enode])) check = false;
        if ((keccak256(nodeInfo.name) != keccak256(name) && checkNodeName[name])) check = false;

        bytes32 hvalue = keccak256(abi.encodePacked(ip, port));
        if ((keccak256(abi.encodePacked(nodeInfo.ip, nodeInfo.port)) != hvalue && checkNodeIpPort[hvalue])) check = false;
    }

    function _checkMemberInfo(MemberInfo memory info) private view {
        require(info.voter != ZERO, "Invalid voter");
        require(info.name.length > 0, "Invalid node name");
        require(info.ip.length > 0, "Invalid node IP");
        require(info.port > 0, "Invalid node port");
        require(info.enode.length > 0, "Invalid node enode");
        require(info.memo.length > 0, "Invalid memo");
        require(info.duration > 0, "Invalid duration");
        require(info.lockAmount >= getMinStaking() && info.lockAmount <= getMaxStaking(), "Invalid lock Amount");
    }

    function _whenAddProposal() private onlyGovMem {
        address staker = _checkLockedAmount();
        require((block.timestamp - lastAddProposalTime[staker]) >= proposal_time_period, "Cannot add proposal too early");
        lastAddProposalTime[staker] = block.timestamp;
    }

    function _checkLockedAmount() private view returns (address staker) {
        staker = getStakerAddr(_msgSender());
        uint256 lockedBalance = _lockedBalanceOf(staker);
        require(lockedBalance <= getMaxStaking() && lockedBalance >= getMinStaking(), "Invalid staking balance");
    }

    //------------------ Code reduction end

    //------------------ Upgradeables
    function _authorizeUpgrade(address newImplementation) internal override onlyGovMem {}

    function upgradeTo(address) external override {
        revert("Invalid access");
    }

    function upgradeToAndCall(address, bytes memory) external payable override {
        revert("Invalid access");
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[46] private __gap;
    //------------------ Upgradeables end
}
