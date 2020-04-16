pragma solidity ^0.4.24;

import "../proxy/UpgradeabilityProxy.sol";

contract APerm is UpgradeabilityProxy {
    uint public modifiedBlock;

    struct Group {
        uint256 id;
        uint256 perm;
    }

    struct Acct {
        address addr;
        uint256 group;
    }

    struct Node {
        bytes   id;
        uint256 perm;
    }

    // group: index <-> group id
    mapping(uint256 => Group) internal groups;
    mapping(uint256 => uint256) internal groupsIdx;
    uint256 internal groupLength;

    // accounts: index <-> address
    mapping(uint256 => Acct) internal accounts;
    mapping(address => uint256) internal accountsIdx;
    uint256 internal accountLength;

    // nodes: index <-> enode
    mapping(uint256 => Node) internal nodes;
    mapping(bytes => uint256) internal nodesIdx;
    uint256 internal nodeLength;

    constructor() public {}

    function getGroupLength() public view returns (uint256) { return groupLength; }
    function getGroup(uint256 idx) public view returns (uint256, uint256) {
        Group memory g = groups[idx];
        return (g.id, g.perm);
    }

    function getAccountLength() public view returns (uint256) { return accountLength; }
    function getAccount(uint256 idx) public view returns (address, uint256) {
        Acct memory acct = accounts[idx];
        return (acct.addr, acct.group);
    }

    function getNodeLength() public view returns (uint256) { return nodeLength; }
    function getNode(uint256 idx) public view returns (bytes, uint256) {
        Node memory node = nodes[idx];
        return (node.id, node.perm);
    }
}
