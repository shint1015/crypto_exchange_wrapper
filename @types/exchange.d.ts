enum ExchangeType {
    KuCoin = 'kucoin',
}

enum OrderSide {
    Buy = 'buy',
    Sell = 'sell',
}

type MarketInfoData = {
    symbol: string
    baseCoin: string
    quoteCoin: string
    baseCoinPrecision: string
    quoteCoinPrecision: string
    minOrderAmount: string
    maxOrderAmount: string
    minFunds: string
    enableTrading: boolean
}

// type UserInfoData = {
//     userId: string
//     uid: string
//     subName: string
//     type: string
//     remarks: string
//     access: string
// }

type CoinDetail = {
    coin: string
    name: string
    fullName: string
    precision: string
    confirms: string
}