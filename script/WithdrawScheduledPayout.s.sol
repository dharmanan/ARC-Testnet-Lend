// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract WithdrawScheduledPayout is Script {
    address constant USDC = 0x3600000000000000000000000000000000000000;
    address constant EURC = 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a;
    address constant SPM = 0x410B9026DcCB5309C1DcD541C6c7C7a051AE5Ac9;
    address constant OWNER = 0x99677aab4b168c274A34525D526346fC47Fab72c;

    function run() public {
        vm.startBroadcast();

        // Check balances
        uint256 usdcBal = IERC20(USDC).balanceOf(SPM);
        uint256 eurcBal = IERC20(EURC).balanceOf(SPM);
        
        console.log("USDC in SPM:", usdcBal);
        console.log("EURC in SPM:", eurcBal);

        vm.stopBroadcast();
    }
}
