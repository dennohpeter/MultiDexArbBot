import axios from "axios";
import { config } from "../../config";
import { Quote } from "../types/1inch";
import { toHex } from "../utils";
import { Aggr } from "./aggr";

export class OneInch extends Aggr {
    constructor() {
        super(`1Inch`, `https://api.1inch.exchange/v3.0/`);
    }
    /**
     * Gets the best exchange rate for a given pair
     * @param srcToken - from token
     * @param toToken - to token
     * @param srcAmount - from token amount
     * @param side - trade direction i.e buy or sell
     * @returns best quote found
     */
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
    /**
     * Builds a tx based on the given params
     * @param srcToken - from Token
     * @param toToken - to Token
     * @param srcAmount - from Token amount
     * @param slippage - slippage tolerance
     * @returns tx data that can be send to the network
     */
    buildTx = async (params: { srcToken: string, toToken: string, srcAmount: number | string, slippage?: number, gasLimit?: string }) => {
        const { srcToken, toToken, srcAmount, slippage, gasLimit } = params;
        try {
            let defaultSlippage = 0.5
            console.log(defaultSlippage)
            const { data }: any = await axios({
                method: "GET",
                url: `${this.API_URL}${config.NETWORK.ID}/swap?fromTokenAddress=${srcToken}&toTokenAddress=${toToken}&amount=${srcAmount}&fromAddress=${config.WALLET.PUBLIC_KEY}&disableEstimate=true&slippage=${slippage ? `${slippage}` : defaultSlippage}`
            })
            delete data.tx.gasPrice; //ethersjs will find the gasPrice needed   
            delete data.tx.gas;

            if (gasLimit) {
                data.tx.gasLimit = toHex(parseInt(gasLimit))
            }

            data.tx["value"] = toHex(parseInt(data.tx["value"]))

            return data
        } catch (error: any) {
            throw new Error(JSON.stringify(error));
        }
    }

    /**
     * Gets supported protocols by 1inch price aggregator
     * @returns Supported protocols by 1inch price aggregator
     */
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

    /**
     * Approves spender to trade the given amount of a token
     * @param tokenAddress address of the token to approve 
     * @param amount amount of the the quantity to approve: default is infinity
     * @returns approve data that can be send to the network
     */
    approve = async (tokenAddress: string, amount?: string) => {
        try {
            const { data }: any = await axios({
                method: "GET",
                url: `${this.API_URL}${config.NETWORK.ID}/approve/calldata?tokenAddress=${tokenAddress}`
            })
            console.log(data)
            delete data.gasPrice; //ethersjs will find the gasPrice needed   
            delete data.gas;

            data["value"] = toHex(parseInt(data["value"]))
            return data
        } catch (error: any) {
            throw new Error(error);
        }
    }

}