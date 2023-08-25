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


export {isObjectEmpty,generateHMAC, generateUUID}
