import BigNumber from "bignumber.js";

export type decType = string | number | BigNumber;

export class Decimal {

    constructor(decimalPrecision?: number, roundingMode?: BigNumber.RoundingMode) {
        let config: {[key: string]: any} = {}
        if (decimalPrecision !== undefined) config.DECIMAL_PlACES = decimalPrecision
        if (roundingMode !== undefined) config.ROUNDING_MODE = roundingMode
        BigNumber.config(config)
    }
     toDec(num: decType): BigNumber {
        return BigNumber(num);
    }
    add(a: decType, b: decType): BigNumber {
        return this.toDec(a).plus(this.toDec(b));
    }

    sub(a: decType, b: decType): BigNumber {
        return this.toDec(a).minus(this.toDec(b));
    }

    mul(a: decType, b: decType): BigNumber {
        return this.toDec(a).times(this.toDec(b));
    }

    div(a: decType, b: decType): BigNumber {
        return this.toDec(a).div(this.toDec(b));
    }

    cmp(a: decType, b: decType): number {
        return this.toDec(a).comparedTo(this.toDec(b));
    }

    static toDec(num: decType): BigNumber {
        return BigNumber(num);
    }
    static add(a: decType, b: decType): BigNumber {
        return this.toDec(a).plus(this.toDec(b));
    }

    static sub(a: decType, b: decType): BigNumber {
        return this.toDec(a).minus(this.toDec(b));
    }

    static mul(a: decType, b: decType): BigNumber {
        return this.toDec(a).times(this.toDec(b));
    }

    static div(a: decType, b: decType): BigNumber {
        return this.toDec(a).div(this.toDec(b));
    }

    static cmp(a: decType, b: decType): number {
        return this.toDec(a).comparedTo(this.toDec(b));
    }
}