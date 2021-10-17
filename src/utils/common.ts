import BigNumber from "bignumber.js"
import { config } from "../../config"
import { bot } from "../lib/bot"
import { UserDoc } from "../models"
import { Direction } from "../types"

export const flat = async (arr: any, start: number = 0, end: number = 3): Promise<Array<any>> => {
    if (start < end) {
        start += 1
        return flat([].concat(...arr), start)
    }
    return arr
}

export const toHex = (value: number) => {
    return `0x${value.toString(16)}`
}
export const humanizeBalance = async (balance: string | number, decimals: number) => {
    return new BigNumber(balance).shiftedBy(-decimals).toString()
}

export const buildTradeMsg = async (params: { data: any, profit_pct: number, side: Direction }): Promise<string> => {
    const { data, profit_pct, side } = params

    let dexes = (await flat(data.protocols)).map((quote: any) => quote.name).join(', ')
    let msg = `* NEW TRADE NOTIFICATION *\n-- - `
    msg += `\n*Direction:* ${side}`
    if (side == Direction.SELL) {

        msg += `\n*Token Amount:* ${await humanizeBalance(data.fromTokenAmount, data.fromToken.decimals)}`
        msg += `\n*Token:* ${data.fromToken.name}`
        msg += `\n*ETH Amount:* ${await humanizeBalance(data.toTokenAmount, data.toToken.decimals)}`
    } else {
        msg += `\n*ETH Amount:* ${await humanizeBalance(data.fromTokenAmount, data.fromToken.decimals)}`
        msg += `\n*Token Amount:* ${await humanizeBalance(data.toTokenAmount, data.toToken.decimals)}`
        msg += `\n*Token:* ${data.fromToken.name}`
    }
    msg += `\n*Profit PCT:* ${profit_pct.toFixed(6)}%`
    msg += `\n*Dex:* ${dexes}`
    msg += `\n*Gas Limit:* ${data.gasLimit}`
    msg += `\n*Hash:* [${data.hash.toUpperCase()}](${config.EXPLORER}${data.hash})`

    return msg
}

export const sendMessage = async (users: UserDoc[], message: string) => {

    users.map(async (user: UserDoc) => {
        try {
            await bot.telegram.sendMessage(user.tg_id, message
                .replaceAll("_", "\\_")
                .replaceAll("|", "\\|")
                .replaceAll(".", "\\.")
                .replaceAll("{", "\\{")
                .replaceAll("+", "\\+")
                .replaceAll("}", "\\}")
                .replaceAll("=", "\\=")
                .replaceAll(">", "\\>")
                .replaceAll("<", "\\<")
                .replaceAll("-", "\\-")
                .replaceAll("!", "\\!"),
                { parse_mode: 'MarkdownV2', disable_web_page_preview: true })
        } catch (error) {
            console.log(error);

        }
    }
    )
}