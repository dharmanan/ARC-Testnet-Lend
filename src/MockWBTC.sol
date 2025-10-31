// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockWBTC is ERC20, Ownable {
    constructor() ERC20("Mock Wrapped BTC", "WBTC") Ownable(msg.sender) {
        _mint(msg.sender, 1000 * 10**8); // Mint 1000 WBTC (8 decimals) to deployer
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}