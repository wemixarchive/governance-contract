pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./proxy/UpgradeabilityProxy.sol";
import "./interface/IStaking.sol";
import "./GovChecker.sol";


contract Gov is UpgradeabilityProxy, GovChecker {
    // "Metadium Governance"
    uint public magic = 0x4d6574616469756d20476f7665726e616e6365;
    uint public modifiedBlock;
    bool private _initialized;

    // For voting member
    mapping(uint256 => address) internal members;
    mapping(address => uint256) internal memberIdx;
    uint256 internal memberLength;

    // For reward member
    mapping(uint256 => address) internal rewards;
    mapping(address => uint256) internal rewardIdx;

    // For enode
    struct Node {
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

    constructor() public {
        _initialized = false;
        memberLength = 0;
        nodeLength = 0;
        ballotLength = 0;
        voteLength = 0;
        ballotInVoting = 0;
    }

    function isMember(address addr) public view returns (bool) { return (memberIdx[addr] != 0); }
    function getMember(uint256 idx) public view returns (address) { return members[idx]; }
    function getMemberLength() public view returns (uint256) { return memberLength; }
    function getReward(uint256 idx) public view returns (address) { return rewards[idx]; }
    function getNodeIdxFromMember(address addr) public view returns (uint256) { return nodeIdxFromMember[addr]; }
    function getMemberFromNodeIdx(uint256 idx) public view returns (address) { return nodeToMember[idx]; }
    function getNodeLength() public view returns (uint256) { return nodeLength; }

    function getNode(uint256 idx) public view returns (bytes enode, bytes ip, uint port) {
        return (nodes[idx].enode, nodes[idx].ip, nodes[idx].port);
    }

    function getBallotInVoting() public view returns (uint256) { return ballotInVoting; }

    function init(
        address registry,
        address implementation,
        uint256 lockAmount,
        bytes enode,
        bytes ip,
        uint port
    )
        public onlyOwner
    {
        require(_initialized == false, "Already initialized");

        setRegistry(registry);
        setImplementation(implementation);

        // Lock
        IStaking staking = IStaking(getStakingAddress());
        require(staking.availableBalanceOf(msg.sender) >= lockAmount, "Insufficient staking");
        staking.lock(msg.sender, lockAmount);

        // Add voting member
        memberLength = 1;
        members[memberLength] = msg.sender;
        memberIdx[msg.sender] = memberLength;

        // Add reward member
        rewards[memberLength] = msg.sender;
        rewardIdx[msg.sender] = memberLength;

        // Add node
        nodeLength = 1;
        Node storage node = nodes[nodeLength];
        node.enode = enode;
        node.ip = ip;
        node.port = port;
        nodeIdxFromMember[msg.sender] = nodeLength;
        nodeToMember[nodeLength] = msg.sender;

        _initialized = true;
        modifiedBlock = block.number;
    }

    function initOnce(
        address registry,
        address implementation,
        bytes data
    )
        public onlyOwner
    {
        require(_initialized == false, "Already initialized");

        setRegistry(registry);
        setImplementation(implementation);

        _initialized = true;
        modifiedBlock = block.number;

        // []{uint addr, bytes name, bytes enode, bytes ip, uint port}
        // 32 bytes, [32 bytes, <data>] * 3, 32 bytes
        address addr;
        bytes memory name;
        bytes memory enode;
        bytes memory ip;
        uint port;
        uint idx = 0;

        uint ix;
        uint eix;
        assembly {
            ix := add(data, 0x20)
        }
        eix = ix + data.length;
        while (ix < eix) {
            assembly {
                port := mload(ix)
            }
            addr = address(port);
            ix += 0x20;
            require(ix < eix);

            assembly {
                name := ix
            }
            ix += 0x20 + name.length;
            require(ix < eix);

            assembly {
                enode := ix
            }
            ix += 0x20 + enode.length;
            require(ix < eix);

            assembly {
                ip := ix
            }
            ix += 0x20 + ip.length;
            require(ix < eix);

            assembly {
                port := mload(ix)
            }
            ix += 0x20;

            idx += 1;
            members[idx] = addr;
            memberIdx[addr] = idx;
            rewards[idx] = addr;
            rewardIdx[addr] = idx;

            Node storage node = nodes[idx];
            node.enode = enode;
            node.ip = ip;
            node.port = port;
            nodeToMember[idx] = addr;
            nodeIdxFromMember[addr] = idx;
        }
        memberLength = idx;
        nodeLength = idx;
    }
}
