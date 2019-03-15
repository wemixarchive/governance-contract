pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "./GovChecker.sol";


contract Staking is GovChecker, ReentrancyGuard {
    using SafeMath for uint256;

    mapping(address => uint256) private _balance;
    mapping(address => uint256) private _lockedBalance;
    uint256 private _totalLockedBalance;
    bool private revoked = false;
    
    event Staked(address indexed payee, uint256 amount, uint256 total, uint256 available);
    event Unstaked(address indexed payee, uint256 amount, uint256 total, uint256 available);
    event Locked(address indexed payee, uint256 amount, uint256 total, uint256 available);
    event Unlocked(address indexed payee, uint256 amount, uint256 total, uint256 available);
    event TransferLocked(address indexed payee, uint256 amount, uint256 total, uint256 available);
    event Revoked(address indexed owner, uint256 amount);

    constructor(address registry, bytes data) public {
        _totalLockedBalance = 0;
        setRegistry(registry);

        // data is only for test purpose
        if (data.length == 0)
            return;

        // []{address, amount}
        address addr;
        uint amount;
        uint ix;
        uint eix;
        assembly {
            ix := add(data, 0x20)
        }
        eix = ix + data.length;
        while (ix < eix) {
            assembly {
                amount := mload(ix)
            }
            addr = address(amount);
            ix += 0x20;
            require(ix < eix);
            assembly {
                amount := mload(ix)
            }
            ix += 0x20;

            _balance[addr] = amount;
            _lockedBalance[addr] = amount;
        }
    }

    function () external payable {
        revert();
    }

    /**
    * @dev Deposit from a sender.
    */
    function deposit() external nonReentrant notRevoked payable {
        require(msg.value > 0, "Deposit amount should be greater than zero");

        _balance[msg.sender] = _balance[msg.sender].add(msg.value);

        emit Staked(msg.sender, msg.value, _balance[msg.sender], availableBalanceOf(msg.sender));
    }

    /**
    * @dev Withdraw for a sender.
    * @param amount The amount of funds will be withdrawn and transferred to.
    */
    function withdraw(uint256 amount) external nonReentrant notRevoked {
        require(amount > 0, "Amount should be bigger than zero");
        require(amount <= availableBalanceOf(msg.sender), "Withdraw amount should be equal or less than balance");

        _balance[msg.sender] = _balance[msg.sender].sub(amount);
        msg.sender.transfer(amount);

        emit Unstaked(msg.sender, amount, _balance[msg.sender], availableBalanceOf(msg.sender));
    }

    /**
    * @dev Lock fund
    * @param payee The address whose funds will be locked.
    * @param lockAmount The amount of funds will be locked.
    */
    function lock(address payee, uint256 lockAmount) external onlyGov {
        if (lockAmount == 0) return;
        require(_balance[payee] >= lockAmount, "Lock amount should be equal or less than balance");
        require(availableBalanceOf(payee) >= lockAmount, "Insufficient balance that can be locked");

        _lockedBalance[payee] = _lockedBalance[payee].add(lockAmount);
        _totalLockedBalance = _totalLockedBalance.add(lockAmount);

        emit Locked(payee, lockAmount, _balance[payee], availableBalanceOf(payee));
    }

    /**
    * @dev Transfer locked funds to governance
    * @param from The address whose funds will be transfered.
    * @param amount The amount of funds will be transfered.
    */
    function transferLocked(address from, uint256 amount) external onlyGov {
        if (amount == 0) return;
        unlock(from, amount);
        _balance[from] = _balance[from].sub(amount);
        address rewardPool = getRewardPoolAddress();
        _balance[rewardPool] = _balance[rewardPool].add(amount);

        emit TransferLocked(from, amount, _balance[from], availableBalanceOf(from));
    }

    /**
    * @dev Unlock fund
    * @param payee The address whose funds will be unlocked.
    * @param unlockAmount The amount of funds will be unlocked.
    */
    function unlock(address payee, uint256 unlockAmount) public onlyGov {
        if (unlockAmount == 0) return;
        // require(_lockedBalance[payee] >= unlockAmount, "Unlock amount should be equal or less than balance locked");
        _lockedBalance[payee] = _lockedBalance[payee].sub(unlockAmount);
        _totalLockedBalance = _totalLockedBalance.sub(unlockAmount);

        emit Unlocked(payee, unlockAmount, _balance[payee], availableBalanceOf(payee));
    }

    function balanceOf(address payee) public view returns (uint256) {
        return _balance[payee];
    }

    function lockedBalanceOf(address payee) public view returns (uint256) {
        return _lockedBalance[payee];
    }

    function availableBalanceOf(address payee) public view returns (uint256) {
        return _balance[payee].sub(_lockedBalance[payee]);
    }

    /**
    * @dev Calculate voting weight which range between 0 and 100.
    * @param payee The address whose funds were locked.
    */
    function calcVotingWeight(address payee) public view returns (uint256) {
        return calcVotingWeightWithScaleFactor(payee, 1e2);
    }

    /**
    * @dev Calculate voting weight with a scale factor.
    * @param payee The address whose funds were locked.
    * @param factor The scale factor for weight. For instance:
    *               if 1e1, result range is between 0 ~ 10
    *               if 1e2, result range is between 0 ~ 100
    *               if 1e3, result range is between 0 ~ 1000
    */
    function calcVotingWeightWithScaleFactor(address payee, uint32 factor) public view returns (uint256) {
        if (_lockedBalance[payee] == 0 || factor == 0) return 0;
        return _lockedBalance[payee].mul(factor).div(_totalLockedBalance);
    }

    function isRevoked() public view returns (bool) {
        return revoked;
    }

    modifier notRevoked(){
        require(!revoked, "Is revoked");
        _;
    }

    /**
    * @notice Allows the owner to revoke the staking. Coins already staked
    * staked funds are returned to the owner.
    */
    function revoke() public onlyOwner notRevoked{
        address contractOwner = owner();
        uint256 balance = address(this).balance;

        require(balance > 0);

        contractOwner.transfer(balance);
        revoked = true;

        emit Revoked(contractOwner, balance);
    }
}
