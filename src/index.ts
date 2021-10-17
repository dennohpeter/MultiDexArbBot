import chalk from "chalk";
import { connect } from "mongoose";
import { schedule } from "node-cron";
import { config } from "../config";
import { OneInch } from "./lib";
import { Quote, Direction } from "./types";
const chalkTable = require('chalk-table');
import BigNumber from "bignumber.js";
import { buildTradeMsg, flat, sendMessage } from "./utils";
import { MONITORED_TOKENS } from "./data/token";
import { Approve, User } from "./models";
import { bot } from "./lib/bot";

const Main = async () => {
    const oneInch = new OneInch()
    console.log('Starting...');
    console.log(`---`.repeat(10));

    try {
        bot.stop()
    }
    catch (err) {
    }

    console.log('Connecting to telegram bot...\n---');
    await bot.launch().then((result) => {
        console.log('Connected to telegram bot ✅✅✅');

    }).catch(async (err) => {
        let error = JSON.parse(JSON.stringify(err))
        console.log('Telegram Error:', error?.message);

    }).catch((error: any) => {
        console.log('Telegram error:', error);
    })

    console.log(`---`.repeat(10));
    console.log('Connecting to MongoDb...\n---');
    const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        keepAlive: true,
        connectTimeoutMS: 60000,
        socketTimeoutMS: 60000,
    }

    await connect(config.DB_URL, options).then((result) => {
        console.log("Connected to MongoDb :) ✅✅✅");
    }).catch(async (err) => {
        let error = JSON.parse(JSON.stringify(err))
        console.log('Mongo Error:', error);
    });
    console.log(`---`.repeat(10));

    await oneInch.getProtocols()
        .then((protocols: string[]) => {
            console.log(`Finding the best route for trade on: ${protocols.join(', ')}...👀👀👀`);
        })
        .catch((err: any) => { })

    console.log(`---`.repeat(10));

    let ethInAmount = new BigNumber(config.ETH_IN_AMOUNT).shiftedBy(18).toString()
    let on_cooldown = false
    let message = ''
    let users = await User.find({ is_active: true })

    schedule(`*/${config.PRICE_CHECK_INTERVAL_IN_SECONDS} * * * * *`, async function () {
        console.log(`***`.repeat(10));
        MONITORED_TOKENS.forEach(async (token: any) => {
            try {
                const buy_quote: Quote = await oneInch.getQuote({
                    srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    toToken: token.address,
                    srcAmount: ethInAmount
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
                let eth_out = parseFloat(new BigNumber(sell_quote.toAmount).shiftedBy(-sell_quote.toToken.decimals!).toFixed(6))

                const profit_pct = ((eth_out - config.ETH_IN_AMOUNT) / config.ETH_IN_AMOUNT) * 100
                let token_out = parseFloat(new BigNumber(token_amount).shiftedBy(-buy_quote.toToken.decimals!).toFixed(6))
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
                if (JSON.stringify(best_buy_protocols) != JSON.stringify(best_sell_protocols)) {
                    console.log(table);


                    if (profit_pct >= config.PROFIT_THRESHOLD.BUY && !on_cooldown) {
                        let nonce: number = await oneInch.getNonce()
                        console.log(`Nonce:`, nonce);

                        on_cooldown = true
                        /**
                         * Start of Buy => Approve? => Sell Txs
                         */
                        try {

                            console.log(`Initiating a buy for token ${token.symbol} ...`);
                            // build  buy Tx
                            let txData = await oneInch.buildTx({
                                srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                                toToken: token.address,
                                srcAmount: ethInAmount,
                                slippage: config.SLIPPAGE
                            })
                            console.log(`Buy Tx Data:`, txData);

                            // send a buy Tx
                            nonce += 1;
                            oneInch.sendTx({
                                data: txData.tx,
                                nonce
                            }).then(async (tx: any) => {
                                if (tx.hash) {

                                    console.log('Tx hash for buy:', tx.hash)
                                    // build Buy Tg Msg
                                    // message = await buildTradeMsg({ data: tx, profit_pct: profit_pct, side: Direction.BUY })
                                    // send Msg to Tg
                                    // sendMessage(users, message);

                                    try {
                                        /**
                                         *  Approve Token if it has not been approved before and save it to db
                                         */
                                        // approve if token has not been approved
                                        const token_is_approved = await Approve.exists({ token: token })
                                        if (!token_is_approved) {
                                            // approve if not approved
                                            message = `Approving ${token.name}...`
                                            sendMessage(users, message)
                                            let txData = await oneInch.approve(token.address)
                                            nonce += 1;
                                            await oneInch.sendTx({
                                                data: txData.tx,
                                                nonce
                                            }).then((tx: any) => {
                                                console.log(`${token.symbol} has been approved successfully.`)
                                                sendMessage(users, message)
                                            }).catch((err) => {
                                                console.log(`Error: `, err)
                                            });
                                        }


                                        /**
                                         * Get the balance of  the bought token shpuld be atleast be 1/2 of what was expected
                                         */

                                        let tries = 0
                                        let tokenBalance = '0'
                                        while (tries < 2000) {
                                            tokenBalance = await oneInch.balanceOf(token.address)
                                            if (parseInt(tokenBalance) > parseInt(new BigNumber(token_amount).multipliedBy(0.5).toString())) {
                                                break
                                            }
                                            tries++
                                        }
                                        /**
                                         * End of Balance Check
                                         */

                                        /**
                                         * Sell the bought tokens/assets to the exchange with the best rates
                                         */
                                        message = `Initiating a sell for token ${token.symbol}...`
                                        // build  Sell Tx
                                        let txData = await oneInch.buildTx({
                                            srcToken: token.address,
                                            toToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                                            srcAmount: tokenBalance,
                                            slippage: config.SLIPPAGE
                                        })
                                        console.log(`Sell Tx Data:`, txData);

                                        // send the sell Tx
                                        nonce += 1;
                                        oneInch.sendTx({
                                            data: txData.tx,
                                            nonce,
                                            gasLimit: config.GAS_LIMIT
                                        }).then(async (tx: any) => {
                                            if (tx.hash) {
                                                console.log(`Tx for Sell:`, tx.hash)
                                                // build Sell Tg Msg
                                                // message = await buildTradeMsg({ data: tx, profit_pct: profit_pct, side: Direction.SELL })
                                                // send Msg to Tg
                                                // sendMessage(users, message);

                                                // unlock to continue trading
                                                on_cooldown = true

                                            }
                                        }).catch((err) => {
                                            console.log(`Error:`, err)

                                            // unlock to continue trading
                                            on_cooldown = true
                                        })

                                        /**
                                         * End of Sell Tx
                                         */

                                    }
                                    catch (error) {
                                        console.error(`Error:`, error)
                                    }
                                }
                            }
                            ).catch((err: any) => {

                                console.log(`Error:`, err);

                                // unlock to continue trading
                                on_cooldown = true
                            });


                        } catch (error) {
                            console.error(`Error:`, error)
                        }
                        /**
                        * End of Buy => Approve? => Sell Txs
                        */

                    }
                }


            } catch (error: any) {
                // console.error('Error:', error);
            }

        });
    })

}


Main()