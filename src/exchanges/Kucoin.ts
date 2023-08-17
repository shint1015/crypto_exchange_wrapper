import { generateHMAC, generateUUID } from "../utils/utils.js";
import {httpGet, httpPost, HttpResponse} from "../utils/request.js";
import { Decimal, decType } from "../utils/calc";
import BigNumber from "bignumber.js";
import { OrderSide, ExchangeType } from "./Exchange";



interface KucoinImplement {
    _baseUrl: string;
    _symbol: string;
    _orderSide: OrderSide;
    _returnUniqueId?: string;
    _dryRun: boolean;
    getHeaders(method: string, path: string, params: {[key: string]: string}): {[key: string]: string};
    generateParameters(params: {[key: string]: any}): {[key: string]: string};
    generateUrlParameters(params: {[key: string]: string}): string;
    generateSignature(secretKey: string, strToSign: string): string;
    generatePassphrase(secretKey: string, passphrase: string): string;
    commonResponseProcess<T extends object, U extends keyof T>(endPoint: string, method: string, headers: {[key: string]: string}, parameters: {[key: string]: string}, returnTarget: U): Promise<T[U] | undefined>
    getMarketList(): Promise<MarketListData|undefined>;
    getMarketInfo(market: string): Promise<MarketInfoData[]|undefined>;
    getMarketStatus(currency: string): Promise<MarketStatusData|undefined>;
    getTicker(symbol: string): Promise<TickerData|undefined>;
    getTradeFee(symbols: string): Promise<TradeFeeData[]|undefined>;
    getTradeHistory(symbol: string): Promise<TradeHistoryData[]|undefined>;
    getAccounts(): Promise<AccountInfoData[]|undefined>;
    getTransfer(coinName: string, transferType: string): Promise<TransferData|undefined>;
    InnerTransfer(coinName: string, amount: string, fromAc: string, toAc: string): Promise<OrderIdData|undefined>;
    checkEnableTrade(markets: string[]): Promise<{[key: string]: boolean}>;
    checkOrderSize(markets: {[key: string]: {[key: string]: string}}): Promise<{[key: string]: boolean}>;
    generateDepositAddress(coinName: string, chain: string): Promise<DepositAddressData|undefined>;
    getDepositAddress(coinName: string): Promise<DepositAddressData[]|undefined>;
    getUserInfo(): Promise<UserInfoData[]|undefined>;
    getDepositHistory(param: {[key:string]: any}): Promise<DepositAddressData|undefined>;
    getOrderBook(symbol: string, level: number): Promise<OrderBookData|undefined>;
    getOrderRate(tradeType: string, adjustRate: string, orderAmount: decType, symbol: string): Promise<decType>
}



class Kucoin implements KucoinImplement {
    _baseUrl: string;
    _symbol: string;
    _orderSide: OrderSide;
    _returnUniqueId?: string;
    _dryRun: boolean;
    constructor(symbol: string, orderSide: OrderSide, dryRun: boolean, baseUrl: string = '') {
        this._baseUrl = (baseUrl !== undefined && baseUrl !== '') ? baseUrl : 'https://api.kucoin.com/api'
        this._symbol = symbol
        this._orderSide = orderSide
        this._dryRun = dryRun
    }

    get baseUrl() { return this._baseUrl }
    get symbol() { return this._symbol }
    get orderSide() { return this._orderSide }
    get dryRun() { return this._dryRun }

    set baseUrl(url: string) { this._baseUrl = url }
    set symbol(symbol: string) { this._symbol = symbol }
    set orderSide(orderSide: OrderSide) { this._orderSide = orderSide }
    set dryRun(dryRun: boolean) { this._dryRun = dryRun }

    getHeaders(method: string, path: string, params: {[key: string]: string} = {}): {[key: string]: string} {
        const timestamp = Date.now()
        const secretKey = process.env.KUCOIN_API_SECRET as string
        const apiKey = process.env.KUCOIN_API_KEY as string
        const passphrase = process.env.KUCOIN_API_PASSPHRASE as string
        const jsonDataStr = JSON.stringify(params)

        const payload = `${timestamp}${method}/api${path}${jsonDataStr}`
        return {
            "KC-API-KEY": apiKey,
            "KC-API-SIGN": this.generateSignature(secretKey, payload),
            "KC-API-TIMESTAMP": this.generatePassphrase(secretKey, passphrase),
            "KC-API-PASSPHRASE": passphrase,
            "KC-API-KEY-VERSION": '2',
            "Content-Type": 'application/json'
        }
    }

