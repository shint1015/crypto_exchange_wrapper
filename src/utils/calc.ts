import BigNumber from "bignumber.js";

export type decType = string | number | BigNumber;

export class Decimal {
     public toDec(num: decType): BigNumber {
        return BigNumber(num);
    }
    public add(a: decType, b: decType): BigNumber {
        return this.toDec(a).plus(this.toDec(b));
    }

    public sub(a: decType, b: decType): BigNumber {
        return this.toDec(a).minus(this.toDec(b));
    }

    public mul(a: decType, b: decType): BigNumber {
        return this.toDec(a).times(this.toDec(b));
    }

    public div(a: decType, b: decType): BigNumber {
        return this.toDec(a).div(this.toDec(b));
    }

    public cmp(a: decType, b: decType): number {
        return this.toDec(a).comparedTo(this.toDec(b));
    }

    public static toDec(num: decType): BigNumber {
        return BigNumber(num);
    }
    public static add(a: decType, b: decType): BigNumber {
        return this.toDec(a).plus(this.toDec(b));
    }

    public static sub(a: decType, b: decType): BigNumber {
        return this.toDec(a).minus(this.toDec(b));
    }

    public static mul(a: decType, b: decType): BigNumber {
        return this.toDec(a).times(this.toDec(b));
    }

    public static div(a: decType, b: decType): BigNumber {
        return this.toDec(a).div(this.toDec(b));
    }

    public static cmp(a: decType, b: decType): number {
        return this.toDec(a).comparedTo(this.toDec(b));
    }
}