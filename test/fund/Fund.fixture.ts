import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import type { Fund } from "../../types/Fund";
import type { MyToken } from "../../types/MyToken";
import type { Fund__factory } from "../../types/factories/Fund__factory";
import type { MyToken__factory } from "../../types/factories/MyToken__factory";

export async function deployFundFixture(): Promise<{ fund: Fund }> {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const admin: SignerWithAddress = signers[0];

  const quoteTokenFactory1: MyToken__factory = <MyToken__factory>await ethers.getContractFactory("MyToken");
  const quoteToken1: MyToken = <MyToken>await quoteTokenFactory1.connect(admin).deploy();
  await quoteToken1.deployed();
  await quoteToken1.mint(admin.address, ethers.utils.parseUnits("10000000"));

  const quoteTokenFactory2: MyToken__factory = <MyToken__factory>await ethers.getContractFactory("MyToken");
  const quoteToken2: MyToken = <MyToken>await quoteTokenFactory2.connect(admin).deploy();
  await quoteToken2.deployed();
  await quoteToken2.mint(admin.address, ethers.utils.parseUnits("10000000"));

  const quoteTokenFactory3: MyToken__factory = <MyToken__factory>await ethers.getContractFactory("MyToken");
  const quoteToken3: MyToken = <MyToken>await quoteTokenFactory3.connect(admin).deploy();
  await quoteToken3.deployed();
  await quoteToken3.mint(admin.address, ethers.utils.parseUnits("10000000"));

  const quoteTokens: string[] = [quoteToken1.address, quoteToken2.address, quoteToken3.address];
  const baseTokenAddr: string = "0xd35CCeEAD182dcee0F148EbaC9447DA2c4D449c4"; // USDC Goerli
  const uniswapRouter: string = "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a";

  const fundFactory: Fund__factory = <Fund__factory>await ethers.getContractFactory("Fund");
  const fund: Fund = <Fund>await fundFactory.connect(admin).deploy(quoteTokens, baseTokenAddr, uniswapRouter);
  await fund.deployed();

  return { fund, quoteToken1, quoteToken2, quoteToken3 };
}
