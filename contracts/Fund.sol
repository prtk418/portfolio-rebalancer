// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";

/// @notice A contract to manage fund with >3 and <=10 assets with USDC as base asset
/// @notice On every deposit (via backend keeper) or manual trigger has capability to rebalance
contract Fund {
    /// @notice Quote tokens which comprises the portfolio
    address[] public quoteTokens;

    /// @notice Base token against which value of portfolio is benchmarked as well as rebalanced
    address public baseToken;

    /// @notice Uniswap router instance which is used to fetch prices and performing swaps
    IUniswapV2Router01 public uniswapRouter;

    /// @dev Asset struct is used in memory for making computation easier while rebalancing
    struct Asset {
        address addr;
        uint usdcValue;
    }

    /// @notice While deploying the contract we pass in quote tokens, base token
    /// @notice and the uniswap router and store in global state
    constructor(address[] memory _quoteTokens, address _baseToken, address _uniswapRouter) {
        quoteTokens = _quoteTokens;
        baseToken = _baseToken;
        uniswapRouter = IUniswapV2Router01(_uniswapRouter);
    }

    /// @notice The function rebalances portfolio
    /// @dev Invoked by backend keeper and manually through UI or contract interaction as well
    function rebalance() public {
        uint totTokenUsdcValue;
        uint numTokens = quoteTokens.length;

        /// @dev Constructing an array of Asset struct in order to keep track of USDC worth of assets
        /// @dev which will later be used to rebalance portfolio
        Asset[] memory assets;
        for (uint i = 0; i < numTokens; i++) {
            Asset memory a;
            a.addr = quoteTokens[i];
            a.usdcValue = getTokenPrice(quoteTokens[i], baseToken, IERC20(quoteTokens[i]).balanceOf(address(this)));
            assets[i] = a;

            totTokenUsdcValue += a.usdcValue;
        }

        /// @dev Need to sort because we want to sell high worth assets first to accrue additional USDC
        /// @dev which can later be used to swap to low worth assets
        Asset[] memory sortedAssets = _sortAssetsByValue(assets);
        uint expectedTokensUsdcVal = (totTokenUsdcValue + IERC20(baseToken).balanceOf(address(this)) / numTokens);

        for (uint i = 0; i < numTokens; i++) {
            if (sortedAssets[i].usdcValue > expectedTokensUsdcVal) {
                /// @notice Swap extra tokens to usdc if asset worth is more than average
                uint256 amountOut = sortedAssets[i].usdcValue - expectedTokensUsdcVal;
                uint256 tokenBal = IERC20(quoteTokens[i]).balanceOf(address(this));
                IERC20(quoteTokens[i]).approve(address(uniswapRouter), tokenBal);
                address[] memory path = new address[](2);
                path[0] = quoteTokens[i];
                path[1] = baseToken;
                uint256 amountInMax = ((tokenBal * amountOut * 105) / (sortedAssets[i].usdcValue * 100)); // 5% slippage
                uniswapRouter.swapTokensForExactTokens(
                    amountOut,
                    amountInMax,
                    path,
                    address(this),
                    block.timestamp + 15
                );
            } else if (sortedAssets[i].usdcValue < expectedTokensUsdcVal) {
                /// @notice Swap required usdc to asset if asset worth is less than average
                uint amountIn = expectedTokensUsdcVal - sortedAssets[i].usdcValue;
                IERC20(baseToken).approve(address(uniswapRouter), amountIn);
                address[] memory path = new address[](2);
                path[0] = baseToken;
                path[1] = quoteTokens[i];
                uint amountOutMin = (95 * amountIn) / 100; // 5% slippage
                uniswapRouter.swapExactTokensForTokens(
                    amountIn,
                    amountOutMin,
                    path,
                    address(this),
                    block.timestamp + 15
                );
            }
        }
    }

    /// @notice Takes in array of Asset struct and Returns sorted array of Asset struct by usdcValue
    function getTokenPrice(address tokenIn, address tokenOut, uint amountIn) public view returns (uint) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        uint256[] memory amountOutMins = uniswapRouter.getAmountsOut(amountIn, path);
        return amountOutMins[1];
    }

    /// @notice Takes in array of Asset struct and Returns sorted array of Asset struct by usdcValue
    /// @dev Can we optimise the sorting algo?
    function _sortAssetsByValue(Asset[] memory assets) private pure returns (Asset[] memory) {
        for (uint i = 1; i < assets.length; i++)
            for (uint j = 0; j < i; j++)
                if (assets[i].usdcValue < assets[j].usdcValue) {
                    Asset memory x = assets[i];
                    assets[i] = assets[j];
                    assets[j] = x;
                }

        return assets;
    }
}
