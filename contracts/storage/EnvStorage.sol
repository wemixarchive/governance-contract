pragma solidity ^0.8.0;

import "../abstract/AEnvStorage.sol";
import "../proxy/UpgradeabilityProxy.sol";


contract EnvStorage is UpgradeabilityProxy, AEnvStorage {
    modifier onlyGovOrOwner() {
        require((getGovAddress() == msg.sender) || owner() == msg.sender, "No Permission");
        _;
    }

    constructor(address _registry, address _implementation) UpgradeabilityProxy(){
        require(_registry != _implementation, "registry should not be same as implementation"); 
        setRegistry(_registry);
        _upgradeTo(_implementation);
    }

    function upgradeTo(address newImplementation) public onlyGovOrOwner {
        upgradeTo(newImplementation);
    }
}