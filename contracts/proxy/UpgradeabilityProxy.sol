pragma solidity ^0.8.0;

import "./Proxy.sol";


/**
 * @title UpgradeabilityProxy
 * @dev This contract represents a proxy where the implementation address to which it will delegate can be upgraded
 */
contract UpgradeabilityProxy is Proxy {
    /**
     * @dev This event will be emitted every time the implementation gets upgraded
     * @param implementation representing the address of the upgraded implementation
     */
    event Upgraded(address indexed implementation);

    // Storage position of the address of the current implementation
    bytes32 private constant IMPLEMENT_POSITION = keccak256("org.metadium.proxy.implementation");

    /*
     * @dev Tells the address of the current implementation
     * @return address of the current implementation
     */
    function implementation() public override view returns (address impl) {
        bytes32 position = IMPLEMENT_POSITION;
        assembly {
            impl := sload(position)
        }
    }

    /**
     * @dev Sets the address of the current implementation
     * @param newImplementation address representing the new implementation to be set
     */
    function _setImplementation(address newImplementation) internal {
        require(newImplementation != address(0), "newImplementation should be non-zero");
        bytes32 position = IMPLEMENT_POSITION;
        assembly {
            sstore(position, newImplementation)
        }
    }

    /**
     * @dev Upgrades the implementation address
     * @param newImplementation representing the address of the new implementation to be set
     */
    function _upgradeTo(address newImplementation) internal {
        require(newImplementation != address(0), "newImplementation should be non-zero");
        address currentImplementation = implementation();
        require(currentImplementation != newImplementation, "newImplementation should be not same as currentImplementation");
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }
}