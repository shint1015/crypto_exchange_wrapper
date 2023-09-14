import { checkDataExist, generateHMAC, generateUUID } from '../utils/utils.js';
import {httpGet, httpPost, httpDelete, HttpResponse} from '../utils/request.js';
import { Decimal, decType } from '../utils/calc.js';
import BigNumber from 'bignumber.js';
import { OrderSide, FormatOrder } from './Exchange.js';

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
    getMarketList(): Promise<KucoinMarketListData|undefined>;
    getMarketInfo(market: string): Promise<KucoinMarketInfoData[]|undefined>;
    getMarketStatus(currency: string): Promise<KucoinMarketStatusData|undefined>;
    getTicker(symbol: string): Promise<KucoinTickerData|undefined>;
    getTradeFee(symbols: string): Promise<KucoinTradeFeeData[]|undefined>;
    getTradeHistory(symbol: string): Promise<KucoinTradeHistoryData[]|undefined>;
    getAccounts(): Promise<KucoinAccountInfoData[]|undefined>;
    getCoinAmount(symbol: string): Promise<string>;
    getTransfer(coinName: string, transferType: string): Promise<KucoinTransferData|undefined>;
    innerTransfer(coinName: string, amount: string, fromAc: string, toAc: string): Promise<KucoinOrderIdData>;
    checkEnableTrade(markets: string[]): Promise<{[key: string]: boolean}>;
    checkOrderSize(markets: {[key: string]: {[key: string]: string}}): Promise<{[key: string]: boolean}>;
    generateDepositAddress(coinName: string, chain: string): Promise<KucoinDepositAddressData|undefined>;
    getDepositAddress(coinName: string): Promise<KucoinDepositAddressData[]|undefined>;
    getUserInfo(): Promise<KucoinUserInfoData[]|undefined>;
    getDepositHistory(param: {[key:string]: any}): Promise<KucoinDepositHistoryData|undefined>;
    getOrderBook(symbol: string, level: number): Promise<KucoinOrderBookData|undefined>;
    getOrderRate(tradeType: string, adjustRate: string, orderAmount: decType, symbol: string): Promise<decType>;
    formatOrders(items: KucoinOrderData[]): [{[key: string]: FormatOrder}, string[]]
    getOrder(orderId: string): Promise<KucoinOrderData>;
    getOrders(params: {[key:string]: any}): Promise<KucoinOrderData[]>;
    getFormatOrder(orderId: string): Promise<{[key:string]: FormatOrder}>;
    getFormatOrders(params: {[key:string]: any}): Promise<[{[key:string]: FormatOrder}, string[]]>;
    getCancelOrder(symbol: string, tradeType: string, orderIds: string[]): Promise<KucoinOrderData>;
    order(orderRate: string, orderAmount: string): Promise<KucoinOrderIdData>;
    cancelOrder(orderId: string): Promise<KucoinCancelOrderData>;
    cancelOrders(symbol: string, orderIds: string[]): Promise<KucoinCancelOrderData>;
    isOrderData(obj: any): obj is KucoinOrderData;
}



class Kucoin implements KucoinImplement {
    _baseUrl: string;
    _symbol: string;
    _orderSide: OrderSide;
    _returnUniqueId?: string;
    _dryRun: boolean;
    private _apiPassphrase: string = ''
    private _apiSecretKey: string = ''
    private _apiKey: string = ''
    constructor(symbol: string, orderSide: OrderSide, apiConf:{[key:string]: string}, dryRun: boolean, baseUrl: string = '') {
        this._baseUrl = (baseUrl !== undefined && baseUrl !== '') ? baseUrl : 'https://api.kucoin.com/api'
        this._symbol = symbol
        this._orderSide = orderSide
        this._dryRun = dryRun
        if (apiConf['passphrase'] !== undefined && apiConf['passphrase'] !== '') {
            this._apiPassphrase = apiConf['passphrase']
        }
        if (apiConf['secretKey'] !== undefined && apiConf['secretKey'] !== '') {
            this._apiSecretKey = apiConf['secretKey']
        }
        if (apiConf['apiKey'] !== undefined && apiConf['apiKey'] !== '') {
            this._apiKey = apiConf['apiKey']
        }
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
        const jsonDataStr: string =  (Object.keys(params).length > 0) ? JSON.stringify(params) : ''
        const payload = `${timestamp}${method}/api${path}${jsonDataStr}`
        return {
            'KC-API-KEY': this._apiKey,
            'KC-API-SIGN': this.generateSignature(this._apiSecretKey, payload),
            'KC-API-TIMESTAMP': timestamp + '',
            'KC-API-PASSPHRASE': this.generatePassphrase(this._apiSecretKey, this._apiPassphrase),
            'KC-API-KEY-VERSION': '2',
            'Content-Type': 'application/json'
        }
    }

