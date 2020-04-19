pragma solidity ^0.4.16;


interface IGov {
    function isMember(address) external view returns (bool);
    function getMember(uint256) external view returns (address);
    function getMemberLength() external view returns (uint256);
    function getReward(uint256) external view returns (address);
    function getNodeIdxFromMember(address) external view returns (uint256);
    function getMemberFromNodeIdx(uint256) external view returns (address);
    function getNodeLength() external view returns (uint256);
    function getNode(uint256) external view returns (bytes, bytes, bytes, uint);
    function getPermissionGroupLength() external view returns (uint256);
    function getPermissionGroup(uint256) external view returns (uint256, uint256);
    function getPermissionAccountLength() external view returns (uint256);
    function getPermissionAccount(uint256) external view returns (address, uint256);
    function getPermissionNodeLength() external view returns (uint256);
    function getPermissionNode(uint256) external view returns (bytes, uint256);
    function getBallotInVoting() external view returns (uint256);
}
