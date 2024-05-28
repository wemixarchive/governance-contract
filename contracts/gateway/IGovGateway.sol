// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

interface IGovGateway {
    //BallotStorage
    function getPreviousBallotStorage() external view returns (address);
    function getVote(uint256) external view returns (
        uint256,
        uint256,
        address,
        uint256,
        uint256,
        uint256
    );
    
    // Governance
    function ballotLength() external view returns (uint256);
    function voteLength() external view returns (uint256);
    function getMemberLength() external view returns (uint256);
    function getMember(uint256) external view returns (address);
    function getNode(uint256) external view returns (bytes memory, bytes memory, bytes memory, uint);
    function getReward(uint256) external view returns (address);
    function getVoter(uint256 idx) external view returns (address);
}