    generateParameters(params: {[key: string]: any}): {[key: string]: string} {
        const result: { [key: string]: string } = {}
        for(const [key, value] of Object.entries(params)) {
            if (typeof value === 'string') {
                if (key === "symbol" && this.symbol !== "") {
                    result[key] = this.symbol
                } else {
                    result[key] = value
                }
            } else {
                result[key] = JSON.stringify(value)
            }
        }
        return result;
    }

    generateUrlParameters(params: {[key: string]: string}): string {
        let result: string = ''
        for (const [key, value] of Object.entries(params)) {
            if (value !== "") {
                if (result !== "") {
                    result += "&"
                }
                result += `${key}=${value}`
            }
        }
        return result
    }
    generateSignature(secretKey: string, strToSign: string): string {
        return generateHMAC(secretKey, strToSign)
    }

    generatePassphrase(secretKey: string, passphrase: string): string {
        return generateHMAC(secretKey, passphrase)
    }

    async commonResponseProcess<T extends object, U extends keyof T>(
        endPoint: string,
        method: string,
        headers: {[key: string]: string} = {},
        parameters: {[key: string]: string} = {},
        returnTarget: U = "data" as U,
    ): Promise<T[U] | undefined> {
        try {
            let response: HttpResponse | undefined;
            if (method === 'GET') {
                response = await httpGet(endPoint);
            } else if (method === 'POST') {
                response = await httpPost(endPoint, headers, parameters);
            } else {
                return undefined;
            }

            if (response === undefined) {
                return undefined;
            }
            const toObj = JSON.parse(response.Body) as T;
            return toObj[returnTarget];
        }catch (e) {
            throw e;
        }
    }
    async getMarketList(): Promise<MarketListData|undefined> {
        try {
            const endPoint = `${this.baseUrl}/v1/markets`
            return await this.commonResponseProcess<MarketList, "data">(endPoint, 'GET')
        }catch (e) {
            throw e;
        }
    }

    async getMarketInfo(market: string): Promise<MarketInfoData[]|undefined> {
        try {
            const endPoint = `${this.baseUrl}/v2/symbols?market=${market}`
            return await this.commonResponseProcess<MarketInfo, "data">(endPoint, 'GET')
        }catch (e) {
            throw e;
        }
    }

    async getMarketStatus(currency: string): Promise<MarketStatusData|undefined> {
        try {
            const endPoint = `${this.baseUrl}/v2/currencies/${currency}`
            return await this.commonResponseProcess<MarketStatus, "data">(endPoint, 'GET')
        }catch (e) {
            throw e;
        }
    }

    async getTicker(symbol: string): Promise<TickerData|undefined> {
        try {
            const endPoint = `${this.baseUrl}/v1/market/orderbook/level1?symbol=${symbol}`
            return await this.commonResponseProcess<Ticker, "data">(endPoint, 'GET')
        }catch (e) {
            throw e;
        }
    }

    async getTradeFee(symbols: string): Promise<TradeFeeData[]|undefined> {
        try {
            const endPoint = `${this.baseUrl}/v1/trade-fees?symbols=${symbols}`
            return await this.commonResponseProcess<TradeFee, "data">(endPoint, 'GET')
        }catch (e) {
            throw e;
        }
    }

    async getTradeHistory(symbol: string): Promise<TradeHistoryData[]|undefined> {
        try {
            const endPoint = `${this.baseUrl}/v1/market/histories?symbol=${symbol}`
            return await this.commonResponseProcess<TradeHistory, "data">(endPoint, 'GET')
        }catch (e) {
            throw e;
        }
    }

    async getAccounts(): Promise<AccountInfoData[]|undefined> {
        try {
            const endPoint = `${this.baseUrl}/v1/accounts`
            return await this.commonResponseProcess<AccountInfo, "data">(endPoint, 'GET')
        }catch (e) {
            throw e;
        }
    }

