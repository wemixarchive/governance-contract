pragma solidity ^0.8.0;


interface IEnvStorage {
    function setUint(bytes32 name, uint256 value) external;
    function setAddress(bytes32 name, address value) external;
    function setBlocksPerByBytes(bytes memory) external;
    function setBallotDurationMinByBytes(bytes memory) external;
    function setBallotDurationMaxByBytes(bytes memory) external;
    function setStakingMinByBytes(bytes memory) external;
    function setStakingMaxByBytes(bytes memory) external;
    function setGasPriceByBytes(bytes memory) external;
    function setMaxIdleBlockIntervalByBytes(bytes memory) external;
    function setBlockCreationTimeByBytes(bytes memory _value ) external;
    function setBlockRewardAmountByBytes(bytes memory _value ) external;
    function setMaxPriorityFeePerGasByBytes(bytes memory _value ) external;
    function setBlockRewardDistributionMethodByBytes(bytes memory _value ) external;
    function setGasLimitAndBaseFeeByBytes(bytes memory _value ) external;
    function setBallotDurationMinMaxByBytes(bytes memory _value ) external;
    function setStakingMinMaxByBytes(bytes memory _value ) external;
    function setStakingAddressByBytes(bytes memory _value ) external;
    function setEcofundAddressByBytes(bytes memory _value ) external;
    function setMaintananceAddressByBytes(bytes memory _value ) external;
    function getBlocksPer() external view returns (uint256);
    function getStakingMin() external view returns (uint256);
    function getStakingMax() external view returns (uint256);
    function getBallotDurationMin() external view returns (uint256);
    function getBallotDurationMax() external view returns (uint256);
    function getGasPrice() external view returns (uint256); 
    function getMaxIdleBlockInterval() external view returns (uint256);
    function checkVariableCondition(bytes32 envKey, bytes memory envVal) external pure returns(bool);
    function setVariable(bytes32 envKey, bytes memory envVal) external;
}