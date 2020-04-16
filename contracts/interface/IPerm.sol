pragma solidity ^0.4.16;

interface IPerm {
    function getNodeLength() external view returns (uint256);
    function getNode(uint256) external view returns (bytes, bytes, bytes, uint);
    function getGroupLength() external view returns (uint256);
    function getGroup(uint256) external view returns (uint256, uint);
    function getAccountLength() external view returns (uint256);
    function getAccount(uint256) external view returns (address, uint, uint);

    function getBallotInVoting() external view returns (uint256);
}
