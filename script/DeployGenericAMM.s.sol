// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/GenericAMMPair.sol";
import "../src/MockETH.sol";
import "../src/MockWBTC.sol";
import "../src/MockARC.sol";

contract DeployGenericAMM is Script {
    address constant ETH_ADDR = 0x6dC1d97820974558e1bD555C04a5A19608F9512d;
    address constant WBTC_ADDR = 0x27488Db1F8F9529B5820De984262179Ad913798E;
    address constant ARC_ADDR = 0x56EFFB3b22DBBE576E4327D196aa5ed51476924e;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy ETH/WBTC pair
        GenericAMMPair ethWbtcPair = new GenericAMMPair(ETH_ADDR, WBTC_ADDR);
        console.log("ETH/WBTC Pair:", address(ethWbtcPair));

        // Deploy ETH/ARC pair
        GenericAMMPair ethArcPair = new GenericAMMPair(ETH_ADDR, ARC_ADDR);
        console.log("ETH/ARC Pair:", address(ethArcPair));

        // Deploy WBTC/ARC pair
        GenericAMMPair wbtcArcPair = new GenericAMMPair(WBTC_ADDR, ARC_ADDR);
        console.log("WBTC/ARC Pair:", address(wbtcArcPair));

        // Add tiny test liquidity to ETH/WBTC
        MockETH eth = MockETH(ETH_ADDR);
        MockWBTC wbtc = MockWBTC(WBTC_ADDR);
        
        eth.approve(address(ethWbtcPair), 1e18); // 1 ETH
        wbtc.approve(address(ethWbtcPair), 1e8); // 1 WBTC
        ethWbtcPair.addLiquidity(1e18, 1e8);
        console.log("ETH/WBTC liquidity added");

        // Add tiny test liquidity to ETH/ARC
        MockARC arc = MockARC(ARC_ADDR);
        eth.approve(address(ethArcPair), 1e18); // 1 ETH
        arc.approve(address(ethArcPair), 1e18); // 1 ARC
        ethArcPair.addLiquidity(1e18, 1e18);
        console.log("ETH/ARC liquidity added");

        // Add tiny test liquidity to WBTC/ARC
        wbtc.approve(address(wbtcArcPair), 1e8); // 1 WBTC
        arc.approve(address(wbtcArcPair), 1e18); // 1 ARC
        wbtcArcPair.addLiquidity(1e8, 1e18);
        console.log("WBTC/ARC liquidity added");

        vm.stopBroadcast();
    }
}
