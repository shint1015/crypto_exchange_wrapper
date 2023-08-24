import { isObjectEmpty } from "./utils.js";
import { Logger } from "./logger.js";

export type HttpResponse = {
    Status: string
    StatusCode: number
    Headers: Headers
    Body: string
}

const logger = new Logger("dev", "request")

async function httpRequest(method: string, url: string, headers?: {[key: string]: string}, parameters?: {[key: string]: any}): Promise<HttpResponse> {
    try{
        const req = new Request(url, {
            method: method,
            body: !isObjectEmpty(parameters) ? JSON.stringify(parameters): undefined
        });
        if (headers !== undefined && !isObjectEmpty(headers)) {
            for (const [key, value] of Object.entries(headers || {})) {
                req.headers.set(key, value);
            }
        }
        const response = await fetch(req);
        if (!response.ok) {
            const resJson = await response.json()
            throw new Error(`HTTP Error: Status:${response.status} - ${response.statusText} : ${resJson}`)
        }
        const responseData = await response.json();

        // レスポンスデータをResponse型にマッピングして返す
        return <HttpResponse>{
            Status: `${response.status} - ${response.statusText}`,
            StatusCode: response.status,
            Headers: response.headers,
            Body: JSON.stringify(responseData),
        };
    } catch (error) {
        await logger.error(`Request Error: ${error}`)
        throw error
    }
}


async function httpGet(url: string, headers?: {[key: string]: string}, parameters?: {[key: string]: any}): Promise<any> {
    try {
        return await httpRequest('GET', url, headers, parameters);
    }catch (error) {
        await logger.error(`GET Request Error: ${error}`)
        throw error
    }
}


async function httpPost(url: string, headers?: {[key: string]: string}, parameters?: {[key: string]: any}): Promise<any> {
    try {
        return await httpRequest('POST', url, headers, parameters);
    }catch (error) {
        await logger.error(`POST Request Error: ${error}`)
        throw error
    }
}


async function httpPut(url: string, headers?: {[key: string]: string}, parameters?: {[key: string]: any}): Promise<any> {
    try {
        return await httpRequest('PUT', url, headers, parameters);
    }catch (error) {
        await logger.error(`PUT Request Error: ${error}`)
        throw error
    }
}


async function httpDelete(url: string, headers?: {[key: string]: string}, parameters?: {[key: string]: any}): Promise<any> {
    try {
        return await httpRequest('DELETE', url, headers, parameters);
    }catch (error) {
        await logger.error(`DELETE Request Error: ${error}`)
        throw error
    }
}

export {httpGet, httpPost, httpPut, httpDelete}