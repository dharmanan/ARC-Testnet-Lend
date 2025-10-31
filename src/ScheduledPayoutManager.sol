// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./LendingPool.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ScheduledPayoutManager is Ownable, ReentrancyGuard {
    LendingPool public immutable pool;
    uint256 public minDelay = 60; // minimum delay in seconds (for tests)
    uint256 public nextId = 1;

    struct Scheduled {
        uint256 id;
        address owner;
        address token;
        address recipient;
        uint256 scaledAmount; // scaled by pool's 1e18/index
        uint256 releaseTimestamp;
        uint256 executorFee; // token amount
        bool executed;
        bool cancelled;
    }

    mapping(uint256 => Scheduled) public schedules;
    event ScheduledCreated(uint256 id, address owner, address token, address recipient, uint256 releaseTimestamp, uint256 scaledAmount, uint256 executorFee);
    event ScheduledExecuted(uint256 id, address executor, uint256 amount);
    event ScheduledCancelled(uint256 id);

    constructor(LendingPool _pool) Ownable(msg.sender) {
        pool = _pool;
    }

    function setMinDelay(uint256 _minDelay) external onlyOwner {
        minDelay = _minDelay;
    }

    /// @notice User schedules a payout of a specific token `amount` (pool units) at timestamp.
    function schedulePayout(address token, address recipient, uint256 amount, uint256 releaseTimestamp, uint256 executorFee) external nonReentrant returns (uint256) {
        require(releaseTimestamp >= block.timestamp + minDelay, "release too soon");
        require(amount > 0, "amount>0");
        // lock funds in pool (manager must be allowed scheduler in pool)
        pool.lockForScheduleOnBehalf(token, msg.sender, amount);

        uint256 scaled = (amount * 1e18) / 1e18;

        uint256 id = nextId++;
        schedules[id] = Scheduled({
            id: id,
            owner: msg.sender,
            token: token,
            recipient: recipient,
            scaledAmount: scaled,
            releaseTimestamp: releaseTimestamp,
            executorFee: executorFee,
            executed: false,
            cancelled: false
        });

        emit ScheduledCreated(id, msg.sender, token, recipient, releaseTimestamp, scaled, executorFee);
        return id;
    }

    /// @notice Anyone (executor / relayer) can call to execute if timestamp passed. Executor gets executorFee.
    function executeScheduled(uint256 id) external nonReentrant {
        Scheduled storage s = schedules[id];
        require(!s.executed, "already executed");
        require(!s.cancelled, "cancelled");
        require(block.timestamp >= s.releaseTimestamp, "too early");

        s.executed = true;
        // call pool to withdraw locked scaled amount; pass msg.sender as executor for fee
        pool.withdrawForScheduled(s.token, s.owner, s.recipient, s.scaledAmount, s.executorFee, msg.sender);

        emit ScheduledExecuted(id, msg.sender, (s.scaledAmount * 1e18) / 1e18);
    }

    function cancelScheduled(uint256 id) external nonReentrant {
        Scheduled storage s = schedules[id];
        require(!s.executed, "already executed");
        require(!s.cancelled, "already cancelled");
        require(msg.sender == s.owner || msg.sender == owner(), "not allowed");
        s.cancelled = true;
        // Return funds to owner: use pool.withdrawForScheduled to recipient=owner and executorFee=0
        // Pass address(0) for executor since there's no fee in cancellation
        pool.withdrawForScheduled(s.token, s.owner, s.owner, s.scaledAmount, 0, address(0));
        emit ScheduledCancelled(id);
    }
}