import { Kucoin } from './Kucoin';
import { Decimal, decType } from '../utils/calc';
import BigNumber from "bignumber.js";

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
    orderStatus: string
}


interface ExchangeImplement{
    _exchangeType: ExchangeType;
    _symbol: string;
    _orderSide: OrderSide;
    _orderType: string;
    _dryRun: boolean;
    _exchange: Kucoin;
    getMarketList(): Promise<string[]>
    getAccounts(): Promise<{[key: string]:decType}>
    getMarketInfo(market: string): Promise<MarketInfoData[]|undefined>
    getOrderRate(tradeType: string, adjustRate: string, OrderAmount: decType, ...arg: string[]): Promise<decType>
    order(rate: string, amount: string): Promise<string>
    getOrder(orderId: string): Promise<{[key: string]: FormatOrder}>
    getOrders(params: {[key: string]: any}): Promise<[{[key: string]: FormatOrder}, string[]]>
    cancelOrders(symbol: string, orderIds: string[]): Promise<string[]>
    getCoinAmount(symbol: string): Promise<string>
    checkEnableTrade(markets: string[]): Promise<{[key:string]:boolean}>
    checkOrderSize(markets: {[key:string]:{[key:string]: string}}): Promise<{[key:string]:boolean}>
    generateDepositAddress(coinName: string, chain: string): Promise<{[key: string]: string}>
    getDepositAddress(coinName: string): Promise<{[key: string]: string}[]>
    getUserInfo(): Promise<{[key: string]: string}[]>
    getCoinDetail(symbol: string): Promise<{[key: string]: string}>
    getDepositHistory(params: {[key: string]: any}): Promise<{[key: string]: string}[]>
    getTransferBalance(symbol: string, account: string): Promise<{[key: string]: string}>
    innerTransfer(coinName: string, amount: string, fromAc: string, toAc: string): Promise<KucoinOrderIdData>;
    getMarket(symbol: string): string
    convertToMarketInfo(marketInfo: KucoinMarketInfoData): MarketInfoData
}

export class Exchange implements ExchangeImplement {
    _exchangeType: ExchangeType;
    _symbol: string;
    _orderSide: OrderSide;
    _orderType: string;
    _dryRun: boolean;
    _exchange: Kucoin;
    _calcMod: Decimal;
    _pricePrecision: number = 6;
    _amountPrecision: number = 6;



    constructor(exchangeType: ExchangeType, symbol: string, orderSide: OrderSide, orderType: string, apiConf:{[key: string]: string}, calcModuleConf: {[key: string]: any} = {}, dryRun: boolean = false, baseUrl: string = '') {
        this._exchangeType = exchangeType;
        this._symbol = symbol;
        this._orderSide = orderSide;
        this._orderType = orderType;
        this._dryRun = dryRun;
        if (this.exchangeType == ExchangeType.KuCoin) {
            this._exchange = new Kucoin(this.symbol, this.orderSide, apiConf, this.dryRun , baseUrl)
        } else {
            throw new Error('ExchangeType is not supported')
        }

        if (calcModuleConf.decimalPrecision !== undefined && calcModuleConf.roundingMode !== undefined) {
            this._calcMod = new Decimal(calcModuleConf.decimalPrecision, calcModuleConf.roundingMode)
        } else {
            this._calcMod = new Decimal(6, BigNumber.ROUND_HALF_DOWN)
        }
        const symbols = this.symbol.split('-')
        if (symbols.length === 2 && symbols[0] !== '') {
            const market = this.getMarket(symbols[0])
            this.exchange.getMarketInfo(market).then((marketInfo) => {
                if (marketInfo !== undefined) {
                    for (const val of marketInfo) {
                        if (val.symbol === symbol) {
                            const baseIncrements = val.baseIncrement.split('.')
                            const priceIncrement = val.priceIncrement.split('.')
                            this._amountPrecision = baseIncrements[1] ? baseIncrements[1].length : 6
                            this._pricePrecision = priceIncrement[1] ? priceIncrement[1].length : 6
                            break
                        }
                    }
                }
            })
        }


    }

    get exchangeType() { return this._exchangeType }
    get symbol() { return this._symbol }
    get orderSide() { return this._orderSide }
    get orderType() { return this._orderType }
    get dryRun() { return this._dryRun }
    get exchange() { return this._exchange }
    get calcMod() { return this._calcMod }
    get amountPrecision() { return this._amountPrecision }
    get pricePrecision() { return this._pricePrecision }


    async getMarketList(): Promise<string[]> {
        let marketList:string[]|undefined = await this.exchange.getMarketList()
        if (marketList === undefined) {
            throw new Error('Failed to get market list')
        }
        return marketList
    }

