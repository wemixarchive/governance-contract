// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interface/IRegistry.sol";
import "./interface/IGov.sol";

/**
 * @title GovChecker
 * @dev GovChecker Contract that uses Registry contract
 */
contract GovChecker is OwnableUpgradeable {
    IRegistry public reg;
    /** TODO
     * IRegistry private _reg;
     * ...
     * function reg() public view returns(IRegistry) {return _reg;}
     */

    bytes32 public constant GOV_NAME = "GovernanceContract";
    bytes32 public constant STAKING_NAME = "Staking";
    bytes32 public constant BALLOT_STORAGE_NAME = "BallotStorage";
    bytes32 public constant ENV_STORAGE_NAME = "EnvStorage";
    bytes32 public constant REWARD_POOL_NAME = "RewardPool";
    bytes32 public constant MAINTENANCE_NAME = "Maintenance";
    bytes32 public constant ECOSYSTEM_NAME = "Ecosystem";
    bytes32 public constant STAKING_REWARD_NAME = "StakingReward";

    /*
     * @dev Function to set registry address. Contract that wants to use registry should setRegistry first.
     * @param _addr address of registry
     * @return A boolean that indicates if the operation was successful.
     */
    event SetRegistry(address indexed addr);

    function setRegistry(address _addr) public onlyOwner {
        require(_addr != address(0), "Address should be non-zero");
        reg = IRegistry(_addr);
        emit SetRegistry(_addr);
    }

    modifier onlyGov() {
        require(getContractAddress(GOV_NAME) == msg.sender, "No Permission");
        _;
    }

    modifier onlyGovMem() {
        require(IGov(getContractAddress(GOV_NAME)).isMember(msg.sender), "No Permission");
        _;
    }

    function getContractAddress(bytes32 name) internal view returns (address) {
        return reg.getContractAddress(name);
    }
}
