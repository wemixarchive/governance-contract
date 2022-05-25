pragma solidity ^0.8.0;

import "../abstract/AEnvStorage.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";


contract EnvStorage is ProxyAdmin, AEnvStorage {
    modifier onlyGovOrOwner() {
        require((getGovAddress() == msg.sender) || owner() == msg.sender, "No Permission");
        _;
    }

    constructor(address _registry, address _implementation) public {
        require(_registry != _implementation, "registry should not be same as implementation"); 
        setRegistry(_registry);
        upgradeTo(_implementation);
    }

    function upgradeTo(address newImplementation) public onlyGovOrOwner {
        upgradeTo(newImplementation);
    }
}