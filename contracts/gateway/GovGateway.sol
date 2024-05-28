// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/proxy/beacon/IBeacon.sol";

contract GovGateway is ERC1967Proxy, IBeacon {

    constructor(address _imp) ERC1967Proxy(_imp, ''){
    }
    function implementation() external override view returns(address){
        return _implementation();
    }
    
}