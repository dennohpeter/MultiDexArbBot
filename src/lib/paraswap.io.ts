import axios from "axios";
import { config } from "../../config";
import { Quote } from "../types/1inch";
import { Aggr } from "./aggr";

export class ParaSwap extends Aggr {
    constructor() {
        super(`ParaSwap`, `https://apiv5.paraswap.io/`);
    }
    getQuote = async (srcToken: string, toToken: string, srcAmount: number): Promise<Quote> => {
        try {
            const { data }: any = await axios({
                method: 'GET',
                url: `${this.API_URL}price/?srcToken=${srcToken}&destToken=${toToken}&amount=${srcAmount}`
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
                url: `${this.API_URL}${config.NETWORK.ID}/swap?fromTokenAddress=${srcToken}&toTokenAddress=${toToken}&amount=${srcAmount}&fromAddress=${config.WALLET.PUBLIC_KEY}&disableEstimate=true&slippage=${slippage}`
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