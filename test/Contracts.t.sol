// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/GenericAMMPair.sol";
import "../src/LendingPool.sol";
import "../src/ScheduledPayoutManager.sol";
import "../src/MockWBTC.sol";
import "../src/MockETH.sol";

contract GenericAMMPairTest is Test {
    GenericAMMPair pair;
    MockWBTC wbtc;
    MockETH eth;
    address alice = address(0x1);
    address bob = address(0x2);

    function setUp() public {
        // Deploy tokens
        wbtc = new MockWBTC();
        eth = new MockETH();

        // Deploy pair
        pair = new GenericAMMPair(address(wbtc), address(eth));

        // Mint tokens to users
        wbtc.mint(alice, 10 ether); // 10 WBTC
        eth.mint(alice, 100 ether); // 100 ETH
        wbtc.mint(bob, 5 ether);
        eth.mint(bob, 50 ether);
    }

    // TEST 1: Add Liquidity - Success Case
    function test_addLiquidity_success() public {
        vm.startPrank(alice);

        // Approve tokens - balanced: 2 and 8 = ratio 20% (OK, between 10-90)
        wbtc.approve(address(pair), 2 ether);
        eth.approve(address(pair), 8 ether);

        // Add liquidity
        pair.addLiquidity(2 ether, 8 ether);

        // Verify state
        assertEq(pair.reserve0(), 2 ether);
        assertEq(pair.reserve1(), 8 ether);
        assertGt(pair.totalLiquidity(), 0);

        vm.stopPrank();
    }

    // TEST 2: Add Liquidity - Imbalanced (Should Revert)
    function test_addLiquidity_imbalanced_revert() public {
        vm.startPrank(alice);

        wbtc.approve(address(pair), 1 ether);
        eth.approve(address(pair), 100 ether);

        // Try to add 1 WBTC and 100 ETH (extremely imbalanced)
        // Ratio = (1 * 100) / (1 + 100) = 0.99% (< 10%, should revert)

        vm.expectRevert("Imbalanced initial liquidity");
        pair.addLiquidity(1 ether, 100 ether);

        vm.stopPrank();
    }

    // TEST 3: Swap - Basic Functionality
    function test_swap_basic() public {
        vm.startPrank(alice);

        // Setup: Add liquidity first with balanced amounts
        wbtc.approve(address(pair), 2 ether);
        eth.approve(address(pair), 8 ether);
        pair.addLiquidity(2 ether, 8 ether);

        vm.stopPrank();

        vm.startPrank(bob);

        // Bob swaps 1 ETH for WBTC
        eth.approve(address(pair), 1 ether);
        uint256 wbtcBefore = wbtc.balanceOf(bob);

        // Calculate expected output
        uint256 amountIn = 1 ether;
        uint256 amountInWithFee = (amountIn * 997) / 1000;
        uint256 reserve0 = pair.reserve0();
        uint256 reserve1 = pair.reserve1();
        uint256 expectedOut = (amountInWithFee * reserve0) / (reserve1 + amountInWithFee);

        // Execute swap
        pair.swap(address(eth), 1 ether, 0);

        uint256 wbtcAfter = wbtc.balanceOf(bob);
        assertApproxEqAbs(wbtcAfter - wbtcBefore, expectedOut, 1);

        vm.stopPrank();
    }

    // TEST 4: Swap - Zero Amount (Should Revert)
    function test_swap_zero_revert() public {
        vm.startPrank(alice);

        wbtc.approve(address(pair), 2 ether);
        eth.approve(address(pair), 8 ether);
        pair.addLiquidity(2 ether, 8 ether);

        vm.stopPrank();

        vm.startPrank(bob);
        vm.expectRevert("Amount in must be positive");
        pair.swap(address(eth), 0, 0);
        vm.stopPrank();
    }

    // TEST 5: Swap - Slippage Protection
    function test_swap_slippage_protection() public {
        vm.startPrank(alice);

        wbtc.approve(address(pair), 2 ether);
        eth.approve(address(pair), 8 ether);
        pair.addLiquidity(2 ether, 8 ether);

        vm.stopPrank();

        vm.startPrank(bob);

        eth.approve(address(pair), 1 ether);

        // Try to swap with very high minimum output (should fail)
        vm.expectRevert("Slippage exceeded");
        pair.swap(address(eth), 1 ether, 100 ether); // Impossible minimum

        vm.stopPrank();
    }

    // TEST 6: Pause Functionality
    function test_pause_functionality() public {
        vm.startPrank(alice);

        wbtc.approve(address(pair), 2 ether);
        eth.approve(address(pair), 8 ether);
        pair.addLiquidity(2 ether, 8 ether);

        vm.stopPrank();

        // Owner (Test contract) pauses
        pair.pause();
        assertTrue(pair.paused());

        vm.startPrank(alice);

        // Try to swap while paused
        eth.approve(address(pair), 1 ether);
        vm.expectRevert("Contract is paused");
        pair.swap(address(eth), 1 ether, 0);

        vm.stopPrank();

        // Unpause
        pair.unpause();
        assertFalse(pair.paused());

        vm.startPrank(alice);
        // Now swap should work
        pair.swap(address(eth), 0.1 ether, 0);

        vm.stopPrank();
    }

    // TEST 7: Pause - Non-Owner Cannot Pause
    function test_pause_only_owner() public {
        vm.startPrank(bob);

        vm.expectRevert();
        pair.pause();

        vm.stopPrank();
    }

    // TEST 8: Remove Liquidity
    function test_removeLiquidity_success() public {
        vm.startPrank(alice);

        wbtc.approve(address(pair), 2 ether);
        eth.approve(address(pair), 8 ether);
        pair.addLiquidity(2 ether, 8 ether);

        uint256 liquidityToRemove = pair.totalLiquidity() / 2;

        uint256 wbtcBefore = wbtc.balanceOf(alice);
        uint256 ethBefore = eth.balanceOf(alice);

        pair.removeLiquidity(liquidityToRemove);

        uint256 wbtcAfter = wbtc.balanceOf(alice);
        uint256 ethAfter = eth.balanceOf(alice);

        assertGt(wbtcAfter, wbtcBefore);
        assertGt(ethAfter, ethBefore);

        vm.stopPrank();
    }
}

