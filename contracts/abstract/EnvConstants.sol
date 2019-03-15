pragma solidity ^0.4.24;


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

    bytes32 public constant GAS_PRICE_NAME = keccak256("gasPrice"); 
    // uint256 public constant GAS_PRICE_TYPE = uint256(VariableTypes.Uint);

    bytes32 public constant MAX_IDLE_BLOCK_INTERVAL_NAME = keccak256("MaxIdleBlockInterval"); 
    // uint256 public constant MAX_IDLE_BLOCK_INTERVAL_TYPE = uint256(VariableTypes.Uint);

    enum VariableTypes {
        Invalid,
        Int,
        Uint,
        Address,
        Bytes32,
        Bytes,
        String
    }

    // bytes32 internal constant TEST_INT = keccak256("TEST_INT");
    // bytes32 internal constant TEST_ADDRESS = keccak256("TEST_ADDRESS");
    // bytes32 internal constant TEST_BYTES32 = keccak256("TEST_BYTES32");
    // bytes32 internal constant TEST_BYTES = keccak256("TEST_BYTES");
    // bytes32 internal constant TEST_STRING = keccak256("TEST_STRING");
}