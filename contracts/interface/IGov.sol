pragma solidity ^0.4.16;


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