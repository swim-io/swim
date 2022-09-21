import {
  APTOS_COIN,
  AptosAccount,
  CoinClient,
  AptosClient as SDKAptosClient,
} from "aptos";
import Decimal from "decimal.js";

interface GasScheduleV2 {
  readonly entries: readonly {
    readonly key: string;
    readonly value: string;
  }[];
}

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

  public async getGasPrice(): Promise<Decimal> {
    // from https://discord.com/channels/945856774056083548/946123778793029683/1022056705485459486
    const resource = await this.getAccountResource(
      "0x1",
      "0x1::gas_schedule::GasScheduleV2",
    );
    const { entries } = resource.data as GasScheduleV2;
    const minimum = entries.find(
      ({ key }) => key === "txn.min_price_per_gas_unit",
    );

    // there is also a max value
    // current values from https://fullnode.devnet.aptoslabs.com/v1/accounts/0x1/resource/0x1::gas_schedule::GasScheduleV2
    // {
    //   "key": "txn.min_price_per_gas_unit",
    //   "val": "100"
    // },
    // {
    //   "key": "txn.max_price_per_gas_unit",
    //   "val": "10000"
    // },

    if (!minimum) throw new Error(`No "txn.min_price_per_gas_unit" key found`);
    return new Decimal(minimum.value);
  }
}
