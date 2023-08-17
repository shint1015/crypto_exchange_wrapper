enum ExchangeType {
    KuCoin = 'kucoin',
}

enum OrderSide {
    Buy = 'buy',
    Sell = 'sell',
}

type CommonResponse = {
    code: string
    msg: string
}

type MarketListData = string[];

type MarketList = CommonResponse & {
    data: MarketListData
}

type MarketInfoData = {
    symbol: string
    name: string
    baseCurrency: string
    quoteCurrency: string
    feeCurrency: string
    market: string
    baseMinSize: string
    quoteMinSize: string
    baseMaxSize: string
    quoteMaxSize: string
    baseIncrement: string
    quoteIncrement: string
    priceIncrement:string
    priceLimitRate: string
    isMarginEnabled: boolean
    minFunds: string
    enableTrading: boolean
}

type MarketInfo = CommonResponse & {
    data: MarketInfoData[]
}

type MarketStatusData = {
    currency: string
    name: string
    fullName: string
    precision: number
    confirms: { [key: string]: any }
    contractAddress: { [key: string]: any }
    isMarginEnabled: boolean
    isDebitEnabled: boolean
    chains: { [key: string]: any }
}

type MarketStatus = CommonResponse & {
    data: MarketStatusData
}

type TickerData = {
    sequence: string
    bestAsk: string
    size: string
    price: string
    bestBidSize: string
    bestBid: string
    bestAskSize: string
    time: number
}

type Ticker = CommonResponse & {
    data: TickerData
}

type TradeFeeData = {
    symbol: string,
    takerFeeRate: string,
    makerFeeRate: string
}

type TradeFee = CommonResponse & {
    data: TradeFeeData[]
}

type TradeHistoryData = {
    sequence: string,
    price: string,
    size: string,
    side: string,
    time: number
}

type TradeHistory = CommonResponse & {
    data: TradeHistoryData[]
}

type AccountInfoData = {
    id: string,
    currency: string,
    type: string,
    balance: string,
    available: string,
    holds: string
}

type AccountInfo = CommonResponse & {
    data: AccountInfoData[]
}

type OrderBookData = {
    time: number,
    sequence: string,
    bids: string[][],
    asks: string[][]
}

type OrderBook = CommonResponse & {
    data: OrderBookData
}

type TransferData = {
    currency: string,
    balance: string,
    available: string,
    holds: string,
    transferable: string
}

type Transfer = CommonResponse & {
    data: TransferData
}

type OrderIdData = {
    orderId: string
}
type SendOrder = CommonResponse & {
    data: OrderIdData
}

type CancelOrderData = {
    cancelledOrderIds: string[]
}

type CancelOrder = CommonResponse & {
    data: CancelOrderData
}

type OrderData = {
    id: string
    symbol: string
    opType: string
    type: string
    side: string
    price: string
    Size: string
    funds: string
    dealFunds: string
    dealSize: string
    fee: string
    feeCurrency: string
    stp: string
    stop: string
    stopTriggered: boolean
    stopPrice: string
    timeInForce: string
    postOnly: boolean
    hidden: boolean
    iceberg: boolean
    visibleSize: string
    cancelAfter: number
    channel: string
    clientOid: string
    remark: string
    tags: string
    isActive: boolean
    cancelExist: boolean
    createdAt: number
    tradeType: string
}

type Order = CommonResponse & {
    data: OrderData
}

type OrderDataList = {
    currentPage: number
    pageSize: number
    totalNum: number
    totalPage: number
    items: OrderData[]
}

type OrderList = CommonResponse & {
    data: OrderDataList
}

type InnerTransfer = CommonResponse & {
    data: OrderIdData
}

type DepositAddressData = {
    address: string,
    memo: string,
    chain: string
}

type DepositAddress = CommonResponse & {
    data: DepositAddressData
}

type DepositAddressList = CommonResponse & {
    data: DepositAddressData[]
}

type UserInfoData = {
    userId: string,
    uid: number,
    subName: string,
    type: number,
    remarks: string,
    access: string,
}

type UserInfo = CommonResponse & {
    data: UserInfoData[]
}

type DepositHistoryDataItem = {
    currency: string,
    chain: string,
    status: string,
    address: string,
    memo: string,
    isInner: boolean,
    amount: string,
    fee: string,
    walletTxId: string,
    createdAt: number,
    updatedAt: number,
    remark: string,
}

type DepositHistoryData = {
    currentPage: number,
    pageSize: number,
    totalNum: number,
    totalPage: number,
    items: DepositHistoryDataItem[]
}

type DepositHistory = CommonResponse & {
    data: DepositAddressData
}
