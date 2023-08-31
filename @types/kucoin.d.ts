enum OrderStatus {
    InProcess = 'in_process',
    Cancel = 'cancel',
    Finish = 'finish',
}

type CommonResponse = {
    code: string
    msg: string
}

type KucoinMarketListData = string[];

type KucoinMarketList = CommonResponse & {
    data: KucoinMarketListData
}

type KucoinMarketInfoData = {
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

type KucoinMarketInfo = CommonResponse & {
    data: KucoinMarketInfoData[]
}

type KucoinMarketStatusData = {
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

type KucoinMarketStatus = CommonResponse & {
    data: KucoinMarketStatusData
}

type KucoinTickerData = {
    sequence: string
    bestAsk: string
    size: string
    price: string
    bestBidSize: string
    bestBid: string
    bestAskSize: string
    time: number
}

type KucoinTicker = CommonResponse & {
    data: KucoinTickerData
}

type KucoinTradeFeeData = {
    symbol: string,
    takerFeeRate: string,
    makerFeeRate: string
}

type KucoinTradeFee = CommonResponse & {
    data: KucoinTradeFeeData[]
}

type KucoinTradeHistoryData = {
    sequence: string,
    price: string,
    size: string,
    side: string,
    time: number
}

type KucoinTradeHistory = CommonResponse & {
    data: KucoinTradeHistoryData[]
}

type KucoinAccountInfoData = {
    id: string,
    currency: string,
    type: string,
    balance: string,
    available: string,
    holds: string
}

type KucoinAccountInfo = CommonResponse & {
    data: KucoinAccountInfoData[]
}

type KucoinOrderBookData = {
    time: number,
    sequence: string,
    bids: string[][],
    asks: string[][]
}

type KucoinOrderBook = CommonResponse & {
    data: KucoinOrderBookData
}

type KucoinTransferData = {
    currency: string,
    balance: string,
    available: string,
    holds: string,
    transferable: string
}

type KucoinTransfer = CommonResponse & {
    data: KucoinTransferData
}

type KucoinOrderIdData = {
    orderId: string
}
type KucoinSendOrder = CommonResponse & {
    data: KucoinOrderIdData
}

type KucoinCancelOrderData = {
    cancelledOrderIds: string[]
}

type KucoinCancelOrder = CommonResponse & {
    data: KucoinCancelOrderData
}

type KucoinOrderData = {
    id: string
    symbol: string
    opType: string
    type: string
    side: string
    price: string
    size: string
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

type KucoinOrder = CommonResponse & {
    data: KucoinOrderData
}

type KucoinOrderDataList = {
    currentPage: number
    pageSize: number
    totalNum: number
    totalPage: number
    items: KucoinOrderData[]
}

type KucoinOrderList = CommonResponse & {
    data: KucoinOrderDataList
}

type KucoinInnerTransfer = CommonResponse & {
    data: KucoinOrderIdData
}

type KucoinDepositAddressData = {
    address: string,
    memo: string,
    chain: string
}

type KucoinDepositAddress = CommonResponse & {
    data: KucoinDepositAddressData
}

type KucoinDepositAddressList = CommonResponse & {
    data: KucoinDepositAddressData[]
}

type KucoinUserInfoData = {
    userId: string,
    uid: number,
    subName: string,
    type: number,
    remarks: string,
    access: string,
}

type KucoinUserInfo = CommonResponse & {
    data: KucoinUserInfoData[]
}

type KucoinDepositHistoryDataItem = {
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

type KucoinDepositHistoryData = {
    currentPage: number,
    pageSize: number,
    totalNum: number,
    totalPage: number,
    items: KucoinDepositHistoryDataItem[]
}

type KucoinDepositHistory = CommonResponse & {
    data: KucoinDepositHistoryData
}
