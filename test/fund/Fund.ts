import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import type { Signers } from "../types";
import { shouldBehaveLikeFund } from "./Fund.behavior";
import { deployFundFixture } from "./Fund.fixture";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];

    this.loadFixture = loadFixture;
  });

  describe("Fund", function () {
    beforeEach(async function () {
      const { fund, quoteToken1, quoteToken2, quoteToken3 } = await this.loadFixture(deployFundFixture);
      this.fund = fund;
      this.quoteToken1 = quoteToken1;
      this.quoteToken2 = quoteToken2;
      this.quoteToken3 = quoteToken3;
    });

    shouldBehaveLikeFund();
  });
});
