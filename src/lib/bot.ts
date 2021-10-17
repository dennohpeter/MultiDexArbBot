import { Context, Telegraf } from 'telegraf'
import { Update, Message } from 'typegram';
import { config } from '../../config';
import { User, UserAttrs } from '../models';

/**
 * 
 * @param params.id User's telegram id;
 * @param params.is_bot User type;
 * @param params.first_name User's first name; 
 * @param params.last_name User's last name; 
 * @param params.username User's telegram username;
 * @returns userObject
 */
const getOrCreateUser = async (context: Context<{ message: Update.New & Update.NonChannel & Message.TextMessage; update_id: number; }> & Omit<Context<Update>, keyof Context<Update>>) => {

    const params = context.message?.from ? context?.message?.from : context.update?.message.from


    const { id, is_bot, first_name, last_name, username } = params

    const user = await User.findOne({ tg_id: id, bot_name: context.me })

    if (user) {
        return user
    } else {

        const new_user = new User({
            tg_id: id,
            is_bot: is_bot,
            is_active: await User.exists({ tg_id: id }),
            first_name: first_name,
            last_name: last_name,
            username: username,
            bot_name: context.me

        })
        await new_user.save()

        return await User.findOne({ tg_id: id })
    }
}
/**
 * Bot
 */
let bot: Telegraf = new Telegraf(config.BOT_TOKEN)

/** middlewares */
bot.use(async (ctx: any, next) => {
    try {
        const user = (await getOrCreateUser(
            ctx.message?.from ? ctx : ctx
        )) as UserAttrs;

        if (!user.is_active) {
            return ctx.reply(`Please contact @dennohpeter to activate your account.`);
        } else {
            await next();
            return;
        }
    }
    catch (error) {
        console.log(error);

    }
});

bot.start(async (ctx: any) => {
    const user = (await getOrCreateUser(ctx)) as UserAttrs
    const defaultMessage = `Hello ${user?.username ? user.username : user?.last_name}, welcome to ${ctx.me}`
    return ctx.reply(defaultMessage)
})
bot.on('text', async (ctx: any) => {
    const user = await (getOrCreateUser(ctx)) as UserAttrs
})

export { bot }


