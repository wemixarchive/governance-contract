// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IEnvStorage {
    function setVariable(bytes32 envKey, bytes memory envVal) external;
    function setBlocksPerByBytes(bytes memory) external;
    function setBallotDurationMinMaxByBytes(bytes memory _value) external;
    function setStakingMinMaxByBytes(bytes memory _value) external;
    function setMaxIdleBlockIntervalByBytes(bytes memory) external;
    function setBlockCreationTimeByBytes(bytes memory _value) external;
    function setBlockRewardAmountByBytes(bytes memory _value) external;
    function setMaxPriorityFeePerGasByBytes(bytes memory _value) external;
    function setMaxBaseFeeByBytes(bytes memory _value) external;
    function setBlockRewardDistributionMethodByBytes(bytes memory _value) external;
    function setGasLimitAndBaseFeeByBytes(bytes memory _value) external;

    function getBlocksPer() external view returns (uint256);
    function getBallotDurationMin() external view returns (uint256);
    function getBallotDurationMax() external view returns (uint256);
    function getBallotDurationMinMax() external view returns (uint256, uint256);
    function getStakingMin() external view returns (uint256);
    function getStakingMax() external view returns (uint256);
    function getStakingMinMax() external view returns (uint256, uint256);
    function getMaxIdleBlockInterval() external view returns (uint256);
    function getBlockCreationTime() external view returns (uint256);
    function getBlockRewardAmount() external view returns (uint256);
    function getMaxPriorityFeePerGas() external view returns (uint256);
    function getMaxBaseFee() external view returns (uint256);
    function getBlockRewardDistributionMethod() external view returns (uint256, uint256, uint256, uint256);
    function getGasLimitAndBaseFee() external view returns (uint256, uint256, uint256);

    function checkVariableCondition(bytes32 envKey, bytes memory envVal) external pure returns (bool);
}