    async getTransfer(coinName: string, transferType: string): Promise<TransferData|undefined> {
        try {
            const endPoint = `${this.baseUrl}/v2/accounts/${coinName}/ledgers?type=${transferType}`
            return await this.commonResponseProcess<Transfer, "data">(endPoint, 'GET')
        }catch (e) {
            throw e;
        }
    }

    async InnerTransfer(coinName: string, amount: string, fromAc: string = '', toAc: string = ''): Promise<OrderIdData|undefined> {
        try {
            let formatParams:{[key:string]:string} = {
                "amount": amount,
                "currency": coinName,
                "clientOid": generateUUID(),
            }
            if (fromAc !== '') formatParams['from'] = fromAc
            if (toAc !== '') formatParams['to'] = toAc

            if (this.dryRun) {
                console.info(`----- InnerTransfer ----- \n ${JSON.stringify(formatParams)}`)
                return undefined
            }
            const params = this.generateParameters(formatParams)
            const path = '/v2/accounts/inner-transfer'
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('POST', path, params)
            return await this.commonResponseProcess<SendOrder, "data">(endPoint, 'POST', headers, params)
        }catch (e) {
            throw e;
        }
    }

    async checkEnableTrade(markets: string[]): Promise<{[key: string]: boolean}> {
        try {
            let enableCoins:{[key: string]: boolean} = {}
            for (const market of markets) {
                enableCoins[market] = false
            }
            const marketInfo = await this.getMarketInfo("")
            if (marketInfo === undefined) {
                return enableCoins
            }
            for (const info of marketInfo) {
                if (info.enableTrading) enableCoins[info.symbol] = true
            }
            return enableCoins
        }catch (e) {
            throw e;
        }
    }

    async checkOrderSize(markets: {[key: string]: {[key: string]: string}}): Promise<{[key: string]: boolean}> {
        try {
            let enableCoins:{[key: string]: boolean} = {}
            for (const market of Object.keys(markets)) {
                enableCoins[market] = false
            }
            const marketInfo = await this.getMarketInfo("")
            if (marketInfo === undefined) {
                return enableCoins
            }
            for (const info of marketInfo) {
                if (
                    Decimal.cmp(info.baseMinSize, markets[info.symbol]["orderAmount"]) >= 0
                    || Decimal.cmp(info.baseMaxSize, markets[info.symbol]["orderAmount"]) <= 0
                ) {
                    console.warn(`orderAmount is valid. ${info.symbol} orderAmount: ${markets[info.symbol]['orderAmount']} min: ${info.baseMinSize} max: ${info.baseMaxSize}`)
                    continue
                }

                if (Decimal.cmp(info.minFunds, markets[info.symbol]["orderBaseAmount"]) >= 0) {
                    console.warn(`orderBaseAmount is too small. ${info.symbol} orderBaseAmount: ${markets[info.symbol]['orderBaseAmount']} min: ${info.minFunds}`)
                    continue
                }
                enableCoins[info.symbol] = true
            }

            return enableCoins
        }catch (e) {
            throw e;
        }
    }
    async generateDepositAddress(coinName: string, chain: string = ''): Promise<DepositAddressData|undefined> {
        try {
            const path = `/v1/deposit-addresses`
            const endPoint = `${this.baseUrl}${path}`

            let formatParams: {[key:string]:string} = {'currency': coinName}
            if (chain !== '') formatParams['chain'] = chain

            const params = this.generateParameters(formatParams)
            const headers = this.getHeaders('POST', path, params)

            return await this.commonResponseProcess<DepositAddress, "data">(endPoint, 'POST', headers, params)
        }catch (e) {
            throw e;
        }
    }

    async getDepositAddress(coinName: string): Promise<DepositAddressData[]|undefined> {
        try {
            let path = `/v1/deposit-addresses`
            if (coinName !== '') path += `?currency=${coinName}`
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('GET', path)
            return await this.commonResponseProcess<DepositAddressList, "data">(endPoint, 'GET', headers)
        }catch (e) {
            throw e;
        }
    }

