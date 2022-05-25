pragma solidity ^0.8.0;


interface IEnvStorage {
    function setBlocksPerByBytes(bytes memory) external;
    function setBallotDurationMinByBytes(bytes memory) external;
    function setBallotDurationMaxByBytes(bytes memory) external;
    function setStakingMinByBytes(bytes memory) external;
    function setStakingMaxByBytes(bytes memory) external;
    function setGasPriceByBytes(bytes memory) external;
    function setMaxIdleBlockIntervalByBytes(bytes memory) external;
    function getBlocksPer() external view returns (uint256);
    function getStakingMin() external view returns (uint256);
    function getStakingMax() external view returns (uint256);
    function getBallotDurationMin() external view returns (uint256);
    function getBallotDurationMax() external view returns (uint256);
    function getGasPrice() external view returns (uint256); 
    function getMaxIdleBlockInterval() external view returns (uint256);
}