// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockARC is ERC20, Ownable {
    constructor() ERC20("Mock Arc Token", "ARC") Ownable(msg.sender) {
        _mint(msg.sender, 10000000 * 10**18); // Mint 10M ARC to deployer
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}