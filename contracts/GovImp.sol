pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "./abstract/BallotEnums.sol";
import "./abstract/EnvConstants.sol";
import "./interface/IBallotStorage.sol";
import "./interface/IEnvStorage.sol";
import "./interface/IStaking.sol";
import "./Gov.sol";


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
        if (accept < getThreshould() && reject < getThreshould()) {
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

    function fromValidBallot(uint256 ballotIdx, uint256 targetType) private view {
        (uint256 ballotType, uint256 state, ) = getBallotState(ballotIdx);
        require(ballotType == targetType, "Invalid voting type");
        require(state == uint(BallotStates.InProgress), "Invalid voting state");
        (, uint256 accept, uint256 reject) = getBallotVotingInfo(ballotIdx);
        require(accept >= getThreshould() || reject >= getThreshould(), "Not yet finalized");
    }

    function addMember(uint256 ballotIdx) private {
        fromValidBallot(ballotIdx, uint256(BallotTypes.MemberAdd));

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

        // Add voting and reward member
        uint256 nMemIdx = memberLength.add(1);
        members[nMemIdx] = addr;
        memberIdx[addr] = nMemIdx;
        rewards[nMemIdx] = addr;
        rewardIdx[addr] = nMemIdx;

        // Add node
        uint256 nNodeIdx = nodeLength.add(1);
        Node storage node = nodes[nNodeIdx];
        node.enode = enode;
        node.ip = ip;
        node.port = port;
        nodeToMember[nNodeIdx] = addr;
        nodeIdxFromMember[addr] = nNodeIdx;

        memberLength = nMemIdx;
        nodeLength = nNodeIdx;

        emit MemberAdded(addr);
    }

    function removeMember(uint256 ballotIdx) private {
        fromValidBallot(ballotIdx, uint256(BallotTypes.MemberRemoval));

        (address addr, , , , , uint256 unlockAmount) = getBallotMember(ballotIdx);
        if (!isMember(addr)) {
            return; // Non-member. it is abnormal case
        }

        // Remove voting and reward member
        if (memberIdx[addr] != memberLength) {
            (members[memberIdx[addr]], members[memberLength]) = (members[memberLength], members[memberIdx[addr]]);
            (rewards[memberIdx[addr]], rewards[memberLength]) = (rewards[memberLength], rewards[memberIdx[addr]]);
        }
        members[memberLength] = address(0);
        memberIdx[addr] = 0;
        rewards[memberLength] = address(0);
        rewardIdx[rewards[memberLength]] = 0;
        memberLength = memberLength.sub(1);

        // Remove node
        if (nodeIdxFromMember[addr] != nodeLength) {
            Node storage node = nodes[nodeIdxFromMember[addr]];
            node.enode = nodes[nodeLength].enode;
            node.ip = nodes[nodeLength].ip;
            node.port = nodes[nodeLength].port;
        }
        nodeToMember[nodeLength] = address(0);
        nodeIdxFromMember[addr] = 0;
        nodeLength = nodeLength.sub(1);

        // Unlock and transfer remained to governance
        transferLockedAndUnlock(addr, unlockAmount);

        emit MemberRemoved(addr);
    }

    function changeMember(uint256 ballotIdx) private {
        fromValidBallot(ballotIdx, uint256(BallotTypes.MemberChange));
        
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
            memberIdx[nAddr] = memberIdx[addr];
            rewards[memberIdx[addr]] = nAddr;
            rewardIdx[nAddr] = rewardIdx[addr];
            memberIdx[addr] = 0;
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

            // Unlock and transfer remained to governance
            transferLockedAndUnlock(addr, lockAmount);

            emit MemberChanged(addr, nAddr);
        }
    }

    function changeGov(uint256 ballotIdx) private {
        fromValidBallot(ballotIdx, uint256(BallotTypes.GovernanceChange));

        address newImp = IBallotStorage(getBallotStorageAddress()).getBallotAddress(ballotIdx);
        if (newImp != address(0)) {
            setImplementation(newImp);
        }
    }

    function applyEnv(uint256 ballotIdx) private {
        fromValidBallot(ballotIdx, uint256(BallotTypes.EnvValChange));

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

    //------------------ Code reduction for creation gas
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

    function transferLockedAndUnlock(address addr, uint256 unlockAmount) private {
        IStaking staking = IStaking(getStakingAddress());
        uint256 locked = staking.lockedBalanceOf(addr);
        if (locked > unlockAmount) {
            staking.transferLocked(addr, locked.sub(unlockAmount));
        }
        staking.unlock(addr, unlockAmount);
    }
    //------------------ Code reduction end
}