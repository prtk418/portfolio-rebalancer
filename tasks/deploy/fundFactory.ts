import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

import type { FundFactory } from "../../types/FundFactory";
import type { FundFactory__factory } from "../../types/factories/FundFactory__factory";

task("deploy:FundFactory")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    const fundFactoryFactory: FundFactory__factory = <FundFactory__factory>await ethers.getContractFactory("FundFactory");
    const fundFactory: FundFactory = <FundFactory>await fundFactoryFactory.connect(signers[0]).deploy();
    await fundFactory.deployed();
    console.log("FundFactory deployed to: ", fundFactory.address);
  });
