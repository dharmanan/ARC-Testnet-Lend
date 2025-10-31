// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GenericAMMPair is ReentrancyGuard, Ownable {
    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint256 public reserve0;
    uint256 public reserve1;

    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    // Emergency pause mechanism
    bool public paused = false;

    event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event AddLiquidity(address indexed user, uint256 amount0, uint256 amount1, uint256 liquidityMinted);
    event RemoveLiquidity(address indexed user, uint256 amount0, uint256 amount1, uint256 liquidityBurned);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor(address _token0, address _token1) Ownable(msg.sender) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    /// @notice Emergency pause - only owner can call
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Resume trading - only owner can call
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function addLiquidity(uint256 amount0, uint256 amount1) external nonReentrant whenNotPaused {
        require(amount0 > 0 && amount1 > 0, "Amounts must be positive");

        uint256 liquidityMinted;

        if (totalLiquidity == 0) {
            // First liquidity provision - check for balanced initial liquidity
            uint256 ratio = (amount0 * 100) / (amount0 + amount1);
            require(ratio > 10 && ratio < 90, "Imbalanced initial liquidity");
            
            liquidityMinted = sqrt(amount0 * amount1);
            require(liquidityMinted > MINIMUM_LIQUIDITY, "Insufficient initial liquidity");
            liquidityMinted -= MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY); // Burn minimum liquidity
        } else {
            // Subsequent liquidity provision
            uint256 liquidity0 = (amount0 * totalLiquidity) / reserve0;
            uint256 liquidity1 = (amount1 * totalLiquidity) / reserve1;
            liquidityMinted = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
        }

        require(token0.transferFrom(msg.sender, address(this), amount0), "Token0 transfer failed");
        require(token1.transferFrom(msg.sender, address(this), amount1), "Token1 transfer failed");

        reserve0 += amount0;
        reserve1 += amount1;
        totalLiquidity += liquidityMinted;
        liquidity[msg.sender] += liquidityMinted;

        emit AddLiquidity(msg.sender, amount0, amount1, liquidityMinted);
    }

    function removeLiquidity(uint256 liquidityAmount) external nonReentrant whenNotPaused {
        require(liquidityAmount > 0, "Liquidity amount must be positive");
        require(liquidity[msg.sender] >= liquidityAmount, "Insufficient liquidity");

        uint256 amount0 = (liquidityAmount * reserve0) / totalLiquidity;
        uint256 amount1 = (liquidityAmount * reserve1) / totalLiquidity;

        liquidity[msg.sender] -= liquidityAmount;
        totalLiquidity -= liquidityAmount;

        require(token0.transfer(msg.sender, amount0), "Token0 transfer failed");
        require(token1.transfer(msg.sender, amount1), "Token1 transfer failed");

        reserve0 -= amount0;
        reserve1 -= amount1;

        emit RemoveLiquidity(msg.sender, amount0, amount1, liquidityAmount);
    }

    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external nonReentrant whenNotPaused {
        require(amountIn > 0, "Amount in must be positive");
        require(tokenIn == address(token0) || tokenIn == address(token1), "Invalid token");

        address tokenOut;
        uint256 reserveIn;
        uint256 reserveOut;

        if (tokenIn == address(token0)) {
            tokenOut = address(token1);
            reserveIn = reserve0;
            reserveOut = reserve1;
        } else {
            tokenOut = address(token0);
            reserveIn = reserve1;
            reserveOut = reserve0;
        }

        uint256 amountInWithFee = (amountIn * 997) / 1000;
        uint256 amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);

        require(amountOut >= minAmountOut, "Slippage exceeded");
        require(amountOut > 0, "Output must be positive");

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        if (tokenIn == address(token0)) {
            reserve0 += amountIn;
            reserve1 -= amountOut;
            token1.transfer(msg.sender, amountOut);
        } else {
            reserve1 += amountIn;
            reserve0 -= amountOut;
            token0.transfer(msg.sender, amountOut);
        }

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256) {
        require(amountIn > 0, "Amount in must be positive");
        require(tokenIn == address(token0) || tokenIn == address(token1), "Invalid token");

        uint256 reserveIn;
        uint256 reserveOut;

        if (tokenIn == address(token0)) {
            reserveIn = reserve0;
            reserveOut = reserve1;
        } else {
            reserveIn = reserve1;
            reserveOut = reserve0;
        }

        uint256 amountInWithFee = (amountIn * 997) / 1000;
        return (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
    }

    function _mint(address to, uint256 amount) internal {
        if (to == address(0)) {
            // Burn case - just track in totalLiquidity
            return;
        }
        liquidity[to] += amount;
    }

    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
