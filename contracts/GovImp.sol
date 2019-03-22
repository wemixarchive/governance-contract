pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "./abstract/BallotEnums.sol";
import "./abstract/EnvConstants.sol";
import "./interface/IBallotStorage.sol";
import "./interface/IEnvStorage.sol";
import "./interface/IStaking.sol";
import "./abstract/AGov.sol";


contract GovImp is AGov, ReentrancyGuard, BallotEnums, EnvConstants {
    using SafeMath for uint256;

    event MemberAdded(address indexed addr);
    event MemberRemoved(address indexed addr);
    event MemberChanged(address indexed oldAddr, address indexed newAddr);
    event EnvChanged(bytes32 envName, uint256 envType, bytes envVal);
    event MemberUpdated(address indexed addr);
    
    function addProposalToAddMember(
        address member,
        bytes name,
        bytes enode,
        bytes ip,
        uint256[2] portNlockAmount,
        bytes memo
    )
        external
        onlyGovMem
        returns (uint256 ballotIdx)
    {
        require(msg.sender != member, "Cannot add self");
        require(name.length > 0, "Invalid node name");
        require(ip.length > 0, "Invalid node IP");
        require(portNlockAmount[0] > 0, "Invalid node port");
        require(portNlockAmount[1] > 0, "Invalid lockAmmount");
        require(!isMember(member), "Already member");

        ballotIdx = ballotLength.add(1);
        createBallotForMember(
            ballotIdx, // ballot id
            uint256(BallotTypes.MemberAdd), // ballot type
            msg.sender, // creator
            address(0), // old member address
            member, // new member address
            name,
            enode, // new enode
            ip, // new ip
            portNlockAmount[0] // new port
        );
        updateBallotLock(ballotIdx, portNlockAmount[1]);
        updateBallotMemo(ballotIdx, memo);
        ballotLength = ballotIdx;
    }

    function addProposalToRemoveMember(
        address member,
        uint256 lockAmount,
        bytes memo
    )
        external
        onlyGovMem
        returns (uint256 ballotIdx)
    {
        require(member != address(0), "Invalid address");
        require(isMember(member), "Non-member");
        require(getMemberLength() > 1, "Cannot remove a sole member");

        ballotIdx = ballotLength.add(1);
        createBallotForMember(
            ballotIdx, // ballot id
            uint256(BallotTypes.MemberRemoval), // ballot type
            msg.sender, // creator
            member, // old member address
            address(0), // new member address
            new bytes(0), // new name
            new bytes(0), // new enode
            new bytes(0), // new ip
            0 // new port
        );
        updateBallotLock(ballotIdx, lockAmount);
        updateBallotMemo(ballotIdx, memo);
        ballotLength = ballotIdx;
    }

    function addProposalToChangeMember(
        address[2] targetNnewMember,
        bytes nName,
        bytes nEnode,
        bytes nIp,
        uint256[2] portNlockAmount,
        bytes memo
    )
        external
        onlyGovMem
        returns (uint256 ballotIdx)
    {
        require(targetNnewMember[0] != address(0), "Invalid old Address");
        require(targetNnewMember[1] != address(0), "Invalid new Address");
        require(nName.length > 0, "Invalid node name");
        require(nIp.length > 0, "Invalid node IP");
        require(portNlockAmount[0] > 0, "Invalid node port");
        require(portNlockAmount[1] > 0, "Invalid lockAmmount");
        require(isMember(targetNnewMember[0]), "Non-member");

        ballotIdx = ballotLength.add(1);
        createBallotForMember(
            ballotIdx, // ballot id
            uint256(BallotTypes.MemberChange), // ballot type
            msg.sender, // creator
            targetNnewMember[0], // old member address
            targetNnewMember[1], // new member address
            nName, //new Name
            nEnode, // new enode
            nIp, // new ip
            portNlockAmount[0] // new port
        );
        updateBallotLock(ballotIdx, portNlockAmount[1]);
        updateBallotMemo(ballotIdx, memo);
        ballotLength = ballotIdx;
    }

    function addProposalToChangeGov(
        address newGovAddr,
        bytes memo
    )
        external
        onlyGovMem
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
        updateBallotMemo(ballotIdx, memo);
        ballotLength = ballotIdx;
    }

    function addProposalToChangeEnv(
        bytes32 envName,
        uint256 envType,
        bytes envVal,
        bytes memo
    )
        external
        onlyGovMem
        returns (uint256 ballotIdx)
    {
        // require(envName != 0, "Invalid name");
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
        updateBallotMemo(ballotIdx, memo);
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
        uint256 threshold = getThreshould();
        if (accept >= threshold || reject >= threshold) {
            finalizeVote(ballotIdx, ballotType, accept > reject);
        }
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
                    finalizeBallot(ballotInVoting, uint256(BallotStates.Rejected));
                    ballotInVoting = 0;
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
            bytes memory name,
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
        node.name = name;
        memberLength = nMemIdx;
        nodeLength = nNodeIdx;
        modifiedBlock = block.number;
        emit MemberAdded(addr);
    }

    function removeMember(uint256 ballotIdx) private {
        fromValidBallot(ballotIdx, uint256(BallotTypes.MemberRemoval));

        (address addr, , , , , , uint256 unlockAmount) = getBallotMember(ballotIdx);
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
            node.name = nodes[nodeLength].name;
            node.enode = nodes[nodeLength].enode;
            node.ip = nodes[nodeLength].ip;
            node.port = nodes[nodeLength].port;
        }
        nodeToMember[nodeLength] = address(0);
        nodeIdxFromMember[addr] = 0;
        nodeLength = nodeLength.sub(1);
        modifiedBlock = block.number;
        // Unlock and transfer remained to governance
        transferLockedAndUnlock(addr, unlockAmount);

        emit MemberRemoved(addr);
    }

    function changeMember(uint256 ballotIdx) private {
        fromValidBallot(ballotIdx, uint256(BallotTypes.MemberChange));
        
        (
            address addr,
            address nAddr,
            bytes memory name,
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
        node.name = name;
        node.enode = enode;
        node.ip = ip;
        node.port = port;
        modifiedBlock = block.number;
        if (addr != nAddr) {
            nodeToMember[nodeIdx] = nAddr;
            nodeIdxFromMember[nAddr] = nodeIdx;
            nodeIdxFromMember[addr] = 0;

            // Unlock and transfer remained to governance
            transferLockedAndUnlock(addr, lockAmount);

            emit MemberChanged(addr, nAddr);
        } else {
            emit MemberUpdated(addr);
        }
    }

    function changeGov(uint256 ballotIdx) private {
        fromValidBallot(ballotIdx, uint256(BallotTypes.GovernanceChange));

        address newImp = IBallotStorage(getBallotStorageAddress()).getBallotAddress(ballotIdx);
        if (newImp != address(0)) {
            setImplementation(newImp);
            modifiedBlock = block.number;
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
        uint256 uintType = uint256(VariableTypes.Uint);
        if (envKey == BLOCKS_PER_NAME && envType == uintType) {
            envStorage.setBlocksPerByBytes(envVal);
        } else if (envKey == BALLOT_DURATION_MIN_NAME && envType == uintType) {
            envStorage.setBallotDurationMinByBytes(envVal);
        } else if (envKey == BALLOT_DURATION_MAX_NAME && envType == uintType) {
            envStorage.setBallotDurationMaxByBytes(envVal);
        } else if (envKey == STAKING_MIN_NAME && envType == uintType) {
            envStorage.setStakingMinByBytes(envVal);
        } else if (envKey == STAKING_MAX_NAME && envType == uintType) {
            envStorage.setStakingMaxByBytes(envVal);
        } else if (envKey == GAS_PRICE_NAME && envType == uintType) {
            envStorage.setGasPriceByBytes(envVal);
        } else if (envKey == MAX_IDLE_BLOCK_INTERVAL_NAME && envType == uintType) {
            envStorage.setMaxIdleBlockIntervalByBytes(envVal);
        }

        modifiedBlock = block.number;

        emit EnvChanged(envKey, envType, envVal);
    }

    //------------------ Code reduction for creation gas
    function createBallotForMember(
        uint256 id,
        uint256 bType,
        address creator,
        address oAddr,
        address nAddr,
        bytes name,
        bytes enode,
        bytes ip,
        uint port
    )
        private
    {
        IBallotStorage(getBallotStorageAddress()).createBallotForMember(
            id, // ballot id
            bType, // ballot type
            creator, // creator
            oAddr, // old member address
            nAddr, // new member address
            name, // new name
            enode, // new enode
            ip, // new ip
            port // new port
        );
    }

    function updateBallotLock(uint256 id, uint256 amount) private {
        IBallotStorage(getBallotStorageAddress()).updateBallotMemberLockAmount(id, amount);
    }

    function updateBallotMemo(uint256 id, bytes memo) private {
        IBallotStorage(getBallotStorageAddress()).updateBallotMemo(id, memo);
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

    function getBallotMember(uint256 id) private view returns (address, address, bytes, bytes, bytes, uint256, uint256) {
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