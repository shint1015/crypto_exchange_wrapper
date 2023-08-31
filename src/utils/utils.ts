import * as crypto from 'crypto';

function isObjectEmpty(obj?: {[key: string]: any}): boolean {
    if (obj === undefined) {
        return true
    }
    return Object.keys(obj).length === 0;
}

function generateHMAC(secretKey: string, message: string): string {
    const key = Buffer.from(secretKey);
    const messageBytes = Buffer.from(message, 'utf-8')
    const hmac = crypto.createHmac('sha256', key)
    hmac.update(messageBytes)
    const hmacBytes = hmac.digest()
    return hmacBytes.toString('base64')
}

function generateUUID(): string {
    return crypto.randomUUID().replace(/-/g, '');
}

const isType = (obj: any, type: string): boolean => {
    return obj !== null && typeof obj === type
}

const checkDataExist = (obj: {[key: string]: any}, targetColumn: string): boolean => {

    if (!obj.hasOwnProperty(targetColumn)) return false

    if (Array.isArray(obj[targetColumn])) return obj[targetColumn].length > 0

    if (isType(obj, 'object')) return Object.keys(obj[targetColumn]).length > 0

    if (isType(obj[targetColumn], 'string')) return obj[targetColumn] !== ''

    return false
}


export {isObjectEmpty,generateHMAC, generateUUID, checkDataExist, isType}
