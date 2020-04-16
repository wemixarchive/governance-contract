pragma solidity ^0.4.24;

import "../proxy/UpgradeabilityProxy.sol";

contract APerm is UpgradeabilityProxy {
    struct PermissionGroup {
        uint256 gid;
        uint256 perm;
    }

    struct PermissionAccount {
        address addr;
        uint256 gid;
    }

    struct PermissionNode {
        bytes32 nid;
        uint256 perm;
    }

    // group: index <-> group id
    mapping(uint256 => PermissionGroup) internal permissionGroups;
    mapping(uint256 => uint256) internal permissionGroupsIdx;
    uint256 internal permissionGroupLength;

    // accounts: index <-> address
    mapping(uint256 => PermissionAccount) internal permissionAccounts;
    mapping(address => uint256) internal permissionAccountsIdx;
    uint256 internal permissionAccountLength;

    // nodes: index <-> enode
    mapping(uint256 => PermissionNode) internal permissionNodes;
    mapping(bytes32 => uint256) internal permissionNodesIdx;
    uint256 internal permissionNodeLength;

    function isPermissionGroup(uint256 id) public view returns (bool) { return permissionGroupsIdx[id] != 0; }
    function getPermissionGroupLength() public view returns (uint256) { return permissionGroupLength; }
    function getPermissionGroup(uint256 idx) public view returns (uint256, uint256) {
        PermissionGroup memory g = permissionGroups[idx];
        return (g.gid, g.perm);
    }

    function isPermissionAccount(address addr) public view returns (bool) { return permissionAccountsIdx[addr] != 0; }
    function getPermissionAccountLength() public view returns (uint256) { return permissionAccountLength; }
    function getPermissionAccount(uint256 idx) public view returns (address, uint256) {
        PermissionAccount memory acct = permissionAccounts[idx];
        return (acct.addr, acct.gid);
    }

    function isPermissionNode(bytes32 id) public view returns (bool) { return permissionNodesIdx[id] != 0; }
    function getPermissionNodeLength() public view returns (uint256) { return permissionNodeLength; }
    function getPermissionNode(uint256 idx) public view returns (bytes32, uint256) {
        PermissionNode memory node = permissionNodes[idx];
        return (node.nid, node.perm);
    }
}
