// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/GenericAMMPair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AddMoreLiquidityV2 is Script {
    address constant ETH_ADDR = 0x6dC1d97820974558e1bD555C04a5A19608F9512d;
    address constant WBTC_ADDR = 0x27488Db1F8F9529B5820De984262179Ad913798E;
    address constant ARC_ADDR = 0x56EFFB3b22DBBE576E4327D196aa5ed51476924e;

    address constant ETH_WBTC_PAIR = 0xF4638B258905C6a2F7Aa71E05aAC887dB697c338;
    address constant ETH_ARC_PAIR = 0x677df5298Fd0a80672b1E6B4a61BEB75534a83A1;
    address constant WBTC_ARC_PAIR = 0x27e14cfEF1a029A32F574263dce67371bce32d24;

    function run() external {
        // This script uses msg.sender (the signer's address)
        
        IERC20 eth = IERC20(ETH_ADDR);
        IERC20 wbtc = IERC20(WBTC_ADDR);
        IERC20 arc = IERC20(ARC_ADDR);

        console.log("Adding liquidity from address:", msg.sender);
        console.log("ETH balance:", eth.balanceOf(msg.sender) / 1e18);
        console.log("WBTC balance:", wbtc.balanceOf(msg.sender) / 1e8);
        console.log("ARC balance:", arc.balanceOf(msg.sender) / 1e18);

        // ETH/WBTC: Add 100 ETH + 10 WBTC
        // Current: 103 ETH + 2 WBTC → New: 203 ETH + 12 WBTC
        eth.approve(ETH_WBTC_PAIR, 100e18);
        wbtc.approve(ETH_WBTC_PAIR, 10e8);
        GenericAMMPair(ETH_WBTC_PAIR).addLiquidity(100e18, 10e8);
        console.log("Added 100 ETH + 10 WBTC to ETH/WBTC");

        // ETH/ARC: Add 100 ETH + 1000 ARC
        // Current: 102 ETH + 6000 ARC → New: 202 ETH + 7000 ARC
        eth.approve(ETH_ARC_PAIR, 100e18);
        arc.approve(ETH_ARC_PAIR, 1000e18);
        GenericAMMPair(ETH_ARC_PAIR).addLiquidity(100e18, 1000e18);
        console.log("Added 100 ETH + 1000 ARC to ETH/ARC");

        // WBTC/ARC: Add 10 WBTC + 1000 ARC
        // Current: 2 WBTC + 5000 ARC → New: 12 WBTC + 6000 ARC
        wbtc.approve(WBTC_ARC_PAIR, 10e8);
        arc.approve(WBTC_ARC_PAIR, 1000e18);
        GenericAMMPair(WBTC_ARC_PAIR).addLiquidity(10e8, 1000e18);
        console.log("Added 10 WBTC + 1000 ARC to WBTC/ARC");

        console.log("\n=== FINAL RESERVES ===");
        console.log("ETH/WBTC - Reserve0 (ETH):", GenericAMMPair(ETH_WBTC_PAIR).reserve0() / 1e18);
        console.log("ETH/WBTC - Reserve1 (WBTC):", GenericAMMPair(ETH_WBTC_PAIR).reserve1() / 1e8);
        console.log("ETH/ARC - Reserve0 (ETH):", GenericAMMPair(ETH_ARC_PAIR).reserve0() / 1e18);
        console.log("ETH/ARC - Reserve1 (ARC):", GenericAMMPair(ETH_ARC_PAIR).reserve1() / 1e18);
        console.log("WBTC/ARC - Reserve0 (WBTC):", GenericAMMPair(WBTC_ARC_PAIR).reserve0() / 1e8);
        console.log("WBTC/ARC - Reserve1 (ARC):", GenericAMMPair(WBTC_ARC_PAIR).reserve1() / 1e18);
    }
}
