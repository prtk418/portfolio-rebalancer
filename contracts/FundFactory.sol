// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import { Fund } from "./Fund.sol";

/// @notice A factory contract which deploys fund contract with required quote assets, base asset and dex router
contract FundFactory {
    /// @notice Array of all the funds deployed through this factory
    mapping(address => address[]) public ownerFunds;
    mapping(address => uint8) public ownerFundsCount;

    /// @notice Event which gets emitted on new fund deployment
    event FundCreated(address fund, address creator, address[] quoteTokens, address baseToken);

    /// @notice Takes quote tokens, base token and the uniswap router as parameters
    /// @notice and deploys a new instance of Fund contract
    function createFund(address[] memory _quoteTokens, address _baseToken, address _uniswapRouter) public {
        require(_quoteTokens.length >= 3, "FundFactory: Minimum quote tokens required - 3");
        require(_quoteTokens.length <= 10, "FundFactory: Maximum quote tokens possible - 10");
        Fund fund = new Fund(_quoteTokens, _baseToken, _uniswapRouter);
        ownerFunds[msg.sender].push(address(fund));
        ownerFundsCount[msg.sender] += 1;
        emit FundCreated(address(fund), msg.sender, _quoteTokens, _baseToken);
    }
}
