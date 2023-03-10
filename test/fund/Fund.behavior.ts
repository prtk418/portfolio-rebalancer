import { expect } from "chai";
import { ethers } from "hardhat";
import myContract from './UniswapRouter.json';

export function shouldBehaveLikeFund(): void {
  it("should return the new greeting once it's changed", async function () {
    const usdcHolder = "0xbC3291D1EE46662DB8921DD120baF6a3C60c3BCD"
    await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [usdcHolder],
    });
    const usdcSigner = await ethers.getSigner(usdcHolder);
    const ERC20ABI = require("@uniswap/v2-periphery/build/ERC20.json").abi;
    const usdcContract = new ethers.Contract("0xd35CCeEAD182dcee0F148EbaC9447DA2c4D449c4", ERC20ABI, usdcSigner)
    await usdcContract.transfer(this.signers.admin.address, ethers.utils.parseUnits("10000000000000", 6))
    expect(await usdcContract.balanceOf(this.signers.admin.address)).to.equal(ethers.utils.parseUnits("10000000000000", 6))

    const uniswapRouterAbi = require("@uniswap/v2-periphery/build/UniswapV2Router01.json").abi;
    const uniswapRouterContract = new ethers.Contract("0xf164fC0Ec4E93095b804a4795bBe1e041497b92a", uniswapRouterAbi, this.signers.admin)
    let uniswapPrice;

    // Add liquidity to uniswap pool
    await usdcContract.connect(this.signers.admin).approve(uniswapRouterContract.address, ethers.utils.parseUnits("10000000000", 6));
    await this.quoteToken1.connect(this.signers.admin).approve(uniswapRouterContract.address, ethers.utils.parseUnits("1000000"));
    await uniswapRouterContract.connect(this.signers.admin).addLiquidity(
      this.quoteToken1.address,
      usdcContract.address,
      ethers.utils.parseUnits("1000000"),
      ethers.utils.parseUnits("100000000", 6),
      1,
      1,
      this.signers.admin.address,
      Date.now() + 60 * 30
    )
    console.log("Liquidity for quoteToken1 added $100 per token");
    // console.log("Uniswap price for quoteToken1", await uniswapRouterContract.getAmountsOut(ethers.utils.parseUnits("1"), [this.quoteToken1.address, usdcContract.address]))

    await this.quoteToken2.connect(this.signers.admin).approve(uniswapRouterContract.address, ethers.utils.parseUnits("1000000"));
    await uniswapRouterContract.connect(this.signers.admin).addLiquidity(
      this.quoteToken2.address,
      usdcContract.address,
      ethers.utils.parseUnits("1000000"),
      ethers.utils.parseUnits("500000000", 6),
      1,
      1,
      this.signers.admin.address,
      Date.now() + 60 * 30
    )
    console.log("Liquidity for quoteToken2 added $500 per token");

    await this.quoteToken3.connect(this.signers.admin).approve(uniswapRouterContract.address, ethers.utils.parseUnits("1000000"));
    await uniswapRouterContract.connect(this.signers.admin).addLiquidity(
      this.quoteToken3.address,
      usdcContract.address,
      ethers.utils.parseUnits("1000000"),
      ethers.utils.parseUnits("1000000000", 6),
      1,
      1,
      this.signers.admin.address,
      Date.now() + 60 * 30
    )
    console.log("Liquidity for quoteToken3 added $1000 per token");

    await usdcContract.transfer(this.fund.address, ethers.utils.parseUnits("100000", 6))
    expect(await usdcContract.balanceOf(this.fund.address)).to.equal(ethers.utils.parseUnits("100000", 6))

    // Balances before rebalance
    expect(ethers.utils.formatUnits(await this.quoteToken1.balanceOf(this.fund.address))).to.equal("0.0")
    expect(ethers.utils.formatUnits(await this.quoteToken2.balanceOf(this.fund.address))).to.equal("0.0")
    expect(ethers.utils.formatUnits(await this.quoteToken3.balanceOf(this.fund.address))).to.equal("0.0")
    expect(ethers.utils.formatUnits(await usdcContract.balanceOf(this.fund.address), 6)).to.equal("100000.0")
    await this.fund.rebalance()
    // Balances after rebalance
    expect(ethers.utils.formatUnits(await this.quoteToken1.balanceOf(this.fund.address))).to.equal("332.222924578076323389")
    expect(ethers.utils.formatUnits(await this.quoteToken2.balanceOf(this.fund.address))).to.equal("66.462249141842416382")
    expect(ethers.utils.formatUnits(await this.quoteToken3.balanceOf(this.fund.address))).to.equal("33.232228915260060568")
    expect(ethers.utils.formatUnits(await usdcContract.balanceOf(this.fund.address), 6)).to.equal("0.000001")
    // Rebalance without any changes should not change position sizes
    await this.fund.rebalance()
    expect(ethers.utils.formatUnits(await this.quoteToken1.balanceOf(this.fund.address))).to.equal("332.222924578076323389")
    expect(ethers.utils.formatUnits(await this.quoteToken2.balanceOf(this.fund.address))).to.equal("66.462249141842416382")
    expect(ethers.utils.formatUnits(await this.quoteToken3.balanceOf(this.fund.address))).to.equal("33.232228915260060568")
    expect(ethers.utils.formatUnits(await usdcContract.balanceOf(this.fund.address), 6)).to.equal("0.000001")

    // Transfer another $100k and then rebalance
    await usdcContract.transfer(this.fund.address, ethers.utils.parseUnits("100000", 6))
    await this.fund.rebalance()
    expect(ethers.utils.formatUnits(await this.quoteToken1.balanceOf(this.fund.address))).to.equal("664.224473364450538984")
    expect(ethers.utils.formatUnits(await this.quoteToken2.balanceOf(this.fund.address))).to.equal("132.915681885983983478")
    expect(ethers.utils.formatUnits(await this.quoteToken3.balanceOf(this.fund.address))).to.equal("66.462267798990419342")
    expect(ethers.utils.formatUnits(await usdcContract.balanceOf(this.fund.address), 6)).to.equal("0.0")


    // Increase price of quoteToken1
    await uniswapRouterContract.swapExactTokensForTokens(
      ethers.utils.parseUnits("41700000", 6),
      1,
      [usdcContract.address, this.quoteToken1.address],
      this.signers.admin.address,
      Date.now() + 60 * 30
    )
    // console.log("Uniswap updated price for quoteToken1 ~$200", await uniswapRouterContract.getAmountsOut(ethers.utils.parseUnits("1"), [this.quoteToken1.address, usdcContract.address]))

    await this.fund.rebalance();
    expect(ethers.utils.formatUnits(await this.quoteToken1.balanceOf(this.fund.address))).to.equal("442.426581886659445905")
    expect(ethers.utils.formatUnits(await this.quoteToken2.balanceOf(this.fund.address))).to.equal("177.158287374022696288")
    expect(ethers.utils.formatUnits(await this.quoteToken3.balanceOf(this.fund.address))).to.equal("88.587021508718240915")
    expect(ethers.utils.formatUnits(await usdcContract.balanceOf(this.fund.address), 6)).to.equal("0.000002")
    // TVL - $264k ($200k deposit + $64k profit due to surge in quoteToken2 price by 2x)

    // Decrease price of quoteToken2
    await this.quoteToken2.connect(this.signers.admin).approve(uniswapRouterContract.address, ethers.utils.parseUnits("1000000"));
    await uniswapRouterContract.swapExactTokensForTokens(
      ethers.utils.parseUnits("412000"),
      1,
      [this.quoteToken2.address, usdcContract.address],
      this.signers.admin.address,
      Date.now() + 60 * 30
    )
    // console.log("Uniswap updated price for quoteToken2 ~$250", await uniswapRouterContract.getAmountsOut(ethers.utils.parseUnits("1"), [this.quoteToken2.address, usdcContract.address]))

    await this.fund.rebalance();
    expect(ethers.utils.formatUnits(await this.quoteToken1.balanceOf(this.fund.address))).to.equal("368.686858397682913184")
    expect(ethers.utils.formatUnits(await this.quoteToken2.balanceOf(this.fund.address))).to.equal("293.780645388497877452")
    expect(ethers.utils.formatUnits(await this.quoteToken3.balanceOf(this.fund.address))).to.equal("73.926557727516686298")
    expect(ethers.utils.formatUnits(await usdcContract.balanceOf(this.fund.address), 6)).to.equal("0.0")
    // TVL - $220k ($200k deposit + $64k profit due to surge in quoteToken2 price by 2x - $44k due to dump in price of quoteToken2)
  });
}
