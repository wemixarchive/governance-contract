pragma solidity ^0.4.16;


interface IBallotStorage {
    function createBallotForMember(
        uint256, uint256, address, address,
        address, bytes, bytes, bytes, uint) external;

    function createBallotForAddress(uint256, uint256, address, address)external returns (uint256);
    function createBallotForVariable(uint256, uint256, address, bytes32, uint256, bytes) external returns (uint256);

    function createBallotForPermGroup(uint256, uint256, uint256, uint256) external returns (uint256);
    function createBallotForPermAccount(uint256, uint256, uint256) external returns (uint256);
    function createBallotForPermNode(uint256, bytes32, uint256) external returns (uint256);

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

    function getBallotMember(uint256) external view returns (address, address, bytes, bytes, bytes, uint256, uint256);
    function getBallotAddress(uint256) external view returns (address);
    function getBallotVariable(uint256) external view returns (bytes32, uint256, bytes);

    function getBallotPermGroup(uint256) external view returns (uint256, uint256);
    function getBallotPermAccount(uint256) external view returns (uint256, uint256);
    function getBallotPermNode(uint256) external view returns (bytes32);
}