contract LendingPoolTest is Test {
    LendingPool pool;
    MockWBTC wbtc;
    address alice = address(0x1);
    address bob = address(0x2);

    function setUp() public {
        pool = new LendingPool();
        wbtc = new MockWBTC();

        // Initialize token config for lending
        pool.initializeToken(
            address(wbtc),
            200,    // baseRate 2%
            1000,   // slope1 10%
            6000,   // slope2 60%
            8000,   // kink 80%
            1000,   // reserveFactor 10%
            true,   // lendingEnabled
            true,   // borrowEnabled
            9000,   // collateralFactor 90%
            9500,   // liquidationThreshold 95%
            18      // decimals (WBTC mock uses 18 for simplicity in tests)
        );
        pool.setAssetPrice(address(wbtc), 65000e8);

        // Mint tokens
        wbtc.mint(alice, 1000 ether);
        wbtc.mint(bob, 1000 ether);
    }

    // TEST 1: Deposit Success
    function test_deposit_success() public {
        vm.startPrank(alice);

        wbtc.approve(address(pool), 100 ether);
        pool.deposit(address(wbtc), 100 ether);

        uint256 balance = pool.balanceOf(address(wbtc), alice);
        assertEq(balance, 100 ether);

        vm.stopPrank();
    }

    // TEST 2: Deposit - Zero Amount (Should Revert)
    function test_deposit_zero_revert() public {
        vm.startPrank(alice);

        vm.expectRevert("amount > 0");
        pool.deposit(address(wbtc), 0);

        vm.stopPrank();
    }

    // TEST 3: Withdraw Success
    function test_withdraw_success() public {
        vm.startPrank(alice);

        wbtc.approve(address(pool), 100 ether);
        pool.deposit(address(wbtc), 100 ether);

        uint256 wbtcBefore = wbtc.balanceOf(alice);

        pool.withdraw(address(wbtc), 50 ether);

        uint256 wbtcAfter = wbtc.balanceOf(alice);
        assertEq(wbtcAfter - wbtcBefore, 50 ether);

        uint256 balance = pool.balanceOf(address(wbtc), alice);
        assertEq(balance, 50 ether);

        vm.stopPrank();
    }

    // TEST 4: Withdraw - Insufficient Balance
    function test_withdraw_insufficient_revert() public {
        vm.startPrank(alice);

        wbtc.approve(address(pool), 100 ether);
        pool.deposit(address(wbtc), 100 ether);

        vm.expectRevert("insufficient balance");
        pool.withdraw(address(wbtc), 200 ether);

        vm.stopPrank();
    }

    // TEST 5: Multiple Users Deposits
    function test_multiple_deposits() public {
        vm.startPrank(alice);
        wbtc.approve(address(pool), 100 ether);
        pool.deposit(address(wbtc), 100 ether);
        vm.stopPrank();

        vm.startPrank(bob);
        wbtc.approve(address(pool), 50 ether);
        pool.deposit(address(wbtc), 50 ether);
        vm.stopPrank();

        assertEq(pool.balanceOf(address(wbtc), alice), 100 ether);
        assertEq(pool.balanceOf(address(wbtc), bob), 50 ether);
        assertEq(pool.totalSupplied(address(wbtc)), 150 ether);
    }
}

