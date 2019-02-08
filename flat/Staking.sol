pragma solidity ^0.4.13;

library SafeMath {

  /**
  * @dev Multiplies two numbers, reverts on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
    // benefit is lost if 'b' is also tested.
    // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
    if (a == 0) {
      return 0;
    }

    uint256 c = a * b;
    require(c / a == b);

    return c;
  }

  /**
  * @dev Integer division of two numbers truncating the quotient, reverts on division by zero.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b > 0); // Solidity only automatically asserts when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold

    return c;
  }

  /**
  * @dev Subtracts two numbers, reverts on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b <= a);
    uint256 c = a - b;

    return c;
  }

  /**
  * @dev Adds two numbers, reverts on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a);

    return c;
  }

  /**
  * @dev Divides two numbers and returns the remainder (unsigned integer modulo),
  * reverts when dividing by zero.
  */
  function mod(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b != 0);
    return a % b;
  }
}

contract Ownable {
  address private _owner;

  event OwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
  );

  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  constructor() internal {
    _owner = msg.sender;
    emit OwnershipTransferred(address(0), _owner);
  }

  /**
   * @return the address of the owner.
   */
  function owner() public view returns(address) {
    return _owner;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(isOwner());
    _;
  }

  /**
   * @return true if `msg.sender` is the owner of the contract.
   */
  function isOwner() public view returns(bool) {
    return msg.sender == _owner;
  }

  /**
   * @dev Allows the current owner to relinquish control of the contract.
   * @notice Renouncing to ownership will leave the contract without an owner.
   * It will not be possible to call the functions with the `onlyOwner`
   * modifier anymore.
   */
  function renounceOwnership() public onlyOwner {
    emit OwnershipTransferred(_owner, address(0));
    _owner = address(0);
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    _transferOwnership(newOwner);
  }

  /**
   * @dev Transfers control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function _transferOwnership(address newOwner) internal {
    require(newOwner != address(0));
    emit OwnershipTransferred(_owner, newOwner);
    _owner = newOwner;
  }
}

contract ReentrancyGuard {

  /// @dev counter to allow mutex lock with only one SSTORE operation
  uint256 private _guardCounter;

  constructor() internal {
    // The counter starts at one to prevent changing it from zero to a non-zero
    // value, which is a more expensive operation.
    _guardCounter = 1;
  }

  /**
   * @dev Prevents a contract from calling itself, directly or indirectly.
   * Calling a `nonReentrant` function from another `nonReentrant`
   * function is not supported. It is possible to prevent this from happening
   * by making the `nonReentrant` function external, and make it call a
   * `private` function that does the actual work.
   */
  modifier nonReentrant() {
    _guardCounter += 1;
    uint256 localCounter = _guardCounter;
    _;
    require(localCounter == _guardCounter);
  }

}

contract GovChecker is Ownable {

    IRegistry public reg;
    bytes32 public constant GOV_NAME ="GovernanceContract";
    bytes32 public constant STAKING_NAME ="Staking";
    bytes32 public constant BALLOT_STORAGE_NAME ="BallotStorage";
    bytes32 public constant ENV_STORAGE_NAME ="EnvStorage";

    /**
     * @dev Function to set registry address. Contract that wants to use registry should setRegistry first.
     * @param _addr address of registry
     * @return A boolean that indicates if the operation was successful.
     */
    function setRegistry(address _addr) public onlyOwner {
        reg = IRegistry(_addr);
    }
    
    modifier onlyGov() {
        require(getContractAddress(GOV_NAME) == msg.sender, "No Permission");
        _;
    }

    modifier onlyGovMem() {
        address addr = reg.getContractAddress(GOV_NAME);
        require(addr != address(0), "No Governance");
        require(IGov(addr).isMember(msg.sender), "No Permission");
        _;
    }

    function getContractAddress(bytes32 name) internal view returns (address) {
        return reg.getContractAddress(name);
    }

    function getStakingAddress() internal view returns (address) {
        return getContractAddress(STAKING_NAME);
    }

    function getBallotStorageAddress() internal view returns (address) {
        return getContractAddress(BALLOT_STORAGE_NAME);
    }

    function getEnvStorageAddress() internal view returns (address) {
        return getContractAddress(ENV_STORAGE_NAME);
    }
}

