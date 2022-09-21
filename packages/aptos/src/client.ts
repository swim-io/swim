import {
  APTOS_COIN,
  AptosAccount,
  CoinClient,
  AptosClient as SDKAptosClient,
} from "aptos";
import Decimal from "decimal.js";

export class AptosClient extends SDKAptosClient {
  public async getGasBalance(address: string): Promise<Decimal> {
    return this.getTokenBalance(address, APTOS_COIN);
  }

  public async getTokenBalance(
    address: string,
    coinType: string,
  ): Promise<Decimal> {
    const account = new AptosAccount(undefined, address);
    const coinClient = new CoinClient(this);
    const balance = await coinClient.checkBalance(account, { coinType });
    return new Decimal(balance.toString());
  }
}
