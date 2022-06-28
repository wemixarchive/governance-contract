// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract EnvConstants {
    bytes32 public constant BLOCKS_PER_NAME = keccak256("blocksPer"); 
    // uint256 public constant BLOCKS_PER_TYPE = uint256(VariableTypes.Uint);

    bytes32 public constant BALLOT_DURATION_MIN_NAME = keccak256("ballotDurationMin"); 
    // uint256 public constant BALLOT_DURATION_MIN_TYPE = uint256(VariableTypes.Uint);

    bytes32 public constant BALLOT_DURATION_MAX_NAME = keccak256("ballotDurationMax"); 
    // uint256 public constant BALLOT_DURATION_MAX_TYPE = uint256(VariableTypes.Uint);

    bytes32 public constant STAKING_MIN_NAME = keccak256("stakingMin"); 
    // uint256 public constant STAKING_MIN_TYPE = uint256(VariableTypes.Uint);

    bytes32 public constant STAKING_MAX_NAME = keccak256("stakingMax"); 
    // uint256 public constant STAKING_MAX_TYPE = uint256(VariableTypes.Uint);

    // bytes32 public constant GAS_PRICE_NAME = keccak256("gasPrice"); 
    // uint256 public constant GAS_PRICE_TYPE = uint256(VariableTypes.Uint);

    bytes32 public constant MAX_IDLE_BLOCK_INTERVAL_NAME = keccak256("MaxIdleBlockInterval"); 
    // uint256 public constant MAX_IDLE_BLOCK_INTERVAL_TYPE = uint256(VariableTypes.Uint);
 
    //=======NXTMeta========/

    bytes32 public constant BALLOT_DURATION_MIN_MAX_NAME = keccak256("ballotDurationMinMax"); 
    bytes32 public constant STAKING_MIN_MAX_NAME = keccak256("stakingMinMax"); 

    bytes32 public constant BLOCK_CREATION_TIME_NAME = keccak256("blockCreationTime"); 
    bytes32 public constant BLOCK_REWARD_AMOUNT_NAME = keccak256("blockRewardAmount");
    // unit = gwei
    bytes32 public constant MAX_PRIORITY_FEE_PER_GAS_NAME = keccak256("maxPriorityFeePerGas");

    bytes32 public constant BLOCK_REWARD_DISTRIBUTION_METHOD_NAME = keccak256("blockRewardDistribution");
    bytes32 public constant BLOCK_REWARD_DISTRIBUTION_BLOCK_PRODUCER_NAME = keccak256("blockRewardDistributionBlockProducer");
    bytes32 public constant BLOCK_REWARD_DISTRIBUTION_STAKING_REWARD_NAME = keccak256("blockRewardDistributionStakingReward");
    bytes32 public constant BLOCK_REWARD_DISTRIBUTION_ECOSYSTEM_NAME = keccak256("blockRewardDistributionEcosystem");
    bytes32 public constant BLOCK_REWARD_DISTRIBUTION_MAINTANANCE_NAME = keccak256("blockRewardDistributionMaintenance");

    bytes32 public constant GASLIMIT_AND_BASE_FEE_NAME = keccak256("gasLimitAndBaseFee");
    bytes32 public constant BLOCK_GASLIMIT_NAME = keccak256("blockGasLimit");
    bytes32 public constant BASE_FEE_MAX_CHANGE_RATE_NAME = keccak256("baseFeeMaxChangeRate");
    bytes32 public constant GAS_TARGET_PERCENTAGE_NAME = keccak256("gasTargetPercentage");
    
    bytes32 public constant MAX_BASE_FEE_NAME = keccak256("maxBaseFee");

    // bytes32 public constant STAKING_REWARD_ADDRESS_NAME = keccak256("stakingRewardAddress");
    // bytes32 public constant ECOFUND_ADDRESS_NAME = keccak256("ecofundAddress");
    // bytes32 public constant MAINTANANCE_ADDRESS_NAME = keccak256("maintananceAddress");

    uint256 public constant DENOMINATOR = 10000;
    

    // bytes32 internal constant TEST_INT = keccak256("TEST_INT");
    // bytes32 internal constant TEST_ADDRESS = keccak256("TEST_ADDRESS");
    // bytes32 internal constant TEST_BYTES32 = keccak256("TEST_BYTES32");
    // bytes32 internal constant TEST_BYTES = keccak256("TEST_BYTES");
    // bytes32 internal constant TEST_STRING = keccak256("TEST_STRING");
}
