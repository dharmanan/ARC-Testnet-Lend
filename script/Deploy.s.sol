// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "../src/StableToken.sol";
import "../src/LendingPool.sol";
import "../src/ScheduledPayoutManager.sol";
import "../src/MockETH.sol";
import "../src/MockWBTC.sol";
import "../src/MockARC.sol";
import "../src/USDCEURCPair.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        // Deploy StableToken
        StableToken stable = new StableToken("Test USD", "tUSD");
        console.log("StableToken deployed:", address(stable));

        // Deploy Mock Tokens
        MockETH eth = new MockETH();
        console.log("MockETH deployed:", address(eth));

        MockWBTC wbtc = new MockWBTC();
        console.log("MockWBTC deployed:", address(wbtc));

        MockARC arc = new MockARC();
        console.log("MockARC deployed:", address(arc));

        // Deploy USDC and EURC for AMM
        StableToken usdc = new StableToken("USD Coin", "USDC");
        console.log("USDC deployed:", address(usdc));

        StableToken eurc = new StableToken("EUR Coin", "EURC");
        console.log("EURC deployed:", address(eurc));

        // Deploy USDC/EURC AMM Pair
        USDCEURCPair ammPair = new USDCEURCPair(address(usdc), address(eurc));
        console.log("USDCEURCPair deployed:", address(ammPair));

        // Deploy LendingPool
        LendingPool pool = new LendingPool();
        console.log("LendingPool deployed:", address(pool));

        // Deploy ScheduledPayoutManager
        ScheduledPayoutManager scheduler = new ScheduledPayoutManager(pool);
        console.log("ScheduledPayoutManager deployed:", address(scheduler));

        // Configure pool
        pool.transferOwnership(msg.sender); // optional: make deployer owner
        pool.setScheduler(address(scheduler));
        
        // Initialize token configurations
        // USDC: Real lending token - 6 decimals
        // BaseRate: 2%, Slope1: 10%, Slope2: 60%, Kink: 80%, ReserveFactor: 10%
        pool.initializeToken(
            address(usdc),
            200,    // baseRate (2%)
            1000,   // slope1 (10%)
            6000,   // slope2 (60%)
            8000,   // kink (80%)
            1000,   // reserveFactor (10%)
            true,   // lendingEnabled
            true,   // borrowEnabled
            9000,   // collateralFactor (90%)
            9500,   // liquidationThreshold (95%)
            6       // decimals
        );
        console.log("USDC initialized in LendingPool");
        pool.setAssetPrice(address(usdc), 1e8);
        
        // EURC: Real lending token - 6 decimals
        pool.initializeToken(
            address(eurc),
            200,    // baseRate (2%)
            1000,   // slope1 (10%)
            6000,   // slope2 (60%)
            8000,   // kink (80%)
            1000,   // reserveFactor (10%)
            true,   // lendingEnabled
            true,   // borrowEnabled
            9000,   // collateralFactor (90%)
            9500,   // liquidationThreshold (95%)
            6       // decimals
        );
        console.log("EURC initialized in LendingPool");
        pool.setAssetPrice(address(eurc), 108000000);
        
        // ETH: Collateral-only token - 18 decimals
        // Not enabled for lending/borrow, only as collateral
        pool.initializeToken(
            address(eth),
            0,      // baseRate (0% - not used for lending)
            0,      // slope1 (0%)
            0,      // slope2 (0%)
            8000,   // kink (80%)
            0,      // reserveFactor (0%)
            false,  // lendingEnabled - DISABLED
            false,  // borrowEnabled - DISABLED
            7500,   // collateralFactor (75%)
            8000,   // liquidationThreshold (80%)
            18      // decimals
        );
        console.log("ETH initialized as collateral-only");
        pool.setAssetPrice(address(eth), 3500e8);
        
        // WBTC: Collateral-only token - 8 decimals
        pool.initializeToken(
            address(wbtc),
            0,      // baseRate (0%)
            0,      // slope1 (0%)
            0,      // slope2 (0%)
            8000,   // kink (80%)
            0,      // reserveFactor (0%)
            false,  // lendingEnabled - DISABLED
            false,  // borrowEnabled - DISABLED
            7000,   // collateralFactor (70%)
            7500,   // liquidationThreshold (75%)
            8       // decimals
        );
        console.log("WBTC initialized as collateral-only");
        pool.setAssetPrice(address(wbtc), 65000e8);
        
        // ARC: Collateral-only token - 18 decimals
        pool.initializeToken(
            address(arc),
            0,      // baseRate (0%)
            0,      // slope1 (0%)
            0,      // slope2 (0%)
            8000,   // kink (80%)
            0,      // reserveFactor (0%)
            false,  // lendingEnabled - DISABLED
            false,  // borrowEnabled - DISABLED
            6000,   // collateralFactor (60%)
            7000,   // liquidationThreshold (70%)
            18      // decimals
        );
        console.log("ARC initialized as collateral-only");
        pool.setAssetPrice(address(arc), 250000000);
        
        // Mint some tokens to deployer for testing
        stable.transferOwnership(msg.sender);
        stable.mint(msg.sender, 10000 ether);
        
        // Mint mock tokens to deployer for testing
        eth.mint(msg.sender, 1000 * 10**18); // 1000 ETH
        wbtc.mint(msg.sender, 100 * 10**8);   // 100 WBTC
        arc.mint(msg.sender, 10000 * 10**18); // 10000 ARC
        
        // Mint USDC and EURC to deployer for testing
        usdc.mint(msg.sender, 1000000 * 10**6); // 1M USDC
        eurc.mint(msg.sender, 1000000 * 10**6); // 1M EURC

        vm.stopBroadcast();
    }
}