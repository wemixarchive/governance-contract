pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interface/IStaking.sol";
import "../GovChecker.sol";
// import "../proxy/UpgradeabilityProxy.sol";
// import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

import 'hardhat/console.sol';

abstract contract AGov is GovChecker {
    uint public modifiedBlock;

    // For voting member
    mapping(uint256 => address) internal members;
    mapping(address => uint256) internal memberIdx;
    uint256 internal memberLength;

    // For reward member
    mapping(uint256 => address) internal rewards;
    mapping(address => uint256) internal rewardIdx;

    //For staking member
    mapping(uint256 => address) internal stakers;
    mapping(address => uint256) internal stakersIdx;
    mapping(address => address) internal memberToStaker;

    // For enode
    struct Node {
        bytes name;
        bytes enode;
        bytes ip;
        uint port;
    }

    mapping(uint256 => Node) internal nodes;
    mapping(address => uint256) internal nodeIdxFromMember;
    mapping(uint256 => address) internal nodeToMember;
    uint256 internal nodeLength;


    // For ballot
    uint256 public ballotLength;
    uint256 public voteLength;
    uint256 internal ballotInVoting;

    function isMember(address addr) public view returns (bool) { return (memberIdx[addr] != 0); }
    function getMember(uint256 idx) public view returns (address) { return members[idx]; }
    function getMemberLength() public view returns (uint256) { return memberLength; }
    function getReward(uint256 idx) public view returns (address) { return rewards[idx]; }
    function getNodeIdxFromMember(address addr) public view returns (uint256) { return nodeIdxFromMember[addr]; }
    function getMemberFromNodeIdx(uint256 idx) public view returns (address) { return nodeToMember[idx]; }
    function getNodeLength() public view returns (uint256) { return nodeLength; }
    //====NxtMeta=====/
    function getStaker(uint256 idx) public view returns (address) { return stakers[idx]; }

    function getNode(uint256 idx) public view returns (bytes memory name, bytes memory enode, bytes memory ip, uint port) {
        return (nodes[idx].name, nodes[idx].enode, nodes[idx].ip, nodes[idx].port);
    }

    function getBallotInVoting() public view returns (uint256) { return ballotInVoting; }
}
