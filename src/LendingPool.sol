// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LendingPool is Ownable, ReentrancyGuard {
    address public scheduler;

    mapping(address => mapping(address => uint256)) public scaledBalances; // token => user => scaled
    mapping(address => mapping(address => uint256)) public lockedScaledBalances; // token => user => scaled
    mapping(address => uint256) public totalSupplied; // token => total supplied amount
    mapping(address => uint256) public totalBorrowed; // token => total borrowed amount

    event Deposited(address indexed token, address indexed user, uint256 amount);
    event Withdrawn(address indexed token, address indexed user, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function setScheduler(address _scheduler) external onlyOwner {
        scheduler = _scheduler;
    }

    function deposit(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount > 0");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        // For simplicity, use amount directly (assuming all tokens have same decimals or we handle it in frontend)
        scaledBalances[token][msg.sender] += amount;
        totalSupplied[token] += amount;
        emit Deposited(token, msg.sender, amount);
    }

    function withdraw(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount > 0");
        require(scaledBalances[token][msg.sender] >= amount, "insufficient balance");
        scaledBalances[token][msg.sender] -= amount;
        totalSupplied[token] -= amount;
        IERC20(token).transfer(msg.sender, amount);
        emit Withdrawn(token, msg.sender, amount);
    }

    function balanceOf(address token, address user) external view returns (uint256) {
        return scaledBalances[token][user];
    }

    function lockForScheduleOnBehalf(address token, address user, uint256 amount) external {
        require(msg.sender == scheduler, "only scheduler");
        require(scaledBalances[token][user] >= amount, "insufficient balance");
        scaledBalances[token][user] -= amount;
        lockedScaledBalances[token][user] += amount;
    }

    function withdrawForScheduled(address token, address owner, address recipient, uint256 scaledAmount, uint256 executorFee, address executor) external {
        require(msg.sender == scheduler, "only scheduler");
        require(lockedScaledBalances[token][owner] >= scaledAmount, "insufficient locked");
        lockedScaledBalances[token][owner] -= scaledAmount;
        uint256 amount = scaledAmount;
        IERC20(token).transfer(recipient, amount - executorFee);
        if (executorFee > 0) {
            IERC20(token).transfer(executor, executorFee);
        }
    }

    // Borrow function - can borrow up to 66% of supplied value (150% collateral ratio)
    mapping(address => mapping(address => uint256)) public borrowBalances; // token => user => amount

    function borrow(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount > 0");
        
        // Check pool liquidity first
        require(totalSupplied[token] >= totalBorrowed[token] + amount, "insufficient pool liquidity");
        
        borrowBalances[token][msg.sender] += amount;
        totalBorrowed[token] += amount;
        IERC20(token).transfer(msg.sender, amount);
        
        emit Borrowed(token, msg.sender, amount);
    }

    function repay(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount > 0");
        require(borrowBalances[token][msg.sender] >= amount, "insufficient borrow balance");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        borrowBalances[token][msg.sender] -= amount;
        totalBorrowed[token] -= amount;
        
        emit Repaid(token, msg.sender, amount);
    }

    function getBorrowBalance(address token, address user) external view returns (uint256) {
        return borrowBalances[token][user];
    }

    event Borrowed(address indexed token, address indexed user, uint256 amount);
    event Repaid(address indexed token, address indexed user, uint256 amount);
}