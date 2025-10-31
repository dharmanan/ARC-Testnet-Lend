// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "../src/GenericAMMPair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AddLiquidity is Script {
    // Token addresses
    address constant ETH_ADDR = 0x6dC1d97820974558e1bD555C04a5A19608F9512d;
    address constant WBTC_ADDR = 0x27488Db1F8F9529B5820De984262179Ad913798E;
    address constant ARC_ADDR = 0x56EFFB3b22DBBE576E4327D196aa5ed51476924e;

    // Pair addresses
    address constant ETH_WBTC_PAIR = 0xF4638B258905C6a2F7Aa71E05aAC887dB697c338;
    address constant ETH_ARC_PAIR = 0x677df5298Fd0a80672b1E6B4a61BEB75534a83A1;
    address constant WBTC_ARC_PAIR = 0x27e14cfEF1a029A32F574263dce67371bce32d24;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Approve all tokens for pairs
        IERC20(ETH_ADDR).approve(ETH_WBTC_PAIR, type(uint256).max);
        IERC20(WBTC_ADDR).approve(ETH_WBTC_PAIR, type(uint256).max);
        console.log("Approved ETH and WBTC for ETH/WBTC pair");

        IERC20(ETH_ADDR).approve(ETH_ARC_PAIR, type(uint256).max);
        IERC20(ARC_ADDR).approve(ETH_ARC_PAIR, type(uint256).max);
        console.log("Approved ETH and ARC for ETH/ARC pair");

        IERC20(WBTC_ADDR).approve(WBTC_ARC_PAIR, type(uint256).max);
        IERC20(ARC_ADDR).approve(WBTC_ARC_PAIR, type(uint256).max);
        console.log("Approved WBTC and ARC for WBTC/ARC pair");

        // Add liquidity to ETH/WBTC pair (50 ETH, 2.5 WBTC)
        GenericAMMPair ethWbtcPair = GenericAMMPair(ETH_WBTC_PAIR);
        ethWbtcPair.addLiquidity(50e18, 25e7); // 50 ETH (18 decimals), 2.5 WBTC (8 decimals)
        console.log("Added liquidity to ETH/WBTC pair: 50 ETH + 2.5 WBTC");

        // Add liquidity to ETH/ARC pair (50 ETH, 1500 ARC)
        GenericAMMPair ethArcPair = GenericAMMPair(ETH_ARC_PAIR);
        ethArcPair.addLiquidity(50e18, 1500e18); // 50 ETH, 1500 ARC
        console.log("Added liquidity to ETH/ARC pair: 50 ETH + 1500 ARC");

        // Add liquidity to WBTC/ARC pair (2.5 WBTC, 1500 ARC)
        GenericAMMPair wbtcArcPair = GenericAMMPair(WBTC_ARC_PAIR);
        wbtcArcPair.addLiquidity(25e7, 1500e18); // 2.5 WBTC, 1500 ARC
        console.log("Added liquidity to WBTC/ARC pair: 2.5 WBTC + 1500 ARC");

        vm.stopBroadcast();

        console.log("\n=== Liquidity Added Successfully ===");
        console.log("ETH/WBTC Pair:", ETH_WBTC_PAIR);
        console.log("ETH/ARC Pair:", ETH_ARC_PAIR);
        console.log("WBTC/ARC Pair:", WBTC_ARC_PAIR);
    }
}
