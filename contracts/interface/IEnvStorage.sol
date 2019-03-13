pragma solidity ^0.4.16;


interface IEnvStorage {
    function setBlocksPerByBytes(bytes) external;
    function setBallotDurationMinByBytes(bytes) external;
    function setBallotDurationMaxByBytes(bytes) external;
    function setStakingMinByBytes(bytes) external;
    function setStakingMaxByBytes(bytes) external;
    function setGasPriceByBytes(bytes) external;
    function setMaxIdleBlockIntervalByBytes(bytes) external;
    function getBlocksPer() external view returns (uint256);
    function getStakingMin() external view returns (uint256);
    function getStakingMax() external view returns (uint256);
    function getBallotDurationMin() external view returns (uint256);
    function getBallotDurationMax() external view returns (uint256);
    function getGasPrice() external view returns (uint256); 
    function getMaxIdleBlockInterval() external view returns (uint256);
}