    /**
     * accountType of all is get all account balances(main, trade, margin)
     * @param accountType main, trade, margin, or all
     * @param coinName coin name
     * @return {Promise<{[key: string]:string}>} account balances
     */
    async getAccounts(accountType: string='all', coinName?: string): Promise<{[key: string]:string}> {
        let result:{[key: string]:string} = {}
        if (accountType === 'all') {
            for (const acType of ['main', 'trade']) {
                let accounts= await this.exchange.getAccounts(acType, coinName)
                if (accounts === undefined) continue
                for (const val of accounts) {
                    if (!result[val.currency])
                        result[val.currency] = val.balance
                    else
                        result[val.currency] = this.calcMod.add(result[val.currency], val.balance).toString()
                }
            }
        } else {
            let accounts= await this.exchange.getAccounts(accountType, coinName)
            if (accounts === undefined) {
                throw new Error('Failed to get accounts')
            }
            for (const val of accounts) {
                result[val.currency] = val.balance
            }

        }
        return result
    }

    /**
     * @param accountType main, trade, margin, or all
     * @param coinName coin name
     * @return {Promise<{[key: string]:{[key: string]: string}}>}  return account balance detail(balance, available, holds)
     */
    async getAccountDetails(accountType: string='all', coinName?: string): Promise<{[key: string]:{[key: string]: {[key: string]: string}}}> {

        let result: {[key: string]:{[key: string]: {[key: string]: string}}} = {}
        if (accountType === 'all') {
            for (const acType of ['main', 'trade', 'margin']) {
                let accounts= await this.exchange.getAccounts(acType, coinName)
                if (accounts === undefined) continue
                for (const val of accounts) {
                    result[val.currency] = {}
                    result[val.currency][acType] = {
                        'balance': val.balance,
                        'available': val.available,
                        'holds': val.holds
                    }
                }
            }
        } else {
            let accounts= await this.exchange.getAccounts(accountType, coinName)
            if (accounts === undefined) {
                throw new Error('Failed to get accounts')
            }
            for (const val of accounts) {
                result[val.currency] = {}
                result[val.currency][accountType] = {
                    'balance': val.balance,
                    'available': val.available,
                    'holds': val.holds
                }
            }
        }
        return result
    }

    async getMarketInfo(market: string): Promise<MarketInfoData[]|undefined> {
        const marketInfo = await this.exchange.getMarketInfo(market)
        if (marketInfo === undefined) {
            throw new Error('Failed to get market info')
        }
        let result: MarketInfoData[] = []
        if (this.exchangeType === ExchangeType.KuCoin) {
            for (const val of marketInfo) {
                result.push(this.convertToMarketInfo(val))
            }
        }
        return result
    }

    /**
     *
     * @param tradeType
     * @param adjustRate
     * @param OrderAmount
     * @param symbol default is this.symbol
     */
    async getOrderRate(tradeType: string, adjustRate: string, OrderAmount: decType, symbol?: string): Promise<decType> {
        const orderRate = await this.exchange.getOrderRate(tradeType, adjustRate, OrderAmount, symbol)
        if (orderRate === undefined) {
            throw new Error('Failed to get order rate')
        }
        return orderRate
    }

    async order(rate: string, amount: string): Promise<string> {
        const order = await this.exchange.order(rate, amount)
        if (order === undefined) {
            throw new Error('Failed to order')
        }
        return order.orderId
    }

    async getOrder(orderId: string): Promise<{[key: string]: FormatOrder}> {
        const order = await this.exchange.getFormatOrder(orderId)
        if (order === undefined) {
            throw new Error('Failed to get order')
        }
        if (this.exchange.isOrderData(order)) {
            throw new Error('Invalid order data')
        }
        return order
    }

    async getOrders(params: {[key: string]: any}): Promise<[{[key: string]: FormatOrder}, string[]]> {
        const [orders, cancelOrderIds] = await this.exchange.getFormatOrders(params)
        if (orders === undefined) {
            throw new Error('Failed to get orders')
        }
        return [orders, cancelOrderIds]
    }

    async cancelOrders(symbol: string, orderIds: string[]): Promise<string[]> {
        if (symbol == '' || orderIds.length == 0) {
            throw new Error('symbol or orderIds is required')
        }
        let res: KucoinCancelOrderData
        if (symbol === '' && orderIds.length === 1) {
            res = await this.exchange.cancelOrder(orderIds[0])
        } else {
            res = await this.exchange.cancelOrders(symbol, orderIds)
        }
        return res.cancelledOrderIds
    }

