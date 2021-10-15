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

    sendTx = async (params: { data: any, nonce: number }) => {
        const { data, nonce } = params
        try {

            if (!isNaN(nonce)) {
                data.nonce = nonce
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
     * @returns nonce
     */
    getNonce = async (): Promise<number> => {
        return await this.provider.getTransactionCount(config.WALLET.PUBLIC_KEY)
    }
}