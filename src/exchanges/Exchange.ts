import { Kucoin } from "./Kucoin";
import { Decimal, decType } from "../utils/calc";


export enum ExchangeType {
    KuCoin = 'kucoin',
}

export enum OrderSide {
    Buy = 'buy',
    Sell = 'sell',
}

export type FormatOrder = {
    symbol: string
    orderType: string
    orderSide: OrderSide
    fromCoin: string
    toCoin: string
    orderRate: decType
    orderFee: decType
    fromAmount: decType
    toAmount: decType
    orderStatus: OrderStatus

}

export class Exchange {
    _exchangeType: ExchangeType;
    _symbol: string;
    _orderSide: OrderSide;
    _orderType: string;
    _dryRun: boolean;
    _exchange: Kucoin;


    constructor(exchangeType: ExchangeType, symbol: string, orderSide: OrderSide, orderType: string, dryRun: boolean = false, baseUrl: string = '') {
        this._exchangeType = exchangeType;
        this._symbol = symbol;
        this._orderSide = orderSide;
        this._orderType = orderType;
        this._dryRun = dryRun;
        if (this.exchangeType == ExchangeType.KuCoin) {
            this._exchange = new Kucoin(this.symbol, this.orderSide, this.dryRun , baseUrl)
        } else {
            throw new Error('ExchangeType is not supported')
        }
    }
    get exchangeType() { return this._exchangeType }
    get symbol() { return this._symbol }
    get orderSide() { return this._orderSide }
    get orderType() { return this._orderType }
    get dryRun() { return this._dryRun }
    get exchange() { return this._exchange }


    async getMarketList(): Promise<string[]> {
        let marketList:string[]|undefined = await this.exchange.getMarketList()
        if (marketList === undefined) {
            throw new Error('Failed to get market list')
        }
        return marketList
    }
}