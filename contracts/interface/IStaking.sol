pragma solidity ^0.8.0;


interface IStaking {
    function deposit() external payable;
    function withdraw(uint256) external;
    function lock(address, uint256) external;
    function unlock(address, uint256) external;
    function transferLocked(address, uint256) external;
    function balanceOf(address) external view returns (uint256);
    function lockedBalanceOf(address) external view returns (uint256);
    function availableBalanceOf(address) external view returns (uint256);
    function calcVotingWeight(address) external view returns (uint256);
    function calcVotingWeightWithScaleFactor(address, uint32) external view returns (uint256);
}