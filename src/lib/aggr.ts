import { ethers, Wallet } from "ethers";
import { config } from "../../config";

export abstract class Aggr {
    readonly name: string;
    readonly provider: ethers.providers.JsonRpcProvider;
    readonly account: Wallet
    readonly API_URL: string

    constructor(name: string, api_url: string) {
        this.name = name;
        this.provider = new ethers.providers.JsonRpcProvider(config.PROVIDERS.INFURA_API_KEY)
        this.account = new Wallet(config.WALLET.PRIVATE_KEY, this.provider);
        this.API_URL = api_url
    }
    /**
     * Sends a tx to the blockchain
     * @param data - Tx data 
     * @param nonce - wallet current nonce 
     * @returns Tx hash if successful else error message
     */
    sendTx = async (params: { data: any, gasLimit?: string, nonce: number }) => {
        const { data, gasLimit, nonce } = params
        try {

            // if (!isNaN(nonce)) {
            //     data.nonce = nonce + 1
            // }
            if (gasLimit) {
                data.gasLimit = gasLimit
            }

            const tx = await this.account.sendTransaction(data)
            return tx
            console.log("Tx success");
        } catch (e) {
            throw new Error(`Tx failure ${e}`);
        }
    }

    /**
     * Gets balance of a token in a wallet address
     * @param tokenAddress token address to check to check balance
     * @returns balance of token in a wallet
     */
    balanceOf = async (tokenAddress: string) => {
        let contract = new ethers.Contract(
            tokenAddress,
            ['function balanceOf(address account) external view returns (uint256)'],
            this.account
        )
        return await contract.balanceOf(config.WALLET.PUBLIC_KEY);

    }

    /**
     * Gets the current nonce of a wallet
     * @returns  wallet's current nonce
     */
    getNonce = async (): Promise<number> => {
        return await this.account.getTransactionCount()
    }
}