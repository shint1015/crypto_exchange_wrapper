import BigNumber from "bignumber.js";

export type decType = string | number | BigNumber;

export class Decimal {

    constructor(decimalPrecision?: number, roundingMode?: BigNumber.RoundingMode) {
        let config: {[key: string]: any} = {}
        if (decimalPrecision !== undefined) config.DECIMAL_PlACES = decimalPrecision
        if (roundingMode !== undefined) config.ROUNDING_MODE = roundingMode
        BigNumber.config(config)
    }

    // convert to BigNumber
    toDec(num: decType): BigNumber {
        return BigNumber(num);
    }

    // a + b
    add(a: decType, b: decType): BigNumber {
        return this.toDec(a).plus(this.toDec(b));
    }
    // a - b
    sub(a: decType, b: decType): BigNumber {
        return this.toDec(a).minus(this.toDec(b));
    }

    // a * b
    mul(a: decType, b: decType): BigNumber {
        return this.toDec(a).times(this.toDec(b));
    }

    // a / b
    div(a: decType, b: decType): BigNumber {
        return this.toDec(a).div(this.toDec(b));
    }

    // compare a and b
    cmp(a: decType, b: decType): number {
        return this.toDec(a).comparedTo(this.toDec(b));
    }

    dp(a: decType, dpNum: number, roundingMode= BigNumber.ROUND_DOWN): BigNumber {
        return BigNumber(a).dp(dpNum, roundingMode)
    }

    static toDec(num: decType): BigNumber {
        return BigNumber(num);
    }

    // a + b
    static add(a: decType, b: decType): BigNumber {
        return this.toDec(a).plus(this.toDec(b));
    }

    // a - b
    static sub(a: decType, b: decType): BigNumber {
        return this.toDec(a).minus(this.toDec(b));
    }

    // a * b
    static mul(a: decType, b: decType): BigNumber {
        return this.toDec(a).times(this.toDec(b));
    }

    // a / b
    static div(a: decType, b: decType): BigNumber {
        return this.toDec(a).div(this.toDec(b));
    }

    // compare a and b
    static cmp(a: decType, b: decType): number {
        return this.toDec(a).comparedTo(this.toDec(b));
    }
}