    generateParameters(params: {[key: string]: any}): {[key: string]: string} {
        const result: { [key: string]: string } = {}
        for(const [key, value] of Object.entries(params)) {
            if (typeof value === 'string') {
                if (key === 'symbol' && this.symbol !== '') {
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
            if (value !== '') {
                if (result !== '') {
                    result += '&'
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
        returnTarget: U = 'data' as U,
    ): Promise<T[U]> {
        try {
            let response: HttpResponse | undefined;
            if (method === 'GET') {
                response = await httpGet(endPoint, headers);
            } else if (method === 'POST') {
                response = await httpPost(endPoint, headers, parameters);
            } else if (method === 'DELETE') {
                response = await httpDelete(endPoint, headers, parameters);
            } else {
                throw new Error('Not supported method');
            }

            if (response === undefined) {
                throw new Error('Response is undefined');
            }
            const checkResponse = JSON.parse(response.Body)
            if (!checkDataExist(checkResponse, returnTarget.toString())) {
                return checkResponse[returnTarget] as T[U];
            }
            const toObj = checkResponse as T;
            return toObj[returnTarget];
        }catch (e) {
            console.error(e)
            throw e;
        }
    }
    async getMarketList(): Promise<KucoinMarketListData|undefined> {
        try {
            const endPoint = `${this.baseUrl}/v1/markets`
            return await this.commonResponseProcess<KucoinMarketList, 'data'>(endPoint, 'GET')
        }catch (e) {
            throw e;
        }
    }

    async getMarketInfo(market: string): Promise<KucoinMarketInfoData[]|undefined> {
        try {
            const endPoint = `${this.baseUrl}/v2/symbols?market=${market}`
            return await this.commonResponseProcess<KucoinMarketInfo, 'data'>(endPoint, 'GET')
        }catch (e) {
            throw e;
        }
    }

    async getMarketStatus(currency: string): Promise<KucoinMarketStatusData|undefined> {
        try {
            const endPoint = `${this.baseUrl}/v2/currencies/${currency}`
            return await this.commonResponseProcess<KucoinMarketStatus, 'data'>(endPoint, 'GET')
        }catch (e) {
            throw e;
        }
    }

    async getTicker(symbol: string): Promise<KucoinTickerData> {
        try {
            const endPoint = `${this.baseUrl}/v1/market/orderbook/level1?symbol=${symbol}`
            return await this.commonResponseProcess<KucoinTicker, 'data'>(endPoint, 'GET')
        }catch (e) {
            throw e;
        }
    }

    async getTradeFee(symbols: string): Promise<KucoinTradeFeeData[]> {
        try {
            const path = `/v1/trade-fees?symbols=${symbols}`
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('GET', path)
            return await this.commonResponseProcess<KucoinTradeFee, 'data'>(endPoint, 'GET', headers)
        }catch (e) {
            throw e;
        }
    }

    async getTradeHistory(symbol: string): Promise<KucoinTradeHistoryData[]> {
        try {
            const path = `/v1/market/histories?symbol=${symbol}`
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('GET', path)
            return await this.commonResponseProcess<KucoinTradeHistory, 'data'>(endPoint, 'GET', headers)
        }catch (e) {
            throw e;
        }
    }

    async getAccounts(): Promise<KucoinAccountInfoData[]> {
        try {
            const path = `/v1/accounts`
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('GET', path)
            return await this.commonResponseProcess<KucoinAccountInfo, 'data'>(endPoint, 'GET', headers)
        }catch (e) {
            throw e;
        }
    }

    async getCoinAmount(symbol: string): Promise<string> {
        try {
            const transfer = await this.getTransfer(symbol, 'TRADE')
            if (transfer === undefined) {
                throw new Error('Transfer is undefined')
            }
            return transfer.available
        }catch (e) {
            throw e;
        }
    }

    async getTransfer(coinName: string, transferType: string): Promise<KucoinTransferData> {
        try {
            const path = `/v1/accounts/transferable?currency=${coinName}&type=${transferType}`
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('GET', path)
            return await this.commonResponseProcess<KucoinTransfer, 'data'>(endPoint, 'GET', headers)
        }catch (e) {
            throw e;
        }
    }

    async innerTransfer(coinName: string, amount: string, fromAc: string = '', toAc: string = ''): Promise<KucoinOrderIdData> {
        try {
            let formatParams:{[key:string]:string} = {
                'amount': amount,
                'currency': coinName,
                'clientOid': generateUUID(),
            }
            if (fromAc !== '') formatParams['from'] = fromAc
            if (toAc !== '') formatParams['to'] = toAc

            if (this.dryRun) {
                console.info(`----- InnerTransfer ----- \n ${JSON.stringify(formatParams)}`)
                return {orderId: 'dryRun'}
            }
            const params = this.generateParameters(formatParams)
            const path = '/v2/accounts/inner-transfer'
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('POST', path, params)
            return await this.commonResponseProcess<KucoinSendOrder, 'data'>(endPoint, 'POST', headers, params)
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
            const marketInfo = await this.getMarketInfo('')
            if (marketInfo === undefined) {
                return enableCoins
            }
            for (const info of marketInfo) {
                if (!markets.includes(info.symbol)) continue
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
            const marketInfo = await this.getMarketInfo('')
            if (marketInfo === undefined) {
                return enableCoins
            }
            for (const info of marketInfo) {
                if (!markets[info.symbol]) continue
                if(!(markets[info.symbol]['orderAmount']) || !(markets[info.symbol]['orderBaseAmount'])) continue

                if (
                    Decimal.cmp(info.baseMinSize, markets[info.symbol]['orderAmount']) >= 0
                    || Decimal.cmp(info.baseMaxSize, markets[info.symbol]['orderAmount']) <= 0
                ) {
                    console.warn(`orderAmount is valid. ${info.symbol} orderAmount: ${markets[info.symbol]['orderAmount']} min: ${info.baseMinSize} max: ${info.baseMaxSize}`)
                    continue
                }

                if (Decimal.cmp(info.minFunds, markets[info.symbol]['orderBaseAmount']) >= 0) {
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

    async generateDepositAddress(coinName: string, chain: string = ''): Promise<KucoinDepositAddressData|undefined> {
        try {
            const path = `/v1/deposit-addresses`
            const endPoint = `${this.baseUrl}${path}`

            let formatParams: {[key:string]:string} = {'currency': coinName}
            if (chain !== '') formatParams['chain'] = chain

            const params = this.generateParameters(formatParams)
            const headers = this.getHeaders('POST', path, params)

            return await this.commonResponseProcess<KucoinDepositAddress, 'data'>(endPoint, 'POST', headers, params)
        }catch (e) {
            throw e;
        }
    }

    async getDepositAddress(coinName: string): Promise<KucoinDepositAddressData[]> {
        try {
            let path = `/v1/deposit-addresses`
            if (coinName !== '') path += `?currency=${coinName}`
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('GET', path)
            return await this.commonResponseProcess<KucoinDepositAddressList, 'data'>(endPoint, 'GET', headers)
        }catch (e) {
            throw e;
        }
    }

    async getUserInfo(): Promise<KucoinUserInfoData[]|undefined> {
        try {
            const path = `/v1/sub/user`
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('GET', path)
            return await this.commonResponseProcess<KucoinUserInfo, 'data'>(endPoint, 'GET', headers)
        }catch (e) {
            throw e;
        }
    }

    async getDepositHistory(param: {[key:string]: any}): Promise<KucoinDepositHistoryData> {
        try {
            let path = `/v1/deposits`
            const urlParams = this.generateUrlParameters(this.generateParameters(param))
            if (urlParams !== '') path += `?${urlParams}`
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('GET', path)
            return await this.commonResponseProcess<KucoinDepositHistory, 'data'>(endPoint, 'GET', headers)
        }catch (e) {
            throw e;
        }
    }

    async getOrderBook(symbol: string = this.symbol, level: number = 20): Promise<KucoinOrderBookData|undefined> {
        try {
            const path = `/v1/market/orderbook/level2_${level}?symbol=${symbol}`
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('GET', path)
            return await this.commonResponseProcess<KucoinOrderBook, 'data'>(endPoint, 'GET', headers)
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
        if (tradeType === 'limit') {
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

    formatOrders(items: KucoinOrderData[]): [{[key: string]: FormatOrder}, string[]] {
        let orders: {[key:string]: FormatOrder} = {}
        let cancelOrderIds: string[] = []
        for (const v of items) {
            const pairSymbol = v.symbol
            const symbols = pairSymbol.split('-')
            const fromAmount = (v.side === 'buy') ? v.dealFunds : v.dealSize
            const toAmount = (v.side === 'buy') ? v.dealSize : v.dealFunds
            const fromCoin = (v.side === 'buy') ? symbols[1] : symbols[0]
            const toCoin = (v.side === 'buy') ? symbols[0] : symbols[1]
            let orderStatus: OrderStatus = OrderStatus.InProcess
            if (v.size === v.dealSize) orderStatus = OrderStatus.Done
            if (v.cancelExist) orderStatus = OrderStatus.Cancel

            if (v.id in orders) {
                orders[v.id] = {
                    symbol: pairSymbol,
                    orderType: v.type,
                    orderSide: v.side === 'buy' ? OrderSide.Buy : OrderSide.Sell,
                    fromCoin:    fromCoin,
                    toCoin:      toCoin,
                    orderRate:   Decimal.toDec(v.price),
                    orderFee:    Decimal.toDec(v.fee),
                    fromAmount:  Decimal.toDec(fromAmount),
                    toAmount:    Decimal.toDec(toAmount),
                    orderStatus: orderStatus,
                }
            } else {
                orders[v.id].fromAmount = Decimal.add(orders[v.id].fromAmount, fromAmount)
                orders[v.id].toAmount = Decimal.add(orders[v.id].toAmount, toAmount)
                orders[v.id].orderFee = Decimal.add(orders[v.id].orderFee, v.fee)
            }
        }
        return [orders, cancelOrderIds]
    }

    async getOrder(orderId: string): Promise<KucoinOrderData> {
        try{
            const path = `/v1/orders/${orderId}`
            const endPoint = `${this.baseUrl}${path}`
            const headers = this.getHeaders('GET', path)
            return await this.commonResponseProcess<KucoinOrder, 'data'>(endPoint, 'GET', headers)
        } catch (e) {
            console.error(e)
            throw e
        }
    }

    async getOrders(params: {[key:string]: any}): Promise<KucoinOrderData[]> {
        let items: KucoinOrderData[] = []
        try{
            if ('orderIds' in params) {
                for (const v of params['orderIds']) {
                    const order = await this.getOrder(v)
                    if (this.isOrderData(order)) items.push(order)
                }
            } else {
                const urlParameters = this.generateUrlParameters(params)
                let path = '/v1/orders'
                if (urlParameters !== '') path = `${path}?${urlParameters}`
                const endPoint = `${this.baseUrl}${path}`
                const headers = this.getHeaders('GET', path)
                const orderData = await this.commonResponseProcess<KucoinOrderList, 'data'>(endPoint, 'GET', headers)
                items = orderData.items
            }
            if (items.length === 0) throw new Error('getOrders failed')
            // const [orders, cancelOrderIds] = this.formatOrders(items)
            return items
        }catch (e) {
            console.error(e)
            throw e
        }
    }

    async getFormatOrder(orderId: string): Promise<{[key:string]: FormatOrder}> {
        const order = await this.getOrder(orderId)
        const [formatOrders, _] = this.formatOrders([order])
        return formatOrders
    }

    async getFormatOrders(params: {[key:string]: any}): Promise<[{[key:string]: FormatOrder}, string[]]> {
        const orders = await this.getOrders(params)
        return  this.formatOrders(orders)
    }

    async getCancelOrder(symbol: string, tradeType: string, orderIds: string[]): Promise<KucoinOrderData> {
        const orderIdsTxt = orderIds.join(',')
        const params:{[key: string]: string} = {'symbol': symbol, 'tradeType': tradeType, 'orderIds': orderIdsTxt}
        const urlParameters = this.generateUrlParameters(this.generateParameters(params))
        const path = `v1/stop-order?${urlParameters}`
        const endPoint = `${this.baseUrl}${path}`
        const headers = this.getHeaders('GET', path)
        return this.commonResponseProcess<KucoinOrder, 'data'>(endPoint, 'GET', headers)
    }

    async order(orderRate: string, orderAmount: string): Promise<KucoinOrderIdData> {
        const param = {
            'symbol': this.symbol,
            'side': this.orderSide,
            'size': orderAmount,
            'price': orderRate,
            'type': 'limit',
            'clientOid': generateUUID()
        }
        const path = 'v1/orders'
        const endPoint = `${this.baseUrl}${path}`
        const parameters = this.generateParameters(param)
        const headers = this.getHeaders('POST', path, parameters)
        return this.commonResponseProcess<KucoinSendOrder, 'data'>(endPoint, 'POST', headers, parameters)
    }

    async cancelOrder(orderId: string): Promise<KucoinCancelOrderData> {
        const path = `v1/orders/${orderId}`
        const endPoint = `${this.baseUrl}${path}`
        const headers = this.getHeaders('DELETE', path)
        return this.commonResponseProcess<KucoinCancelOrder, 'data'>(endPoint, 'DELETE', headers)
    }

    async cancelOrders(symbol: string, orderIds: string[]): Promise<KucoinCancelOrderData> {
        let params: {[key: string]: string} = {'symbol': symbol, 'tradeType': 'TRADE'}
        if (orderIds.length > 0) params['orderIds'] = orderIds.join(',')
        const urlParameters = this.generateUrlParameters(this.generateParameters(params))
        const path = `v1/stop-order/cancel?${urlParameters}`
        const endPoint = `${this.baseUrl}${path}`
        const headers = this.getHeaders('DELETE', path)
        return this.commonResponseProcess<KucoinCancelOrder, 'data'>(endPoint, 'DELETE', headers)
    }

    isOrderData(obj: any): obj is KucoinOrderData {
        return (
            obj &&
            typeof obj.id === 'string' &&
            typeof obj.symbol === 'string' &&
            typeof obj.opType === 'string' &&
            typeof obj.type === 'string' &&
            typeof obj.side === 'string' &&
            typeof obj.price === 'string' &&
            typeof obj.size === 'string' &&
            typeof obj.funds === 'string' &&
            typeof obj.dealFunds === 'string' &&
            typeof obj.dealSize === 'string' &&
            typeof obj.fee === 'string' &&
            typeof obj.feeCurrency === 'string' &&
            typeof obj.stp === 'string' &&
            typeof obj.stop === 'string' &&
            typeof obj.stopTriggered === 'boolean' &&
            typeof obj.stopPrice === 'string' &&
            typeof obj.timeInForce === 'string' &&
            typeof obj.postOnly === 'boolean' &&
            typeof obj.hidden === 'boolean' &&
            typeof obj.iceberg === 'boolean' &&
            typeof obj.visibleSize === 'string' &&
            typeof obj.cancelAfter === 'number' &&
            typeof obj.channel === 'string' &&
            typeof obj.clientOid === 'string' &&
            typeof obj.remark === 'string' &&
            typeof obj.tags === 'string' &&
            typeof obj.isActive === 'boolean' &&
            typeof obj.cancelExist === 'boolean' &&
            typeof obj.createdAt === 'number' &&
            typeof obj.tradeType === 'string'
        );
    }

}


export { Kucoin }