contract ScheduledPayoutManagerTest is Test {
    ScheduledPayoutManager manager;
    LendingPool pool;
    MockWBTC wbtc;
    address alice = address(0x1);
    address bob = address(0x2);
    address relayer = address(0x3);

    function setUp() public {
        pool = new LendingPool();
        manager = new ScheduledPayoutManager(pool);
        wbtc = new MockWBTC();

        // Initialize token config for lending
        pool.initializeToken(
            address(wbtc),
            200,    // baseRate 2%
            1000,   // slope1 10%
            6000,   // slope2 60%
            8000,   // kink 80%
            1000,   // reserveFactor 10%
            true,   // lendingEnabled
            true,   // borrowEnabled
            9000,   // collateralFactor 90%
            9500,   // liquidationThreshold 95%
            18      // decimals
        );
        pool.setAssetPrice(address(wbtc), 65000e8);

        // Setup permissions
        pool.setScheduler(address(manager));

        // Mint and deposit
        wbtc.mint(alice, 1000 ether);

        vm.startPrank(alice);
        wbtc.approve(address(pool), 1000 ether);
        pool.deposit(address(wbtc), 1000 ether);
        vm.stopPrank();
    }

    // TEST 1: Schedule Payout
    function test_schedulePayout_success() public {
        vm.startPrank(alice);

        uint256 releaseTime = block.timestamp + 1 days;
        uint256 id = manager.schedulePayout(address(wbtc), bob, 100 ether, releaseTime, 1 ether);

        assertEq(id, 1);

        vm.stopPrank();
    }

    // TEST 2: Schedule Payout - Too Soon (Should Revert)
    function test_schedulePayout_tooSoon_revert() public {
        vm.startPrank(alice);

        uint256 releaseTime = block.timestamp + 10 seconds;

        vm.expectRevert("release too soon");
        manager.schedulePayout(address(wbtc), bob, 100 ether, releaseTime, 1 ether);

        vm.stopPrank();
    }

    // TEST 3: Execute Scheduled Payout - Success
    function test_executeScheduled_success() public {
        vm.startPrank(alice);

        uint256 releaseTime = block.timestamp + 1 days;
        uint256 id = manager.schedulePayout(address(wbtc), bob, 100 ether, releaseTime, 1 ether);

        vm.stopPrank();

        // Fast forward time
        vm.warp(releaseTime + 1);

        // Relayer executes
        vm.startPrank(relayer);

        uint256 bobBalanceBefore = wbtc.balanceOf(bob);
        manager.executeScheduled(id);
        uint256 bobBalanceAfter = wbtc.balanceOf(bob);

        // Bob should receive 100 - 1 (fee) = 99
        assertEq(bobBalanceAfter - bobBalanceBefore, 99 ether);

        // Relayer should receive 1 WBTC fee
        assertEq(wbtc.balanceOf(relayer), 1 ether);

        vm.stopPrank();
    }

    // TEST 4: Execute Scheduled Payout - Too Early (Should Revert)
    function test_executeScheduled_tooEarly_revert() public {
        vm.startPrank(alice);

        uint256 releaseTime = block.timestamp + 1 days;
        uint256 id = manager.schedulePayout(address(wbtc), bob, 100 ether, releaseTime, 1 ether);

        vm.stopPrank();

        // Try to execute immediately
        vm.startPrank(relayer);

        vm.expectRevert("too early");
        manager.executeScheduled(id);

        vm.stopPrank();
    }

    // TEST 5: Cancel Scheduled Payout
    function test_cancelScheduled_success() public {
        vm.startPrank(alice);

        uint256 releaseTime = block.timestamp + 1 days;
        uint256 id = manager.schedulePayout(address(wbtc), bob, 100 ether, releaseTime, 1 ether);

        // Cancel it
        manager.cancelScheduled(id);

        // Verify funds are returned to alice's wallet (100 WBTC transferred)
        // And balance in pool remains 900 (initial 1000 - 100 locked during schedule)
        uint256 balance = pool.balanceOf(address(wbtc), alice);
        assertEq(balance, 900 ether);

        vm.stopPrank();
    }

    // TEST 6: Cannot Execute Already Executed Payout
    function test_executeScheduled_alreadyExecuted_revert() public {
        vm.startPrank(alice);

        uint256 releaseTime = block.timestamp + 1 days;
        uint256 id = manager.schedulePayout(address(wbtc), bob, 100 ether, releaseTime, 1 ether);

        vm.stopPrank();

        vm.warp(releaseTime + 1);

        vm.startPrank(relayer);

        // Execute once
        manager.executeScheduled(id);

        // Try to execute again
        vm.expectRevert("already executed");
        manager.executeScheduled(id);

        vm.stopPrank();
    }

    // TEST 7: Cannot Execute Cancelled Payout
    function test_executeScheduled_cancelled_revert() public {
        vm.startPrank(alice);

        uint256 releaseTime = block.timestamp + 1 days;
        uint256 id = manager.schedulePayout(address(wbtc), bob, 100 ether, releaseTime, 1 ether);

        // Cancel
        manager.cancelScheduled(id);

        vm.stopPrank();

        vm.warp(releaseTime + 1);

        vm.startPrank(relayer);

        vm.expectRevert("cancelled");
        manager.executeScheduled(id);

        vm.stopPrank();
    }
}
