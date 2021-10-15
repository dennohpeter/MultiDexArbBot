import chalk from "chalk";
import { connect } from "mongoose";
import { schedule } from "node-cron";
import { config } from "../config";
import { OneInch } from "./lib/1inch.io";
import { Quote, Token } from "./types/1inch";
const chalkTable = require('chalk-table');
import BigNumber from "bignumber.js";
import { flat } from "./utils";
import { MONITORED_TOKENS } from "./data/token";

const Main = async () => {
    const oneInch = new OneInch()
    console.log('Starting...');
    console.log(`---`.repeat(10));

    // try {
    //     bot.stop()
    // }
    // catch (err) {
    // }

    // console.log('Connecting to telegram bot...\n---');
    // await bot.launch().then((result) => {
    //     console.log('Connected to telegram bot!');

    // }).catch(async (err) => {
    //     let error = JSON.parse(JSON.stringify(err))
    //     console.log('Telegram Error:', error?.message);

    // }).catch((error: any) => {
    //     console.log('Telegram error:', error);
    // })

    // console.log(`---`.repeat(10));
    console.log('Connecting to MongoDb...\n---');
    const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        keepAlive: true,
        connectTimeoutMS: 60000,
        socketTimeoutMS: 60000,
    }

    await connect(config.DB_URL, options).then((result) => {
        console.log("Connected to MongoDb :)");
    }).catch(async (err) => {
        let error = JSON.parse(JSON.stringify(err))
        console.log('Mongo Error:', error?.name);
    });
    console.log(`---`.repeat(10));

    await oneInch.getProtocols()
        .then((protocols: string[]) => {
            console.log(`Finding the best route for trade on the following exchanges ${protocols.join(', ')}...`);
        })
        .catch((err: any) => { })

    console.log(`---`.repeat(10));

    let ethAmount = new BigNumber(config.ETH_IN_AMOUNT).shiftedBy(18).toString()
    schedule(`*/${config.PRICE_CHECK_INTERVAL_IN_SECONDS} * * * * *`, async function () {
        console.log(`***`.repeat(10));
        MONITORED_TOKENS.forEach(async (token: any) => {
            try {
                const buy_quote: Quote = await oneInch.getQuote({
                    srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    toToken: token.address,
                    srcAmount: ethAmount
                })
                let token_amount = buy_quote.toAmount
                const sell_quote: Quote = await oneInch.getQuote({
                    srcToken: token.address,
                    toToken: buy_quote.srcToken.address,
                    srcAmount: token_amount
                })

                const options = {
                    leftPad: 0,
                    columns: [
                        { field: "eth_in", name: chalk.cyan("ETH IN") },
                        { field: "buy_on_dex", name: chalk.green(`BEST BUY ROUTEs`) },
                        { field: "sell_on_dex", name: chalk.yellow("BEST SELL ROUTEs") },
                        { field: "token_amount", name: chalk.yellow("Token OUT") },
                        { field: "eth_out", name: chalk.yellow("ETH OUT") },
                        { field: "profit", name: chalk.yellow("PROFIT PCT") },
                        { field: "time", name: chalk.magenta("Time 📅") },
                        { field: "rate", name: chalk.blue("Fetch Rate 🕠") },
                    ]
                };
                const timestamp = new Date()
                let eth_out = parseFloat(new BigNumber(sell_quote.toAmount).shiftedBy(-sell_quote.toToken.decimals).toFixed(6))
                const profit_pct = ((eth_out - config.ETH_IN_AMOUNT) / config.ETH_IN_AMOUNT) * 100
                let token_out = parseFloat(new BigNumber(token_amount).shiftedBy(-buy_quote.toToken.decimals).toFixed(6))
                let best_buy_protocols = (await flat(buy_quote.protocols)).map((quote: any) => quote.name).join(',')
                let best_sell_protocols = (await flat(sell_quote.protocols)).map((quote: any) => quote.name).join(',')
                const table = chalkTable(options, [
                    {
                        eth_in: config.ETH_IN_AMOUNT,
                        buy_on_dex: best_buy_protocols,
                        sell_on_dex: best_sell_protocols,
                        token_amount: `${token_out} ${buy_quote.toToken.symbol}`,
                        eth_out: `${eth_out} ${sell_quote.toToken.symbol}`,
                        profit: `${profit_pct.toFixed(6)}%`,
                        time: timestamp.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        rate: `${config.PRICE_CHECK_INTERVAL_IN_SECONDS}s`
                    },
                ]);
                if (!(JSON.stringify(best_buy_protocols) == JSON.stringify(best_sell_protocols))) {
                    console.log(table);
                }

            } catch (error: any) {
                console.error('Error:', JSON.parse(JSON.stringify(error)).code);
            }

        });
    })

}


Main()