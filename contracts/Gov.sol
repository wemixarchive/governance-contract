pragma solidity ^0.4.24;

//import "openzeppelin-solidity/contracts/math/SafeMath.sol";
// import "./proxy/UpgradeabilityProxy.sol";
// import "./interface/IStaking.sol";
import "./abstract/AGov.sol";
import "./abstract/APerm.sol";


contract Gov is AGov, APerm {
    // "Metadium Governance"
    uint public magic = 0x4d6574616469756d20476f7665726e616e6365;
    bool private _initialized;

    function init(
        address registry,
        address implementation,
        uint256 lockAmount,
        bytes name,
        bytes enode,
        bytes ip,
        uint port
    )
        public onlyOwner
    {
        require(_initialized == false, "Already initialized");
        require(lockAmount > 0, "lockAmount should be more then zero");
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
        node.name = name;
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
        bytes data,
        bytes permitted_accts,
        bytes permitted_nodes
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

            memberLength += 1;
            nodeLength += 1;

            members[memberLength] = addr;
            memberIdx[addr] = memberLength;
            rewards[memberLength] = addr;
            rewardIdx[addr] = memberLength;

            Node storage node = nodes[nodeLength];
            node.name = name;
            node.enode = enode;
            node.ip = ip;
            node.port = port;
            nodeToMember[nodeLength] = addr;
            nodeIdxFromMember[addr] = nodeLength;
        }

        // handle accounts
        assembly {
            ix := add(permitted_accts, 0x20)
        }
        eix = ix + permitted_accts.length;
        while (ix < eix) {
            assembly {
                port := mload(ix)
            }
            addr = address(port);
            ix += 0x20;

            permissionAccountLength += 1;
            PermissionAccount storage a = permissionAccounts[permissionAccountLength];
            a.addr = addr;
            a.gid = 1;
            permissionAccountsIdx[addr] = permissionAccountLength;
        }

        if (permissionAccountLength > 0) {
            permissionGroupLength += 1;
            PermissionGroup storage g = permissionGroups[permissionGroupLength];
            g.gid = 1;
            g.perm = 1;
            permissionGroupsIdx[g.gid] = permissionGroupLength;
        }

        // handle permitted nodes
        assembly {
            ix := add(permitted_nodes, 0x20)
        }
        eix = ix + permitted_nodes.length;
        while (ix < eix) {
            assembly {
                enode := ix
            }
            ix += 0x20 + enode.length;
            require(ix < eix);

            assembly {
                port := mload(ix)
            }
            ix += 0x20;

            permissionNodeLength += 1;
            permissionNodes[permissionNodeLength].nid = enode;
            permissionNodes[permissionNodeLength].perm = port;
            permissionNodesIdx[enode] = permissionNodeLength;
        }
    }
}
