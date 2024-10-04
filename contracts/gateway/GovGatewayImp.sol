// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "hardhat/console.sol";
import "../interface/IBallotStorage.sol";
import "./IGovGateway.sol";
import "../GovChecker.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
contract GovGatewayImp is
    GovChecker,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    struct BallotBasic {
        uint256 ballotId;
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

    struct Vote {
        uint256 voteId;
        uint256 ballotId;
        address voter;
        uint256 decision;
        uint256 power;
        uint256 time;
    }

    struct MemberInfo {
        address staker;
        address rewarder;
        address voter;
        bytes name;
        bytes enode;
        bytes ip;
        uint port;
    }
    /* =========== STATE VARIABLES ===========*/
    using AddressUpgradeable for address payable;

    address public registry;

    receive() external payable {}

    /* =========== FUNCTIONS ===========*/
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    function initialize(
        address _registry
    ) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        setRegistry(_registry);
    }

    function getBallotStorageLength() public view returns (uint256) {
        IGovGateway curBallotStorage = IGovGateway(getBallotStorageAddress());
        uint256 ballotStorageLength = 1;
        console.log("ballotStorageLength", ballotStorageLength);
        while (curBallotStorage.getPreviousBallotStorage() != address(0)) {
            ballotStorageLength += 1;
            curBallotStorage = IGovGateway(curBallotStorage.getPreviousBallotStorage());
        }
        return ballotStorageLength;
    }

    function getBallotStorageAddressList() public view returns (address[] memory) {
        uint256 length = getBallotStorageLength(); // 2 , 1, 0 / 3
        console.log("getBallotStorageLength", length);
        address[] memory addressList = new address[](length);

        length--; // 2 -> 1, 0
        IGovGateway curBallotStorage = IGovGateway(getBallotStorageAddress());
        addressList[length] = getBallotStorageAddress(); // 2 - 1, 0
        console.log("length", length);

        while (curBallotStorage.getPreviousBallotStorage() != address(0)) {
            if (length == 0) break;
            length--;
            addressList[length] = curBallotStorage.getPreviousBallotStorage();
            curBallotStorage = IGovGateway(curBallotStorage.getPreviousBallotStorage());
            console.log(curBallotStorage.getPreviousBallotStorage());
        }
        return addressList;
    }
    
    function createBallot(uint256 id, address ballotStorage) public view returns (BallotBasic memory) {
            (
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
 
            ) =  IBallotStorage(ballotStorage).getBallotBasic(id);
            return BallotBasic({ 
                ballotId: id,            
                startTime: startTime,
                endTime: endTime,
                ballotType: ballotType,
                creator: creator,
                memo: memo,
                totalVoters: totalVoters,
                powerOfAccepts: powerOfAccepts,
                powerOfRejects: powerOfRejects,
                state: state,
                isFinalized: isFinalized,
                duration: duration});
    }

    function createVote(uint256 id, address ballotStorage) public view returns (Vote memory) {
            IGovGateway curBallotStorage = IGovGateway(ballotStorage);
            (
                uint256 voteId,
                uint256 ballotId,
                address voter,
                uint256 decision,
                uint256 power,
                uint256 time
            ) =  curBallotStorage.getVote(id);

            return Vote({             
                voteId: voteId,
                ballotId: ballotId,
                voter: voter,
                decision: decision,
                power: power,
                time: time});
    }

    function isBallot(uint256 id, address ballotStorageAddr) public view returns (bool) {
        IBallotStorage curBallotStorage = IBallotStorage(ballotStorageAddr);
        (
            ,
            ,
            ,
            address creator,
            ,
            ,
            ,
            ,
            ,
            ,
        ) = curBallotStorage.getBallotBasic(id);
        console.log(creator != address(0));
        return creator != address(0);
    }

    function isVote(uint256 id, address ballotStorageAddr) public view returns (bool) {
        IGovGateway ballotGateway = IGovGateway(ballotStorageAddr);

        (uint256 voteId, , , , , ) = ballotGateway.getVote(id);
        return id == voteId;
    }
    // Check Previous
    function getBallot(uint256 id) external view returns 
        (
            uint256, uint256, uint256, address, bytes memory, uint256,
            uint256, uint256, uint256, bool, uint256 
        ) 
    {
        require(IGovGateway(getGovAddress()).ballotLength() >= id);

        address[] memory ballotAddressList = getBallotStorageAddressList();
        for (uint256 i = 0; i < ballotAddressList.length; i ++) {
            if(isBallot(id, ballotAddressList[i])) {
                return IBallotStorage(ballotAddressList[i]).getBallotBasic(id);
            }
        }
    }

    function getVoteListByBallotId(uint256 ballotId) external view returns (Vote[] memory voteList) {
        
        address[] memory ballotAddressList = getBallotStorageAddressList();
        IGovGateway govGateway = IGovGateway(getGovAddress());

        uint256 j = 0;
        for (uint256 i = 0; i < ballotAddressList.length; i ++) {
            if(!isBallot(ballotId, ballotAddressList[i])) {
                console.log("Vote False");
                j ++;
            } else {
                console.log("Vote True");
                break;
            }
        }
        console.log(j);
        IGovGateway ballotGateway = IGovGateway(ballotAddressList[j]);
        IBallotStorage curBallotStorage = IBallotStorage(ballotAddressList[j]);
        (
            ,
            ,
            ,
            ,
            ,
            uint256 totalVoters,
            ,
            ,
            ,
            ,
        ) =  curBallotStorage.getBallotBasic(ballotId);

        if (totalVoters == 0) {
            return voteList;
        }

        uint256 voteLength = govGateway.voteLength();
        uint256 ballotLength = govGateway.ballotLength();

        voteList = new Vote[](totalVoters);
        uint256 voteListIdx = 0;

        for(uint256 i = 1; i <= voteLength; i ++) {
            (
                ,
                uint256 curBallotId,
                ,
                ,
                ,
            ) = ballotGateway.getVote(i);
            
            if (curBallotId == ballotId) {
                voteList[voteListIdx] = createVote(i, ballotAddressList[j]);
                voteListIdx++;
                if (voteListIdx == totalVoters) break;
            }
        }

        return voteList;
    }


    function getVoteIdListByBallotId(uint256 ballotId) external view returns (uint256[] memory voteList) {
        require(IGovGateway(getGovAddress()).ballotLength() > ballotId);

        address[] memory ballotAddressList = getBallotStorageAddressList();
        IGovGateway govGateway = IGovGateway(getGovAddress());

        uint256 j = 0;
        for (uint256 i = 0; i < ballotAddressList.length; i ++) {
            if(!isBallot(ballotId, ballotAddressList[i])) {
                console.log("Vote False");
                j ++;
            } else {
                console.log("Vote True");
                break;
            }
        }
        console.log(j);
        IGovGateway ballotGateway = IGovGateway(ballotAddressList[j]);
        IBallotStorage curBallotStorage = IBallotStorage(ballotAddressList[j]);
        (
            ,
            ,
            ,
            ,
            ,
            uint256 totalVoters,
            ,
            ,
            ,
            ,
        ) =  curBallotStorage.getBallotBasic(ballotId);
        if (totalVoters == 0) return voteList;

        uint256 voteLength = govGateway.voteLength();
        uint256 ballotLength = govGateway.ballotLength();
        voteList = new uint256[](totalVoters);
        uint256 voteListIdx = 0;

        for(uint256 i = 0; i < voteLength; i ++) {
            (
                uint256 curVoteId,
                uint256 curBallotId,
                ,
                ,
                ,
            ) =  ballotGateway.getVote(i);
            if (curBallotId == ballotId) {
                voteList[voteListIdx] = curVoteId;
                voteListIdx++;
            }
            if (voteListIdx == totalVoters) break;
        }

        return voteList;
    }

    function getTargetTotalVoters(uint256 ballotId) public view returns (uint256, uint256, uint256) {

        address[] memory ballotAddressList = getBallotStorageAddressList();
        IGovGateway govGateway = IGovGateway(getGovAddress());
        IBallotStorage curBallotStorage;
        
        uint256 totalVoterIdx = 0;
        uint256 targetVoter = 0;
        uint256 idx = 0;
        for(uint256 i = 1; i <= ballotId ; i ++) {

                if(isBallot(i, ballotAddressList[idx])) {
                    curBallotStorage = IBallotStorage(ballotAddressList[idx]);
                    (
                        uint256 totalBallotVoters,
                        ,
                    ) =  curBallotStorage.getBallotVotingInfo(i);
                    totalVoterIdx += totalBallotVoters;
                } else {
                    idx ++;
                    console.log("idx", idx);
                    if(ballotAddressList.length <= idx) break;
                    curBallotStorage = IBallotStorage(ballotAddressList[idx]);
                    (
                        uint256 totalBallotVoters,
                        ,
                    ) =  curBallotStorage.getBallotVotingInfo(i);
                    totalVoterIdx += totalBallotVoters;
                }

                if (i == ballotId ) {
                    curBallotStorage = IBallotStorage(ballotAddressList[idx]);
                    (
                        uint256 totalBallotVoters,
                        ,
                    ) =  curBallotStorage.getBallotVotingInfo(i);
                    targetVoter = totalBallotVoters;
                }
        }
        return (targetVoter, totalVoterIdx, idx);
    }

    /*
        Start
    */
    function getBallotList(uint256 offset, uint256 limit) external view returns (BallotBasic[] memory ballotList) {
        address[] memory ballotAddressList = getBallotStorageAddressList();
        ballotList = new BallotBasic[](limit - offset + 1);
        uint256 j = 0;
        
        for(uint256 i = offset; i <= limit; i ++) {
                if(isBallot(i, ballotAddressList[j])) {
                    ballotList[i - offset] = createBallot(i, ballotAddressList[j]);
                } else {
                    j ++;
                    ballotList[i - offset] = createBallot(i, ballotAddressList[j]);
                }
        }
        return ballotList;
    }

    function getBallotListAll() external view returns (BallotBasic[] memory ballotList) {
        address[] memory ballotAddressList = getBallotStorageAddressList();
        IGovGateway govGateway = IGovGateway(getGovAddress());
        uint256 ballotLength = govGateway.ballotLength();

        ballotList = new BallotBasic[](ballotLength);
        console.log(ballotLength);
        uint256 j = 0;
        for(uint256 i = 1; i <= ballotLength; i ++) {
                if(isBallot(i, ballotAddressList[j])) {
                    ballotList[i - 1] = createBallot(i, ballotAddressList[j]);
                } else {
                    j ++;
                    ballotList[i - 1] = createBallot(i, ballotAddressList[j]);
                }
        }
        return ballotList;
    }

    function getVoteList(uint256 ballotId) external view returns (Vote[] memory voteList) {
        address[] memory ballotAddressList = getBallotStorageAddressList();
        IGovGateway govGateway = IGovGateway(getGovAddress());
        IBallotStorage curBallotStorage;
        uint256 ballotLength = govGateway.ballotLength();
        (uint256 targetVoter, uint256 totalVoterIdx, uint256 addressIdx) = getTargetTotalVoters(ballotId);
        console.log("idx", addressIdx);
        if(ballotAddressList.length > addressIdx) {
            IGovGateway ballotGateway = IGovGateway(ballotAddressList[addressIdx]);
            voteList = new Vote[](targetVoter);
            uint256 j = 0;
            for(uint256 i = (totalVoterIdx - targetVoter + 1); i <= totalVoterIdx; i ++) {
                voteList[j] = createVote(i , ballotAddressList[addressIdx]);
                j ++;
            }
        }
        console.log("total", totalVoterIdx, targetVoter, addressIdx);
    }

    function getMemberList() external view returns (MemberInfo[] memory memberList) {
        IGovGateway govGateway = IGovGateway(getGovAddress());
        memberList = new MemberInfo[](govGateway.getMemberLength());
        for(uint256 i = 1; i <= govGateway.getMemberLength(); i ++) {
            console.log(i);
            (bytes memory name, bytes memory enode, bytes memory ip, uint port) = govGateway.getNode(i);
            memberList[i - 1] = MemberInfo({             
                staker: govGateway.getMember(i),
                rewarder: govGateway.getReward(i),
                voter: govGateway.getVoter(i),
                name: name,
                enode: enode,
                ip: ip,
                port: port});
        }
        return memberList;
    }

    function upgradeGovGateway(address newImp) external onlyOwner {
        if (newImp != address(0)) {
            _authorizeUpgrade(newImp);
            _upgradeToAndCallUUPS(newImp, new bytes(0), false);
        }
    }

    function getBallotMember(uint256 _id) public view returns (
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
        address[] memory ballotAddressList = getBallotStorageAddressList();
        for(uint256 i = 0; i <= ballotAddressList.length ; i ++) {
            if(isBallot(_id, ballotAddressList[i])) {
                return IBallotStorage(ballotAddressList[i]).getBallotMember(_id);
            }
        }
    }

    function getBallotVariable(uint256 _id) public view returns (
        bytes32 envVariableName,
        uint256 envVariableType,
        bytes memory envVariableValue 
    )
    {
        address[] memory ballotAddressList = getBallotStorageAddressList();
        for(uint256 i = 0; i <= ballotAddressList.length ; i ++) {
            if(isBallot(_id, ballotAddressList[i])) {
                return IBallotStorage(ballotAddressList[i]).getBallotVariable(_id);
            }
        }
    }

    function getBallotAddress(uint256 _id) public view returns (
        address newGovernanceAddress
    )
    {
        address[] memory ballotAddressList = getBallotStorageAddressList();
        for(uint256 i = 0; i <= ballotAddressList.length ; i ++) {
            if(isBallot(_id, ballotAddressList[i])) {
                return IBallotStorage(ballotAddressList[i]).getBallotAddress(_id);
            }
        }
    }

    function getBallotExit(uint256 _id) public view returns (
        uint256 unlockAmount,
        uint256 slashing
    )
    {
        address[] memory ballotAddressList = getBallotStorageAddressList();
        for(uint256 i = 0; i <= ballotAddressList.length ; i ++) {
            if(isBallot(_id, ballotAddressList[i])) {
                return IBallotStorage(ballotAddressList[i]).getBallotForExit(_id);
            }
        }
    }


    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}