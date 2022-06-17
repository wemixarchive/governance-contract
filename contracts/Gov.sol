// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import "@openzeppelin/contracts/utils/math/SafeMath.sol";
// import "./proxy/UpgradeabilityProxy.sol";
// import "./interface/IStaking.sol";
import "./abstract/AGov.sol";
// import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/Proxy.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade.sol";

contract Gov is AGov, Proxy, ERC1967Upgrade {
    // "Metadium Governance"
    uint public magic = 0x4d6574616469756d20476f7665726e616e6365;
    bool private _initialized;

    function implementation() external view returns(address){
        return _implementation();
    }
    /**
     * @dev Returns the current implementation address.
     */
    function _implementation() internal view virtual override returns (address impl) {
        return ERC1967Upgrade._getImplementation();
    }
    
    function init(
        address registry,
        address newImplementation,
        uint256 lockAmount,
        bytes memory name,
        bytes memory enode,
        bytes memory ip,
        uint port
    )
        public onlyOwner
    {
        require(_initialized == false, "Already initialized");
        require(lockAmount > 0, "lockAmount should be more then zero");
        setRegistry(registry);
        // _setImplementation(implementation);
        _upgradeToAndCallUUPS(newImplementation, new bytes(0), false);

        // Lock
        IStaking staking = IStaking(getStakingAddress());
        require(staking.availableBalanceOf(msg.sender) >= lockAmount, "Insufficient staking");
        staking.lock(msg.sender, lockAmount);

        // Add voting member
        memberLength = 1;
        voters[memberLength] = msg.sender;
        voterIdx[msg.sender] = memberLength;

        // Add reward member
        rewards[memberLength] = msg.sender;
        rewardIdx[msg.sender] = memberLength;

        stakers[memberLength] = msg.sender;
        stakerIdx[msg.sender] = memberLength;
        // stakerToVoter[msg.sender] = msg.sender;

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
        address newImplementation,
        bytes memory data
    )
        public onlyOwner
    {
        require(_initialized == false, "Already initialized");

        setRegistry(registry);
        _upgradeTo(newImplementation);

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
                addr := mload(ix)
            }
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
            voters[idx] = addr;
            voterIdx[addr] = idx;
            rewards[idx] = addr;
            rewardIdx[addr] = idx;
            stakers[idx] = addr;
            stakerIdx[addr] = idx;

            Node storage node = nodes[idx];
            node.name = name;
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
