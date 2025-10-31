// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ScheduledPayoutManager.sol";

contract RelayerScript is Script {
    function run() external {
        vm.startBroadcast();

        ScheduledPayoutManager scheduler = ScheduledPayoutManager(0x7AA39B5Da2f46d47c6222C66A8AeDb33Af23462A);

        // Check all schedules and execute due ones
        uint256 currentId = scheduler.nextId();
        for (uint256 i = 1; i < currentId; i++) {
            try scheduler.executeScheduled(i) {
                console.log("Executed schedule", i);
            } catch {
                // Skip if not due or already executed
            }
        }

        vm.stopBroadcast();
    }
}