// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract USDCEURCPair is ReentrancyGuard {
    IERC20 public immutable usdc;
    IERC20 public immutable eurc;

    uint256 public reserveUSDC;
    uint256 public reserveEURC;

    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event AddLiquidity(address indexed user, uint256 amountUSDC, uint256 amountEURC, uint256 liquidityMinted);
    event RemoveLiquidity(address indexed user, uint256 amountUSDC, uint256 amountEURC, uint256 liquidityBurned);

    constructor(address _usdc, address _eurc) {
        usdc = IERC20(_usdc);
        eurc = IERC20(_eurc);
    }

    function addLiquidity(uint256 amountUSDC, uint256 amountEURC) external nonReentrant {
        require(amountUSDC > 0 && amountEURC > 0, "Amounts must be positive");

        uint256 liquidityMinted;

        if (totalLiquidity == 0) {
            // First liquidity provision
            liquidityMinted = sqrt(amountUSDC * amountEURC);
            require(liquidityMinted > MINIMUM_LIQUIDITY, "Insufficient initial liquidity");
            liquidityMinted -= MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY); // Burn minimum liquidity
        } else {
            // Subsequent liquidity provision
            uint256 usdcLiquidity = (amountUSDC * totalLiquidity) / reserveUSDC;
            uint256 eurcLiquidity = (amountEURC * totalLiquidity) / reserveEURC;
            liquidityMinted = usdcLiquidity < eurcLiquidity ? usdcLiquidity : eurcLiquidity;
        }

        require(usdc.transferFrom(msg.sender, address(this), amountUSDC), "USDC transfer failed");
        require(eurc.transferFrom(msg.sender, address(this), amountEURC), "EURC transfer failed");

        reserveUSDC += amountUSDC;
        reserveEURC += amountEURC;
        totalLiquidity += liquidityMinted;
        liquidity[msg.sender] += liquidityMinted;

        emit AddLiquidity(msg.sender, amountUSDC, amountEURC, liquidityMinted);
    }

    function removeLiquidity(uint256 liquidityAmount) external nonReentrant {
        require(liquidityAmount > 0, "Liquidity amount must be positive");
        require(liquidity[msg.sender] >= liquidityAmount, "Insufficient liquidity");

        uint256 usdcAmount = (liquidityAmount * reserveUSDC) / totalLiquidity;
        uint256 eurcAmount = (liquidityAmount * reserveEURC) / totalLiquidity;

        liquidity[msg.sender] -= liquidityAmount;
        totalLiquidity -= liquidityAmount;

        require(usdc.transfer(msg.sender, usdcAmount), "USDC transfer failed");
        require(eurc.transfer(msg.sender, eurcAmount), "EURC transfer failed");

        reserveUSDC -= usdcAmount;
        reserveEURC -= eurcAmount;

        emit RemoveLiquidity(msg.sender, usdcAmount, eurcAmount, liquidityAmount);
    }

    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external nonReentrant {
        require(amountIn > 0, "Amount must be positive");
        require(tokenIn == address(usdc) || tokenIn == address(eurc), "Invalid token");

        bool isUSDC = tokenIn == address(usdc);
        (uint256 reserveIn, uint256 reserveOut) = isUSDC ?
            (reserveUSDC, reserveEURC) :
            (reserveEURC, reserveUSDC);

        // Calculate output amount with 0.3% fee (same as Uniswap)
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        uint256 amountOut = numerator / denominator;

        require(amountOut >= minAmountOut, "Insufficient output amount");
        require(amountOut <= reserveOut, "Insufficient liquidity");

        // Update reserves
        if (isUSDC) {
            reserveUSDC += amountIn;
            reserveEURC -= amountOut;
            require(usdc.transferFrom(msg.sender, address(this), amountIn), "USDC transfer failed");
            require(eurc.transfer(msg.sender, amountOut), "EURC transfer failed");
        } else {
            reserveEURC += amountIn;
            reserveUSDC -= amountOut;
            require(eurc.transferFrom(msg.sender, address(this), amountIn), "EURC transfer failed");
            require(usdc.transfer(msg.sender, amountOut), "USDC transfer failed");
        }

        emit Swap(msg.sender, tokenIn, isUSDC ? address(eurc) : address(usdc), amountIn, amountOut);
    }

    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256) {
        require(tokenIn == address(usdc) || tokenIn == address(eurc), "Invalid token");

        bool isUSDC = tokenIn == address(usdc);
        (uint256 reserveIn, uint256 reserveOut) = isUSDC ?
            (reserveUSDC, reserveEURC) :
            (reserveEURC, reserveUSDC);

        if (reserveIn == 0 || reserveOut == 0) return 0;

        // Calculate output amount with 0.3% fee
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        return numerator / denominator;
    }

    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    function _mint(address to, uint256 amount) internal {
        liquidity[to] += amount;
        totalLiquidity += amount;
    }
}