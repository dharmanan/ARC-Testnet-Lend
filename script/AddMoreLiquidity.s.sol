// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/GenericAMMPair.sol";
import "../src/MockETH.sol";
import "../src/MockWBTC.sol";
import "../src/MockARC.sol";

contract AddMoreLiquidity is Script {
    address constant ETH_ADDR = 0x6dC1d97820974558e1bD555C04a5A19608F9512d;
    address constant WBTC_ADDR = 0x27488Db1F8F9529B5820De984262179Ad913798E;
    address constant ARC_ADDR = 0x56EFFB3b22DBBE576E4327D196aa5ed51476924e;

    address constant ETH_WBTC_PAIR = 0xF4638B258905C6a2F7Aa71E05aAC887dB697c338;
    address constant ETH_ARC_PAIR = 0x677df5298Fd0a80672b1E6B4a61BEB75534a83A1;
    address constant WBTC_ARC_PAIR = 0x27e14cfEF1a029A32F574263dce67371bce32d24;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        MockETH eth = MockETH(ETH_ADDR);
        MockWBTC wbtc = MockWBTC(WBTC_ADDR);
        MockARC arc = MockARC(ARC_ADDR);

        // Add 100 ETH + 1 WBTC to ETH/WBTC
        eth.approve(ETH_WBTC_PAIR, 100e18);
        wbtc.approve(ETH_WBTC_PAIR, 1e8);
        GenericAMMPair(ETH_WBTC_PAIR).addLiquidity(100e18, 1e8);
        console.log("Added 100 ETH + 1 WBTC to ETH/WBTC");

        // Add 100 ETH + 5000 ARC to ETH/ARC
        eth.approve(ETH_ARC_PAIR, 100e18);
        arc.approve(ETH_ARC_PAIR, 5000e18);
        GenericAMMPair(ETH_ARC_PAIR).addLiquidity(100e18, 5000e18);
        console.log("Added 100 ETH + 5000 ARC to ETH/ARC");

        // Add 1 WBTC + 5000 ARC to WBTC/ARC
        wbtc.approve(WBTC_ARC_PAIR, 1e8);
        arc.approve(WBTC_ARC_PAIR, 5000e18);
        GenericAMMPair(WBTC_ARC_PAIR).addLiquidity(1e8, 5000e18);
        console.log("Added 1 WBTC + 5000 ARC to WBTC/ARC");

        vm.stopBroadcast();

        // Print current reserves
        console.log("\n=== FINAL RESERVES ===");
        (uint256 r0_eth, uint256 r1_eth) = _getPairReserves(ETH_WBTC_PAIR);
        console.log("ETH/WBTC - ETH:", r0_eth / 1e18, "WBTC:", r1_eth / 1e8);

        (uint256 r0_arc, uint256 r1_arc) = _getPairReserves(ETH_ARC_PAIR);
        console.log("ETH/ARC - ETH:", r0_arc / 1e18, "ARC:", r1_arc / 1e18);

        (uint256 r0_wbtc, uint256 r1_wbtc) = _getPairReserves(WBTC_ARC_PAIR);
        console.log("WBTC/ARC - WBTC:", r0_wbtc / 1e8, "ARC:", r1_wbtc / 1e18);
    }

    function _getPairReserves(address pair) internal view returns (uint256, uint256) {
        try GenericAMMPair(pair).reserve0() returns (uint256 r0) {
            uint256 r1 = GenericAMMPair(pair).reserve1();
            return (r0, r1);
        } catch {
            return (0, 0);
        }
    }
}
