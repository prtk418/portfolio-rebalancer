import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { Fund } from "../types/Fund";
import type { MyToken } from "../types/MyToken";

type Fixture<T> = () => Promise<T>;

declare module "mocha" {
  export interface Context {
    fund: Fund;
    quoteToken1: MyToken;
    quoteToken2: MyToken;
    quoteToken3: MyToken;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  admin: SignerWithAddress;
}
