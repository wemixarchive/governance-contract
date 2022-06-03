pragma solidity ^0.8.0;

import "../abstract/AEnvStorage.sol";
// import "../proxy/UpgradeabilityProxy.sol";
// import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
// import "@openzeppelin/contracts/proxy/Proxy.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";



contract EnvStorage is ERC1967Proxy, AEnvStorage {
    modifier onlyGovOrOwner() {
        require((getGovAddress() == msg.sender) || owner() == msg.sender, "No Permission");
        _;
    }

    constructor(address _registry, address _implementation) ERC1967Proxy(_implementation, ''){
        require(_registry != _implementation, "registry should not be same as implementation"); 
        setRegistry(_registry);
        // _upgradeTo(_implementation);
    }

    function upgradeTo(address newImplementation) public onlyGovOrOwner{
        _upgradeToAndCallUUPS(newImplementation, '', false);
    }

    function implementation() external view returns(address){
        return _implementation();
    }

    // function setImplementation(address newImplementation) public onlyGovOrOwner {
    //     _upgradeTo(newImplementation);
    // }
}