contract Staking is GovChecker, ReentrancyGuard {
    using SafeMath for uint256;

    mapping(address => uint256) private balance;
    mapping(address => uint256) private lockedBalance;
    uint256 private totalLockedBalance;
    
    event Staked(address indexed payee, uint256 amount, uint256 total, uint256 available);
    event Unstaked(address indexed payee, uint256 amount, uint256 total, uint256 available);
    event Locked(address indexed payee, uint256 amount, uint256 total, uint256 available);
    event Unlocked(address indexed payee, uint256 amount, uint256 total, uint256 available);

    constructor(address registry) public {
        totalLockedBalance = 0;
        setRegistry(registry);
    }

    function () external payable {
        revert();
    }

    /**
    * @dev Deposit from a sender.
    */
    function deposit() external nonReentrant payable {
        require(msg.value > 0, "Deposit amount should be greater than zero");

        balance[msg.sender] = balance[msg.sender].add(msg.value);

        emit Staked(msg.sender, msg.value, balance[msg.sender], availableBalanceOf(msg.sender));
    }

    /**
    * @dev Withdraw for a sender.
    * @param amount The amount of funds will be withdrawn and transferred to.
    */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount <= availableBalanceOf(msg.sender), "Withdraw amount should be equal or less than balance");

        balance[msg.sender] = balance[msg.sender].sub(amount);
        msg.sender.transfer(amount);

        emit Unstaked(msg.sender, amount, balance[msg.sender], availableBalanceOf(msg.sender));
    }

    /**
    * @dev Lock fund
    * @param payee The address whose funds will be locked.
    * @param lockAmount The amount of funds will be locked.
    */
    function lock(address payee, uint256 lockAmount) external onlyGov {
        require(balance[payee] >= lockAmount, "Lock amount should be equal or less than balance");
        require(availableBalanceOf(payee) >= lockAmount, "Insufficient balance that can be locked");

        lockedBalance[payee] = lockedBalance[payee].add(lockAmount);
        totalLockedBalance = totalLockedBalance.add(lockAmount);

        emit Locked(payee, lockAmount, balance[payee], availableBalanceOf(payee));
    }

    /**
    * @dev Unlock fund
    * @param payee The address whose funds will be unlocked.
    * @param unlockAmount The amount of funds will be unlocked.
    */
    function unlock(address payee, uint256 unlockAmount) external onlyGov {
        require(lockedBalance[payee] >= unlockAmount, "Unlock amount should be equal or less than balance locked");

        lockedBalance[payee] = lockedBalance[payee].sub(unlockAmount);
        totalLockedBalance = totalLockedBalance.sub(unlockAmount);

        emit Unlocked(payee, unlockAmount, balance[payee], availableBalanceOf(payee));
    }

    function balanceOf(address payee) public view returns (uint256) {
        return balance[payee];
    }

    function lockedBalanceOf(address payee) public view returns (uint256) {
        return lockedBalance[payee];
    }

    function availableBalanceOf(address payee) public view returns (uint256) {
        return balance[payee].sub(lockedBalance[payee]);
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
        if (lockedBalance[payee] == 0 || factor == 0) return 0;
        return lockedBalance[payee].mul(factor).div(totalLockedBalance);
    }
}

interface IGov {
    function isMember(address) external view returns (bool);
    function getMember(uint256) external view returns (address);
    function getMemberLength() external view returns (uint256);
    function getNodeIdxFromMember(address) external view returns (uint256);
    function getMemberFromNodeIdx(uint256) external view returns (address);
    function getNodeLength() external view returns (uint256);
    function getNode(uint256) external view returns (bytes, bytes, uint);
    function getBallotInVoting() external view returns (uint256);
}

interface IRegistry {
    function getContractAddress(bytes32) external view returns (address);
}

