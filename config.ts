if (!process.env.BOT_TOKEN && !process.env.INFURA_API_KEY && !process.env.PUBLIC_KEY && !process.env.PRIVATE_KEY && !process.env.ETH_IN_AMOUNT && !process.env.DB_URL) {

    throw new Error("BOT_TOKEN, && INFURA_API_KEY && PUBLIC_KEY && PRIVATE_KEY && ETH_IN_AMOUNT && DB_URL, Must be defined in your .env file");
}
export const config = {
    BOT_TOKEN: process.env.BOT_TOKEN!,
    WALLET: {
        PUBLIC_KEY: process.env.PUBLIC_KEY!,
        PRIVATE_KEY: process.env.PRIVATE_KEY!
    },
    PROVIDERS: {
        INFURA_API_KEY: process.env.INFURA_API_KEY!
    },
    NETWORK: {
        ID: process.env.NETWORK_ID || 1 // 1 eth, 56 is bsc, 137 polygon, 10 optimism, 42161 arbitrum
    },
    PROFIT_THRESHOLD: {   // profit % you atleast want
        BUY: 2,
        SELL: 2
    },
    SLIPPAGE: 0.5,
    GAS_LIMIT: process.env.GAS_LIMIT!,
    EXPLORER: process.env.EXPLORER || 'https://etherscan.io/',
    PRICE_CHECK_INTERVAL_IN_SECONDS: process.env.PRICE_CHECK_INTERVAL_IN_SECONDS || 45,
    ETH_IN_AMOUNT: parseFloat(process.env.ETH_IN_AMOUNT!),
    DB_URL: process.env.DB_URL!

}