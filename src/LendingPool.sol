// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LendingPool is Ownable, ReentrancyGuard {
    address public scheduler;
    uint256 internal constant PRICE_SCALE = 1e8;

    struct TokenConfig {
        uint256 baseRate;
        uint256 slope1;
        uint256 slope2;
        uint256 kink;
        uint256 reserveFactor;
        bool lendingEnabled;
        bool borrowEnabled;
        uint256 collateralFactor;
        uint256 liquidationThreshold;
        uint256 decimals;
    }

    mapping(address => TokenConfig) public tokenConfigs;
    mapping(address => uint256) public supplyIndex;
    mapping(address => uint256) public borrowIndex;
    mapping(address => uint256) public lastAccrueTime;

    mapping(address => mapping(address => uint256)) public scaledBalances;
    mapping(address => mapping(address => uint256)) public lockedScaledBalances;
    mapping(address => uint256) public totalSupplied;
    mapping(address => uint256) public totalBorrowed;
    mapping(address => mapping(address => uint256)) public scaledBorrowBalances;

    mapping(address => uint256) public reserves;
    mapping(address => uint256) public assetPrices;

    event Deposited(address indexed token, address indexed user, uint256 amount);
    event CollateralDeposited(address indexed token, address indexed user, uint256 amount);
    event Withdrawn(address indexed token, address indexed user, uint256 amount);
    event Borrowed(address indexed token, address indexed user, uint256 amount);
    event Repaid(address indexed token, address indexed user, uint256 amount);
    event InterestAccrued(address indexed token, uint256 supplyIndex, uint256 borrowIndex);
    event TokenConfigUpdated(address indexed token);
    event AssetPriceUpdated(address indexed token, uint256 price);

    constructor() Ownable(msg.sender) {}

    function initializeToken(
        address token,
        uint256 _baseRate,
        uint256 _slope1,
        uint256 _slope2,
        uint256 _kink,
        uint256 _reserveFactor,
        bool _lendingEnabled,
        bool _borrowEnabled,
        uint256 _collateralFactor,
        uint256 _liquidationThreshold,
        uint256 _decimals
    ) external onlyOwner {
        require(tokenConfigs[token].decimals == 0, "already initialized");

        tokenConfigs[token] = TokenConfig({
            baseRate: _baseRate,
            slope1: _slope1,
            slope2: _slope2,
            kink: _kink,
            reserveFactor: _reserveFactor,
            lendingEnabled: _lendingEnabled,
            borrowEnabled: _borrowEnabled,
            collateralFactor: _collateralFactor,
            liquidationThreshold: _liquidationThreshold,
            decimals: _decimals
        });

        supplyIndex[token] = 1e18;
        borrowIndex[token] = 1e18;
        lastAccrueTime[token] = block.timestamp;

        emit TokenConfigUpdated(token);
    }

    function updateTokenConfig(
        address token,
        uint256 _baseRate,
        uint256 _slope1,
        uint256 _slope2,
        uint256 _kink,
        uint256 _reserveFactor,
        bool _lendingEnabled,
        bool _borrowEnabled,
        uint256 _collateralFactor,
        uint256 _liquidationThreshold
    ) external onlyOwner {
        require(tokenConfigs[token].decimals > 0, "not initialized");
        TokenConfig storage config = tokenConfigs[token];
        config.baseRate = _baseRate;
        config.slope1 = _slope1;
        config.slope2 = _slope2;
        config.kink = _kink;
        config.reserveFactor = _reserveFactor;
        config.lendingEnabled = _lendingEnabled;
        config.borrowEnabled = _borrowEnabled;
        config.collateralFactor = _collateralFactor;
        config.liquidationThreshold = _liquidationThreshold;
        emit TokenConfigUpdated(token);
    }

    function setAssetPrice(address token, uint256 price) external onlyOwner {
        require(tokenConfigs[token].decimals > 0, "token not initialized");
        require(price > 0, "price = 0");
        assetPrices[token] = price;
        emit AssetPriceUpdated(token, price);
    }

    function accrueInterest(address token) public {
        TokenConfig storage config = tokenConfigs[token];
        require(config.decimals > 0, "token not initialized");

        uint256 lastTime = lastAccrueTime[token];
        if (lastTime == block.timestamp) return;

        uint256 timeElapsed = block.timestamp - lastTime;
        if (timeElapsed == 0) return;

        uint256 totalSuppliedAmount = totalSupplied[token];
        uint256 totalBorrowedAmount = totalBorrowed[token];

        if (totalSuppliedAmount == 0 || totalBorrowedAmount == 0) {
            lastAccrueTime[token] = block.timestamp;
            return;
        }

        // Calculate interest in a separate function to avoid stack too deep
        (uint256 supplyAmount, uint256 interestAccrued, uint256 reserveAmount) = _calculateInterest(token, timeElapsed, totalSuppliedAmount, totalBorrowedAmount);

        if (interestAccrued == 0) {
            lastAccrueTime[token] = block.timestamp;
            return;
        }

        // Update indices and reserves
        uint256 newSupplyIndex = supplyIndex[token] + (supplyIndex[token] * supplyAmount) / totalSuppliedAmount;
        uint256 newBorrowIndex = borrowIndex[token] + (borrowIndex[token] * interestAccrued) / totalBorrowedAmount;
        uint256 newTotalBorrowed = totalBorrowedAmount + interestAccrued;

        supplyIndex[token] = newSupplyIndex;
        borrowIndex[token] = newBorrowIndex;
        totalBorrowed[token] = newTotalBorrowed;
        reserves[token] += reserveAmount;
        lastAccrueTime[token] = block.timestamp;

        emit InterestAccrued(token, newSupplyIndex, newBorrowIndex);
    }

    function _calculateInterest(address token, uint256 timeElapsed, uint256 totalSuppliedAmount, uint256 totalBorrowedAmount) 
        internal view returns (uint256 supplyAmount, uint256 interestAccrued, uint256 reserveAmount) 
    {
        TokenConfig storage config = tokenConfigs[token];
        
        // Calculate utilization
        uint256 utilization = (totalBorrowedAmount * 1e18) / totalSuppliedAmount;

        // Calculate borrow rate
        uint256 borrowRate = config.baseRate;
        if (utilization > config.kink) {
            borrowRate += config.slope1 + ((utilization - config.kink) * config.slope2) / 1e18;
        } else {
            borrowRate += (utilization * config.slope1) / 1e18;
        }

        // Calculate interest
        uint256 interestFactor = (borrowRate * timeElapsed) / (365 days);
        interestAccrued = (totalBorrowedAmount * interestFactor) / 1e4;

        if (interestAccrued == 0) {
            return (0, 0, 0);
        }

        // Split between reserves and suppliers
        reserveAmount = (interestAccrued * config.reserveFactor) / 1e4;
        supplyAmount = interestAccrued - reserveAmount;
    }

    function getSupplyAPY(address token) external view returns (uint256) {
        TokenConfig memory config = tokenConfigs[token];
        if (config.decimals == 0) return 0;

        uint256 totalSuppliedAmount = totalSupplied[token];
        uint256 totalBorrowedAmount = totalBorrowed[token];

        if (!config.lendingEnabled || totalSuppliedAmount == 0 || totalBorrowedAmount == 0) return 0;

        uint256 utilization = (totalBorrowedAmount * 1e18) / totalSuppliedAmount;

        uint256 borrowRate;
        if (utilization > config.kink) {
            borrowRate = config.baseRate + config.slope1 +
                ((utilization - config.kink) * config.slope2) / 1e18;
        } else {
            borrowRate = config.baseRate + ((utilization * config.slope1) / 1e18);
        }

        uint256 supplyRate = (borrowRate * utilization * (1e4 - config.reserveFactor)) / (1e4 * 1e18);
        return supplyRate;
    }

    function getBorrowAPR(address token) external view returns (uint256) {
        TokenConfig memory config = tokenConfigs[token];
        if (config.decimals == 0) return 0;

        uint256 totalSuppliedAmount = totalSupplied[token];
        uint256 totalBorrowedAmount = totalBorrowed[token];

        if (!config.borrowEnabled) return 0;
        if (totalSuppliedAmount == 0) return config.baseRate;

        uint256 utilization = (totalBorrowedAmount * 1e18) / totalSuppliedAmount;

        if (utilization > config.kink) {
            return config.baseRate + config.slope1 +
                ((utilization - config.kink) * config.slope2) / 1e18;
        } else {
            return config.baseRate + ((utilization * config.slope1) / 1e18);
        }
    }

    function getSupplyBalance(address token, address user) external view returns (uint256) {
        uint256 scaled = scaledBalances[token][user];
        if (scaled == 0) return 0;
        return (scaled * supplyIndex[token]) / 1e18;
    }

    function getBorrowBalance(address token, address user) external view returns (uint256) {
        uint256 scaledBorrow = scaledBorrowBalances[token][user];
        if (scaledBorrow == 0) return 0;
        return (scaledBorrow * borrowIndex[token]) / 1e18;
    }

    function getAccountLiquidity(address user) public view returns (uint256 collateralValue, uint256 borrowValue) {
        address[5] memory supportedTokens = [
            address(0x3600000000000000000000000000000000000000),
            address(0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a),
            address(0x6dC1d97820974558e1bD555C04a5A19608F9512d),
            address(0x27488Db1F8F9529B5820De984262179Ad913798E),
            address(0x56EFFB3b22DBBE576E4327D196aa5ed51476924e)
        ];

        for (uint256 i = 0; i < supportedTokens.length; i++) {
            address token = supportedTokens[i];
            TokenConfig memory config = tokenConfigs[token];
            if (config.decimals == 0) continue;

            uint256 price = assetPrices[token];
            if (price == 0) continue;

            uint256 supplyBal = (scaledBalances[token][user] * supplyIndex[token]) / 1e18;
            if (supplyBal > 0 && config.collateralFactor > 0) {
                uint256 normalizedSupply = _normalizeTo1e18(supplyBal, config.decimals);
                collateralValue += (normalizedSupply * price * config.collateralFactor) / (PRICE_SCALE * 1e4);
            }

            uint256 borrowBal = (scaledBorrowBalances[token][user] * borrowIndex[token]) / 1e18;
            if (borrowBal > 0) {
                uint256 normalizedBorrow = _normalizeTo1e18(borrowBal, config.decimals);
                borrowValue += (normalizedBorrow * price) / PRICE_SCALE;
            }
        }
    }

    function getMaxBorrowable(address user) external view returns (uint256) {
        (uint256 collateralValue, uint256 borrowValue) = getAccountLiquidity(user);
        if (collateralValue <= borrowValue) return 0;
        return collateralValue - borrowValue;
    }

    function _normalizeTo1e18(uint256 amount, uint256 decimals) internal pure returns (uint256) {
        if (decimals == 18) return amount;
        if (decimals < 18) return amount * (10 ** (18 - decimals));
        return amount / (10 ** (decimals - 18));
    }

    function setScheduler(address _scheduler) external onlyOwner {
        scheduler = _scheduler;
    }

    function deposit(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount > 0");
        TokenConfig memory config = tokenConfigs[token];
        require(config.decimals > 0, "token not initialized");
        require(config.lendingEnabled, "lending not enabled");

        accrueInterest(token);

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        uint256 scaledAmount = (amount * 1e18) / supplyIndex[token];
        scaledBalances[token][msg.sender] += scaledAmount;
        totalSupplied[token] += amount;

        emit Deposited(token, msg.sender, amount);
    }

    function depositCollateral(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount > 0");
        TokenConfig memory config = tokenConfigs[token];
        require(config.decimals > 0, "token not initialized");
        require(config.collateralFactor > 0, "collateral not enabled");
        require(!config.lendingEnabled, "use deposit");

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        uint256 scaledAmount = (amount * 1e18) / supplyIndex[token];
        scaledBalances[token][msg.sender] += scaledAmount;
        totalSupplied[token] += amount;

        emit CollateralDeposited(token, msg.sender, amount);
    }

    function withdraw(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount > 0");
        TokenConfig memory config = tokenConfigs[token];
        require(config.decimals > 0, "token not initialized");

        accrueInterest(token);

        uint256 currentBalance = (scaledBalances[token][msg.sender] * supplyIndex[token]) / 1e18;
        require(currentBalance >= amount, "insufficient balance");

        uint256 scaledAmount = (amount * 1e18) / supplyIndex[token];
        scaledBalances[token][msg.sender] -= scaledAmount;
        totalSupplied[token] -= amount;

        IERC20(token).transfer(msg.sender, amount);
        emit Withdrawn(token, msg.sender, amount);
    }

    function balanceOf(address token, address user) external view returns (uint256) {
        uint256 scaled = scaledBalances[token][user];
        if (scaled == 0) return 0;
        return (scaled * supplyIndex[token]) / 1e18;
    }

    function lockForScheduleOnBehalf(address token, address user, uint256 amount) external {
        require(msg.sender == scheduler, "only scheduler");
        require(scaledBalances[token][user] >= amount, "insufficient balance");
        scaledBalances[token][user] -= amount;
        lockedScaledBalances[token][user] += amount;
    }

    function withdrawForScheduled(address token, address owner, address recipient, uint256 scaledAmount, uint256 executorFee, address executor) external {
        require(msg.sender == scheduler, "only scheduler");
        require(lockedScaledBalances[token][owner] >= scaledAmount, "insufficient locked");
        lockedScaledBalances[token][owner] -= scaledAmount;
        uint256 amount = scaledAmount;
        IERC20(token).transfer(recipient, amount - executorFee);
        if (executorFee > 0) {
            IERC20(token).transfer(executor, executorFee);
        }
    }

    function borrow(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount > 0");
        TokenConfig memory config = tokenConfigs[token];
        require(config.decimals > 0, "token not initialized");
        require(config.borrowEnabled, "borrow not enabled");

        accrueInterest(token);

        require(totalSupplied[token] >= totalBorrowed[token] + amount, "insufficient pool liquidity");
        require(scaledBalances[token][msg.sender] > 0, "no collateral");

        uint256 price = assetPrices[token];
        require(price > 0, "price not set");

        (uint256 collateralValue, uint256 borrowValue) = getAccountLiquidity(msg.sender);
        uint256 normalizedBorrowAmount = _normalizeTo1e18(amount, config.decimals);
        uint256 newBorrowValue = borrowValue + ((normalizedBorrowAmount * price) / PRICE_SCALE);
        require(collateralValue >= newBorrowValue, "insufficient collateral");

        uint256 scaledAmount = (amount * 1e18) / borrowIndex[token];
        scaledBorrowBalances[token][msg.sender] += scaledAmount;
        totalBorrowed[token] += amount;
        IERC20(token).transfer(msg.sender, amount);

        emit Borrowed(token, msg.sender, amount);
    }

    function repay(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount > 0");
        TokenConfig memory config = tokenConfigs[token];
        require(config.decimals > 0, "token not initialized");

        accrueInterest(token);

        uint256 currentBorrow = (scaledBorrowBalances[token][msg.sender] * borrowIndex[token]) / 1e18;
        require(currentBorrow >= amount, "insufficient borrow balance");

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        uint256 scaledAmount = (amount * 1e18) / borrowIndex[token];
        scaledBorrowBalances[token][msg.sender] -= scaledAmount;
        totalBorrowed[token] -= amount;

        emit Repaid(token, msg.sender, amount);
    }

    function liquidate(address token, address borrower, uint256 amount) external nonReentrant {
        require(amount > 0, "amount > 0");

        accrueInterest(token);

        (uint256 collateralValue, uint256 borrowValue) = getAccountLiquidity(borrower);
        require(borrowValue > collateralValue, "account healthy");

        uint256 borrowBal = (scaledBorrowBalances[token][borrower] * borrowIndex[token]) / 1e18;
        require(borrowBal > 0, "no borrow to liquidate");

        uint256 repayAmount = amount > borrowBal ? borrowBal : amount;
        IERC20(token).transferFrom(msg.sender, address(this), repayAmount);

        uint256 scaledAmount = (repayAmount * 1e18) / borrowIndex[token];
        scaledBorrowBalances[token][borrower] -= scaledAmount;
        totalBorrowed[token] -= repayAmount;

        uint256 collateralAmount = (repayAmount * 105) / 100;
        uint256 scaledCollateral = (collateralAmount * 1e18) / supplyIndex[token];

        require(scaledBalances[token][borrower] >= scaledCollateral, "insufficient collateral");
        scaledBalances[token][borrower] -= scaledCollateral;
        totalSupplied[token] -= collateralAmount;

        IERC20(token).transfer(msg.sender, collateralAmount);

        emit Repaid(token, borrower, repayAmount);
    }

    function withdrawReserves(address token, uint256 amount) external onlyOwner {
        require(reserves[token] >= amount, "insufficient reserves");
        reserves[token] -= amount;
        IERC20(token).transfer(msg.sender, amount);
    }
}