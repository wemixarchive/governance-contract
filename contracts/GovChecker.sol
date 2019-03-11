pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interface/IRegistry.sol";
import "./interface/IGov.sol";


/**
 * @title GovChecker
 * @dev GovChecker Contract that uses Registry contract
 */
contract GovChecker is Ownable {
    IRegistry public reg;

    bytes32 public constant GOV_NAME = "GovernanceContract";
    bytes32 public constant STAKING_NAME = "Staking";
    bytes32 public constant BALLOT_STORAGE_NAME = "BallotStorage";
    bytes32 public constant ENV_STORAGE_NAME = "EnvStorage";
    bytes32 public constant REWARD_POOL_NAME = "RewardPool";
    bytes32 public constant MAINTENANCE_NAME = "Maintenance";

    /**
     * @dev Function to set registry address. Contract that wants to use registry should setRegistry first.
     * @param _addr address of registry
     * @return A boolean that indicates if the operation was successful.
     */
    function setRegistry(address _addr) public onlyOwner {
        reg = IRegistry(_addr);
    }
    
    modifier onlyGov() {
        require(getGovAddress() == msg.sender, "No Permission");
        _;
    }

    modifier onlyGovMem() {
        require(IGov(getGovAddress()).isMember(msg.sender), "No Permission");
        _;
    }

    modifier anyGov() {
        require(getGovAddress() == msg.sender || IGov(getGovAddress()).isMember(msg.sender), "No Permission");
        _;
    }

    function getContractAddress(bytes32 name) internal view returns (address) {
        return reg.getContractAddress(name);
    }

    function getGovAddress() internal view returns (address) {
        return getContractAddress(GOV_NAME);
    }

    function getStakingAddress() internal view returns (address) {
        return getContractAddress(STAKING_NAME);
    }

    function getBallotStorageAddress() internal view returns (address) {
        return getContractAddress(BALLOT_STORAGE_NAME);
    }

    function getEnvStorageAddress() internal view returns (address) {
        return getContractAddress(ENV_STORAGE_NAME);
    }

    function getRewardPoolAddress() internal view returns (address) {
        return getContractAddress(REWARD_POOL_NAME);
    }
}
