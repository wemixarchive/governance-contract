pragma solidity ^0.4.24;

import "../abstract/AEnvStorage.sol";
import "../proxy/UpgradeabilityProxy.sol";


contract EnvStorage is UpgradeabilityProxy, AEnvStorage {
    modifier onlyGovOrOwner() {
        require((getGovAddress() == msg.sender) || isOwner(), "No Permission");
        _;
    }

    constructor(address _registry, address _implementation) public {
        require(_registry != _implementation, "registry should not be same as implementation"); 
        setRegistry(_registry);
        setImplementation(_implementation);
    }

    function upgradeTo(address newImplementation) public onlyGovOrOwner {
        _upgradeTo(newImplementation);
    }
}