pragma solidity ^0.4.24;

import "./AEnvStorage.sol";
import "../proxy/UpgradeabilityProxy.sol";


contract EnvStorage is UpgradeabilityProxy, AEnvStorage {

    modifier onlyGovOrOwner() {
        require((getGovAddress() == msg.sender) || isOwner(), "No Permission");
        _;
    }

    constructor(address _registry, address _implementation) public {
        setRegistry(_registry);
        setImplementation(_implementation);
    }

    function upgradeTo(address newImplementation) public onlyGovOrOwner {
        _upgradeTo(newImplementation);
    }
}