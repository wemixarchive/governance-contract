pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./abstract/BallotEnums.sol";
import "./abstract/EnvConstants.sol";
import "./interface/IBallotStorage.sol";
import "./interface/IEnvStorage.sol";
import "./interface/IStaking.sol";
import "./abstract/AGov.sol";

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import 'hardhat/console.sol';

contract GovImp is AGov, ReentrancyGuard, BallotEnums, EnvConstants, UUPSUpgradeable {
    using SafeMath for uint256;

    event MemberAdded(address indexed addr);
    event MemberRemoved(address indexed addr);
    event MemberChanged(address indexed oldAddr, address indexed newAddr);
    event EnvChanged(bytes32 envName, uint256 envType, bytes envVal);
    event MemberUpdated(address indexed addr);
    // added for case that ballot's result could not be applicable.
    event NotApplicable(uint256 indexed ballotId, string reason);

    struct MemberInfo{
        address member;
        address staker;
        bytes name;
        bytes enode;
        bytes ip;
        uint256 port;
        uint256 lockAmount;
        bytes memo;
        uint256 duration;
    }
    
    function addProposalToAddMember(
        MemberInfo memory info
        // address member,
        // bytes memory name,
        // bytes memory enode,
        // bytes memory ip,
        // uint256[2] memory portNlockAmount,
        // bytes memory memo
    )
        external
        onlyGovMem
        returns (uint256 ballotIdx)
    {
        require(info.member != address(0), "Invalid address");
        require(info.name.length > 0, "Invalid node name");
        require(info.ip.length > 0, "Invalid node IP");
        require(info.port > 0, "Invalid node port");
        require(!isMember(info.member), "Already member");
        require( info.lockAmount >= getMinStaking() && info.lockAmount <= getMaxStaking(),"Invalid lock Amount.");
        require(isAllowedToVote(info.member, info.staker), "Staker is not allowed");
        ballotIdx = ballotLength.add(1);
        createBallotForMember(
            ballotIdx, // ballot id
            uint256(BallotTypes.MemberAdd), // ballot type
            info.duration,
            msg.sender, // creator
            address(0), // old member address
            info.member, // new member address
            address(0),
            info.staker,
            info.name,
            info.enode, // new enode
            info.ip, // new ip
            info.port // new port
        );
        updateBallotLock(ballotIdx, info.lockAmount);
        updateBallotMemo(ballotIdx, info.memo);
        ballotLength = ballotIdx;
    }

    function addProposalToRemoveMember(
        address member,
        uint256 lockAmount,
        bytes memory memo,
        uint256 duration
    )
        external
        onlyGovMem
        returns (uint256 ballotIdx)
    {
        require(member != address(0), "Invalid address");
        require(isMember(member), "Non-member");
        require(getMemberLength() > 1, "Cannot remove a sole member");
        require(lockedBalanceOf(memberToStaker[member]) >= lockAmount,"Insufficient balance that can be unlocked." );
        ballotIdx = ballotLength.add(1);
        createBallotForMember(
            ballotIdx, // ballot id
            uint256(BallotTypes.MemberRemoval), // ballot type
            duration,
            msg.sender, // creator
            member, // old member address
            address(0), // new member address
            memberToStaker[member],
            address(0),
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
        MemberInfo memory newInfo,
        address oldMember
        // address[2] memory targetNnewMember,
        // address newStaker,
        // bytes memory nName,
        // bytes memory nEnode,
        // bytes memory nIp,
        // uint256[2] memory portNlockAmount,
        // bytes memory memo,
        // uint256 duration
    )
        external
        onlyGovMem
        returns (uint256 ballotIdx)
    {
        require(oldMember != address(0), "Invalid old Address");
        require(newInfo.member != address(0), "Invalid new Address");
        require(newInfo.name.length > 0, "Invalid node name");
        require(newInfo.ip.length > 0, "Invalid node IP");
        require(newInfo.port > 0, "Invalid node port");
        require(isMember(oldMember), "Non-member");
        require( newInfo.lockAmount >= getMinStaking() && newInfo.lockAmount <= getMaxStaking(), "Invalid lock Amount");
        require(isAllowedToVote(newInfo.member, newInfo.staker), "Staker is not allowed");

        ballotIdx = ballotLength.add(1);
        createBallotForMember(
            ballotIdx, // ballot id
            uint256(BallotTypes.MemberChange), // ballot type
            newInfo.duration,
            msg.sender, // creator
            oldMember, // old member address
            newInfo.member, // new member address
            memberToStaker[oldMember], // old staker address
            newInfo.staker, // new staker address
            newInfo.name, //new Name
            newInfo.enode, // new enode
            newInfo.ip, // new ip
            newInfo.port // new port
        );
        updateBallotLock(ballotIdx, newInfo.lockAmount);
        updateBallotMemo(ballotIdx, newInfo.memo);
        ballotLength = ballotIdx;
        // 요청자 == 변경할 voting 주소
        if(msg.sender == oldMember){
            (, , uint256 duration) = getBallotPeriod(ballotIdx);
            startBallot(ballotIdx, block.timestamp, block.timestamp.add(duration));
            finalizeVote(ballotIdx, uint256(BallotTypes.MemberChange), true, true);
        }
    }

    function addProposalToChangeGov(
        address newGovAddr,
        bytes memory memo,
        uint256 duration
    )
        external
        onlyGovMem
        returns (uint256 ballotIdx)
    {
        require(newGovAddr != address(0), "Implementation cannot be zero");
        require(newGovAddr != _getImplementation(), "Same contract address");
        ballotIdx = ballotLength.add(1);
        IBallotStorage(getBallotStorageAddress()).createBallotForAddress(
            ballotLength.add(1), // ballot id
            uint256(BallotTypes.GovernanceChange), // ballot type
            duration,
            msg.sender, // creator
            newGovAddr // new governance address
        );
        updateBallotMemo(ballotIdx, memo);
        ballotLength = ballotIdx;
    }

    function addProposalToChangeEnv(
        bytes32 envName,
        uint256 envType,
        bytes memory envVal,
        bytes memory memo,
        uint256 duration
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
            duration,
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
        uint256 threshold = getThreshold();
        if (accept >= threshold || reject >= threshold) {
            finalizeVote(ballotIdx, ballotType, accept > reject, false);
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

    function getThreshold() public pure returns (uint256) { return 5100; } // 51% from 5100 of 10000

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
                startBallot(ballotIdx, block.timestamp, block.timestamp.add(getMinVotingDuration()));
            } else if (getMaxVotingDuration() < duration) {
                startBallot(ballotIdx, block.timestamp, block.timestamp.add(getMaxVotingDuration()));
            } else {
                startBallot(ballotIdx, block.timestamp, block.timestamp.add(duration));
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
        uint256 weight = IStaking(getStakingAddress()).calcVotingWeightWithScaleFactor(memberToStaker[msg.sender], 1e4);
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

    function finalizeVote(uint256 ballotIdx, uint256 ballotType, bool isAccepted, bool self) private {
        uint256 ballotState = uint256(BallotStates.Rejected);
        if (isAccepted) {
            ballotState = uint256(BallotStates.Accepted);

            if (ballotType == uint256(BallotTypes.MemberAdd)) {
                if (!addMember(ballotIdx)) {
                    ballotState = uint256(BallotStates.Rejected);
                }
            } else if (ballotType == uint256(BallotTypes.MemberRemoval)) {
                removeMember(ballotIdx);
            } else if (ballotType == uint256(BallotTypes.MemberChange)) {
                if (!changeMember(ballotIdx, self)) {
                    ballotState = uint256(BallotStates.Rejected);
                }
            } else if (ballotType == uint256(BallotTypes.GovernanceChange)) {
                changeGov(ballotIdx);
            } else if (ballotType == uint256(BallotTypes.EnvValChange)) {
                applyEnv(ballotIdx);
            }
            
        }
        finalizeBallot(ballotIdx, ballotState);
        ballotInVoting = 0;
    }

    function fromValidBallot(uint256 ballotIdx, uint256 targetType) private view {
        (uint256 ballotType, uint256 state, ) = getBallotState(ballotIdx);
        require(ballotType == targetType, "Invalid voting type");
        require(state == uint(BallotStates.InProgress), "Invalid voting state");
        (, uint256 accept, uint256 reject) = getBallotVotingInfo(ballotIdx);
        require(accept >= getThreshold() || reject >= getThreshold(), "Not yet finalized");
    }

    function addMember(uint256 ballotIdx) private returns (bool) {
        fromValidBallot(ballotIdx, uint256(BallotTypes.MemberAdd));

        (
            , address addr,
            address newStaker,
            bytes memory name,
            bytes memory enode,
            bytes memory ip,
            uint port,
            uint256 lockAmount
        ) = getBallotMember(ballotIdx);
        if (isMember(addr)) {
            emit NotApplicable(ballotIdx, "Already a member");
            return true; // Already member. it is abnormal case, but passed. 
        }

        // Lock
        if( lockAmount < getMinStaking() || getMaxStaking() < lockAmount ){
            emit NotApplicable(ballotIdx, "Invalid lock amount");
            return false;
        }
        
        if(availableBalanceOf(newStaker) < lockAmount){
            emit NotApplicable(ballotIdx, "Insufficient balance that can be locked");
            return false;
        }

        if(!isAllowedToVote(addr, newStaker)){
            emit NotApplicable(ballotIdx, "Voter is not allowed");
            return false;
        }

        lock(newStaker, lockAmount);

        // Add voting and reward member
        uint256 nMemIdx = memberLength.add(1);
        members[nMemIdx] = addr;
        memberIdx[addr] = nMemIdx;
        rewards[nMemIdx] = addr;
        rewardIdx[addr] = nMemIdx;
        stakers[nMemIdx] = newStaker;
        stakersIdx[newStaker] = nMemIdx;
        memberToStaker[addr] = newStaker;

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
        return true;
    }

    function removeMember(uint256 ballotIdx) private {
        fromValidBallot(ballotIdx, uint256(BallotTypes.MemberRemoval));

        (address addr, , , , , , , uint256 unlockAmount) = getBallotMember(ballotIdx);
        if (!isMember(addr)) {
            emit NotApplicable(ballotIdx, "Not already a member");
            return; // Non-member. it is abnormal case, but passed
        }

        // Remove voting and reward member
        uint256 removeIdx = memberIdx[addr];
        address endAddr = members[memberLength];
        address oldStaker = memberToStaker[addr];
        
        if (memberIdx[addr] != memberLength) {
            (members[removeIdx], members[memberLength],memberIdx[addr], memberIdx[endAddr] ) = (members[memberLength],address(0), 0, memberIdx[addr]);
            removeIdx = rewardIdx[addr];
            endAddr = rewards[memberLength];
            (rewards[removeIdx], rewards[memberLength],rewardIdx[addr], rewardIdx[endAddr]) = (rewards[memberLength], address(0),0, rewardIdx[addr]);
            removeIdx = stakersIdx[oldStaker];
            endAddr = stakers[memberLength];
            (stakers[removeIdx], stakers[memberLength],stakersIdx[oldStaker], stakersIdx[endAddr]) = (stakers[memberLength], address(0),0, stakersIdx[oldStaker]);
        } else {
            members[memberLength] = address(0);
            memberIdx[addr] = 0;
            rewards[memberLength] = address(0);
            rewardIdx[addr] = 0;
            stakers[memberLength] = address(0);
            stakersIdx[oldStaker] = 0;
        }
        memberLength = memberLength.sub(1);
        // Remove node
        if (nodeIdxFromMember[addr] != nodeLength) {
            removeIdx = nodeIdxFromMember[addr];
            endAddr = nodeToMember[nodeLength];

            Node storage node = nodes[removeIdx];
            node.name = nodes[nodeLength].name;
            node.enode = nodes[nodeLength].enode;
            node.ip = nodes[nodeLength].ip;
            node.port = nodes[nodeLength].port;

            nodeToMember[removeIdx] = endAddr;
            nodeIdxFromMember[endAddr]=removeIdx;
        }
        nodeToMember[nodeLength] = address(0);
        nodeIdxFromMember[addr] = 0;
        delete nodes[nodeLength];
        nodeLength = nodeLength.sub(1);
        modifiedBlock = block.number;
        // Unlock and transfer remained to governance
        transferLockedAndUnlock(oldStaker, unlockAmount);

        emit MemberRemoved(addr);
    }

    function changeMember(uint256 ballotIdx, bool self) private returns (bool) {
        if(!self){
            fromValidBallot(ballotIdx, uint256(BallotTypes.MemberChange));
        }
        
        (
            address addr,
            address nAddr,
            address nStaker,
            bytes memory name,
            bytes memory enode,
            bytes memory ip,
            uint port,
            uint256 lockAmount
        ) = getBallotMember(ballotIdx);
        if (!isMember(addr)) {
            emit NotApplicable(ballotIdx, "Old address is not a member");
            return false; // Non-member. it is abnormal case. 
        }

        if (addr != nAddr) {
            if (isMember(nAddr)) {
                emit NotApplicable(ballotIdx, "new address is already a member");
                return false; // already member. it is abnormal case.
            }

            // Change member
            members[memberIdx[addr]] = nAddr;
            memberIdx[nAddr] = memberIdx[addr];
            rewards[memberIdx[addr]] = nAddr;
            rewardIdx[nAddr] = rewardIdx[addr];
            memberIdx[addr] = 0;
        }

        address staker = memberToStaker[addr];

        if(staker != nStaker){
            // Lock
            if( lockAmount < getMinStaking() || getMaxStaking() < lockAmount ){
                emit NotApplicable(ballotIdx, "Invalid lock amount");
                return false;
            }
            if(availableBalanceOf(nStaker) < lockAmount){
                emit NotApplicable(ballotIdx, "Insufficient balance that can be locked");
                return false;
            }
            lock(nStaker, lockAmount);

            // Change staker
            stakers[stakersIdx[staker]] = nStaker;
            stakersIdx[nStaker] = stakersIdx[staker];
            stakersIdx[staker] = 0;
        }

        // Change node
        uint256 nodeIdx = nodeIdxFromMember[addr];
        Node storage node = nodes[nodeIdx];
        node.name = name;
        node.enode = enode;
        node.ip = ip;
        node.port = port;
        modifiedBlock = block.number;
        if (staker != nStaker) {
            nodeToMember[nodeIdx] = nAddr;
            nodeIdxFromMember[nAddr] = nodeIdx;
            nodeIdxFromMember[addr] = 0;

            // Unlock and transfer remained to governance
            transferLockedAndUnlock(staker, lockAmount);

            emit MemberChanged(addr, nAddr);
        } else {
            emit MemberUpdated(addr);
        }
        return true;
    }

    function changeGov(uint256 ballotIdx) private {
        fromValidBallot(ballotIdx, uint256(BallotTypes.GovernanceChange));

        address newImp = IBallotStorage(getBallotStorageAddress()).getBallotAddress(ballotIdx);
        if (newImp != address(0)) {
            _authorizeUpgrade(newImp);
            _upgradeToAndCallUUPS(newImp, new bytes(0), false);
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
        uint256 addressType = uint256(VariableTypes.Address);
        if (envKey == BLOCKS_PER_NAME && envType == uintType) {
            envStorage.setBlocksPerByBytes(envVal);
        } 
        // else if (envKey == BALLOT_DURATION_MIN_NAME && envType == uintType) {
        //     envStorage.setBallotDurationMinByBytes(envVal);
        // } else if (envKey == BALLOT_DURATION_MAX_NAME && envType == uintType) {
        //     envStorage.setBallotDurationMaxByBytes(envVal);
        // }
        else if (envKey == BALLOT_DURATION_MIN_MAX_NAME && envType == uintType) {
            envStorage.setBallotDurationMinMaxByBytes(envVal);
        }
        // else if (envKey == STAKING_MIN_NAME && envType == uintType) {
        //     envStorage.setStakingMinByBytes(envVal);
        // } else if (envKey == STAKING_MAX_NAME && envType == uintType) {
        //     envStorage.setStakingMaxByBytes(envVal);
        // } 
        else if (envKey == STAKING_MIN_MAX_NAME && envType == uintType) {
            envStorage.setStakingMinMaxByBytes(envVal);
        }
        else if (envKey == GAS_PRICE_NAME && envType == uintType) {
            envStorage.setGasPriceByBytes(envVal);
        } else if (envKey == MAX_IDLE_BLOCK_INTERVAL_NAME && envType == uintType) {
            envStorage.setMaxIdleBlockIntervalByBytes(envVal);
        } else if (envKey == BLOCK_CREATION_TIME_NAME && envType == uintType) {
            envStorage.setMaxIdleBlockIntervalByBytes(envVal);
        } else if (envKey == BLOCK_REWARD_AMOUNT_NAME && envType == uintType) {
            envStorage.setMaxIdleBlockIntervalByBytes(envVal);
        } else if (envKey == MAX_PRIORITY_FEE_PER_GAS_NAME && envType == uintType) {
            envStorage.setMaxIdleBlockIntervalByBytes(envVal);
        } else if (envKey == BLOCK_REWARD_DISTRIBUTION_METHOD_NAME && envType == uintType) {
            envStorage.setMaxIdleBlockIntervalByBytes(envVal);
        } else if (envKey == GASLIMIT_AND_BASE_FEE_NAME && envType == uintType) {
            envStorage.setMaxIdleBlockIntervalByBytes(envVal);
        } else if (envKey == STAKING_ADDRESS_NAME && envType == addressType) {
            envStorage.setStakingAddressByBytes(envVal);
        } else if (envKey == ECOFUND_ADDRESS_NAME && envType == addressType) {
            envStorage.setEcofundAddressByBytes(envVal);
        } else if (envKey == MAINTANANCE_ADDRESS_NAME && envType == addressType) {
            envStorage.setMaintananceAddressByBytes(envVal);
        }

        modifiedBlock = block.number;

        emit EnvChanged(envKey, envType, envVal);
    }

    //------------------ Code reduction for creation gas
    function createBallotForMember(
        uint256 id,
        uint256 bType,
        uint256 duration,
        address creator,
        address oAddr,
        address nAddr,
        address oSAddr,
        address nSAddr,
        bytes memory name,
        bytes memory enode,
        bytes memory ip,
        uint port
    )
        private
    {
        IBallotStorage(getBallotStorageAddress()).createBallotForMember(
            id, // ballot id
            bType, // ballot type
            duration,
            creator, // creator
            oAddr, // old member address
            nAddr, // new member address
            oSAddr,
            nSAddr,
            name, // new name
            enode, // new enode
            ip, // new ip
            port // new port
        );
    }

    function updateBallotLock(uint256 id, uint256 amount) private {
        IBallotStorage(getBallotStorageAddress()).updateBallotMemberLockAmount(id, amount);
    }

    function updateBallotMemo(uint256 id, bytes memory memo) private {
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

    function getBallotMember(uint256 id) private view returns (address, address, address, bytes memory, bytes memory, bytes memory, uint256, uint256) {
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
           unlock(addr, unlockAmount);
        } 
        else {
           unlock(addr, locked); 
        }
    }
    function lockedBalanceOf(address addr) private view returns (uint256) {
        // IStaking staking = IStaking(getStakingAddress()).lockedBalanceOf(addr);
        return IStaking(getStakingAddress()).lockedBalanceOf(addr);
    }
    function availableBalanceOf(address addr) private view returns (uint256) {
        return IStaking(getStakingAddress()).availableBalanceOf(addr);
    }

  
    function _authorizeUpgrade(address newImplementation) internal override onlyGovMem{}
    //------------------ Code reduction end

    //====NXTMeta=====/

    function isAllowedToVote(address voter, address staker) public view returns (bool) {
        return  IStaking(getStakingAddress()).isAllowed(voter, staker);
    }
}