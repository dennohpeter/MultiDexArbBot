import axios from "axios";
import { config } from "../../config";
import { Quote } from "../types/1inch";
import { Aggr } from "./aggr";

export class OneInch extends Aggr {
    constructor() {
        super(`1Inch`, `https://api.1inch.exchange/v3.0/`);
    }
    getQuote = async (params: { srcToken: string, toToken: string, srcAmount: number | string, side?: string }): Promise<Quote> => {
        const { srcToken, toToken, srcAmount, side } = params
        try {
            const { data }: any = await axios({
                method: 'GET',
                url: `${this.API_URL}${config.NETWORK.ID}/quote?fromTokenAddress=${srcToken}&toTokenAddress=${toToken}&amount=${srcAmount}`
            })
            return {
                srcToken: data.fromToken,
                srcAmount: data.fromTokenAmount,
                toToken: data.toToken,
                toAmount: data.toTokenAmount,
                protocols: data.protocols
            }
        } catch (error: any) {
            throw new Error(JSON.stringify(error));

        }
    }
    buildTx = async (srcToken: string, toToken: string, srcAmount: number, slippage?: number): Promise<string> => {
        try {
            const { data } = await axios({
                method: "GET",
                url: `${this.API_URL}${config.NETWORK.ID}/swap?fromTokenAddress=${srcToken}&toTokenAddress=${toToken}&amount=${srcAmount}&fromAddress=${config.WALLET.PUBLIC_KEY}&disableEstimate=true${slippage ? `&slippage=${slippage}` : ''}`
            })
            return data
        } catch (error: any) {
            throw new Error(JSON.stringify(error));
        }
    }

    getProtocols = async (): Promise<string[]> => {
        try {
            const { data }: any = await axios({
                method: "GET",
                url: `${this.API_URL}${config.NETWORK.ID}/protocols`
            })
            return data.protocols

        } catch (error) {
            throw new Error(JSON.stringify(error));
        }
    }

}