    async getUserInfo(): Promise<UserInfoData[]|undefined> {
        try {
            const path = `/v1/sub/user`
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('GET', path)
            return await this.commonResponseProcess<UserInfo, "data">(endPoint, 'GET', headers)
        }catch (e) {
            throw e;
        }
    }
    async getDepositHistory(param: {[key:string]: any}): Promise<DepositAddressData|undefined> {
        try {
            let path = `/v1/deposits`
            const urlParams = this.generateUrlParameters(this.generateParameters(param))
            if (urlParams !== '') path += `?${urlParams}`
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('GET', path)
            return await this.commonResponseProcess<DepositHistory, "data">(endPoint, 'GET', headers)
        }catch (e) {
            throw e;
        }
    }
    async getOrderBook(symbol: string = this.symbol, level: number = 20): Promise<OrderBookData|undefined> {
        try {
            const path = `/v1/market/orderbook/level2_${level}?symbol=${symbol}`
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('GET', path)
            return await this.commonResponseProcess<OrderBook, "data">(endPoint, 'GET', headers)
        }catch (e) {
            throw e;
        }
    }

    async getOrderRate(tradeType: string, adjustRate: string, orderAmount: decType, symbol: string = this.symbol): Promise<decType> {
        const orderBook = await this.getOrderBook(symbol)
        if (orderBook === undefined) {
            throw new Error(`getOrderRate failed. ${symbol}`)
        }
        let orderRate: decType = 0
        let baseRate: number = 1
        if (tradeType === "limit") {
            if (this.orderSide === OrderSide.Buy) {
                if (orderBook.bids.length === 0 || orderBook.bids[0].length === 0) {
                    throw new Error(`getOrderRate failed. ${symbol}`)
                }
                const bids = orderBook.bids[0]
                orderRate = Decimal.mul(bids[0], Decimal.sub(baseRate, adjustRate))
            } else {
                if (orderBook.asks.length === 0 || orderBook.asks[0].length === 0) {
                    throw new Error(`getOrderRate failed. ${symbol}`)
                }
                const asks = orderBook.asks[0]
                orderRate = Decimal.mul(asks[0], Decimal.add(baseRate, adjustRate))
            }
        } else {
            let amount: BigNumber = Decimal.toDec(0)
            let orderBookData: string[][]
            if (this.orderSide === OrderSide.Buy) {
                orderBookData = orderBook.bids
            } else {
                orderBookData = orderBook.asks
                orderBookData.sort()
            }

            for (const val of orderBookData) {
                let addAmount: BigNumber = Decimal.mul(val[0], val[1])
                amount = Decimal.add(amount, addAmount)
                if (Decimal.cmp(amount, orderAmount) >= 0) {
                    orderRate = Decimal.toDec(val[0])
                    break
                }
            }
        }
        if (orderRate === 0) {
            throw new Error(`getOrderRate failed. ${symbol}`)
        }
        return orderRate
    }


    // async getOrder(orderId: string): Promise<{[key:string]: FormatOrder}> {
    //     const path = `/v1/orders/${orderId}`
    //     const endPoint = `${this.baseUrl}${path}`
    //     const headers = this.getHeaders('GET', path)
    //     const orderData = await this.commonResponseProcess<Order, "data">(endPoint, 'GET', headers)
    //
    // }
    //
    //
    // processingData(orderData: OrderData[]): {[key: string]: FormatOrder} {
    //     let orders: {[key: string]: FormatOrder} = {}
    //     let cancelOrderIds: string[] = []
    //
    //     for (const v of orderData) {
    //         const orderType: string = v.type
    //         const orderSide: string = v.side
    //         const symbols: string[] = v.symbol.split('-')
    //         const orderId: string = v.id
    //         let fromCoin: string, toCoin: string, fromAmount: string, toAmount: string;
    //         const orderFee = v.fee
    //         if (orderSide === OrderSide.Buy) {
    //             fromAmount = v.dealFunds
    //             toAmount = v.dealSize
    //                 [fromCoin, toCoin] = [symbols[1], symbols[0]]
    //         } else {
    //             fromAmount = v.dealSize
    //             toAmount = v.dealFunds
    //                 [fromCoin, toCoin] = [symbols[0], symbols[1]]
    //         }
    //     }
    // }
}


export { Kucoin }