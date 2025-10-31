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
        // Transfer ownership back if needed; keep deployer as owner for tests
        // Mint some tokens to deployer for testing
        stable.transferOwnership(msg.sender);
        stable.mint(msg.sender, 10000 ether);

        vm.stopBroadcast();
    }
}