    async getCoinAmount(symbol: string): Promise<string> {
        return await this.exchange.getCoinAmount(symbol)
    }

    async checkEnableTrade(markets: string[]): Promise<{[key:string]:boolean}> {
        return await this.exchange.checkEnableTrade(markets)
    }

    async checkOrderSize(markets: {[key:string]:{[key:string]: string}}): Promise<{[key:string]:boolean}> {
        return await this.exchange.checkOrderSize(markets)
    }

    async generateDepositAddress(coinName: string, chain: string): Promise<{[key: string]: string}> {
        const address = await this.exchange.generateDepositAddress(coinName, chain)
        if (address === undefined) {
            throw new Error('Failed to generate deposit address')
        }
        return address
    }

    async getDepositAddress(coinName: string): Promise<{[key: string]: string}[]> {
        const depositAddressData = await this.exchange.getDepositAddress(coinName)
        if (depositAddressData === undefined) {
            throw new Error('Failed to get deposit address')
        }
        return depositAddressData
    }

    async getUserInfo(): Promise<{[key: string]: string}[]> {
        const userInfoData = await this.exchange.getUserInfo()
        if (userInfoData === undefined) {
            throw new Error('Failed to get user info')
        }
        let result: {[key: string]: string}[] = []
        for (const userInfo of userInfoData) {
            result.push({
                userId: userInfo.userId,
                uid: userInfo.uid + '',
                subName: userInfo.subName,
                type: userInfo.type + '',
                remarks: userInfo.remarks,
                access: userInfo.access
            })
        }
        return result
    }

    async getCoinDetail(symbol: string): Promise<{[key: string]: string}> {
        const marketStatus = await this.exchange.getMarketStatus(symbol)
        if (marketStatus === undefined) {
            throw new Error('Failed to get market status')
        }
        return {
            coin: marketStatus.currency,
            name: marketStatus.name,
            fullName: marketStatus.fullName,
            precision: marketStatus.precision + '',
            confirms: marketStatus.confirms + '',
        }
    }

    // @param params: {currency: string, startAt: number, endAt: number, status: string[PROCESSING, SUCCESS, FAILURE], currentPage: number, pageSize: number}
    async getDepositHistory(params: {[key: string]: any}): Promise<{[key: string]: string}[]> {
        const histories = await this.exchange.getDepositHistory(params)
        if (histories === undefined) {
            throw new Error('Failed to get deposit history')
        }
        let result: {[key: string]: string}[] = []
        if (this.exchangeType === ExchangeType.KuCoin) {
            for (const history of histories.items) {
                result.push({
                    symbol: history.currency,
                    createAt: history.createdAt + '',
                    amount: history.amount,
                    walletTxId: history.walletTxId,
                    status: history.status,
                    isInner: history.isInner + '',
                })
            }
        }
        return result
    }

    async getTransferBalance(symbol: string, account: string): Promise<{[key: string]: string}> {
        let balance:{[key: string]: string} = {}
        if (this.exchangeType === ExchangeType.KuCoin) {
            const transfer = await this.exchange.getTransfer(symbol, account)
            if (transfer === undefined) {
                throw new Error('Failed to get transfer')
            }
            balance.coin = transfer.currency
            balance.balance = transfer.balance
            balance.available = transfer.available
            balance.transferable = transfer.transferable
        }
        return balance
    }

    // @param coinName: coin name
    // @param amount: amount
    // @param fromAc: main, trade, margin, or isolated
    // @param toAc: main, trade, margin, or isolated
    async innerTransfer(coinName: string, amount: string, fromAc: string, toAc: string): Promise<KucoinOrderIdData> {
        const transfer = await this.exchange.innerTransfer(coinName, amount, fromAc, toAc)
        if (transfer === undefined) {
            throw new Error('Failed to inner transfer')
        }
        return transfer
    }

    getMarket(symbol: string): string {
        if (this.exchangeType === ExchangeType.KuCoin) {
            if (symbol === 'USDT') {
                return 'USDS'
            }
        }
        return symbol
    }

    convertToMarketInfo(marketInfo: KucoinMarketInfoData): MarketInfoData {
        return {
            'symbol':             marketInfo.symbol,
            'baseCoin':           marketInfo.baseCurrency,
            'quoteCoin':          marketInfo.quoteCurrency,
            'baseCoinPrecision':  marketInfo.baseIncrement,
            'quoteCoinPrecision': marketInfo.quoteIncrement,
            'minOrderAmount':     marketInfo.baseMinSize,
            'maxOrderAmount':     marketInfo.baseMaxSize,
            'minFunds':           marketInfo.minFunds,
            'enableTrading':      marketInfo.enableTrading,
        }
    }
}