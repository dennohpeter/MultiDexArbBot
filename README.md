#### MultiDexArbBot

This is an arbitrage bot that uses existing price aggregators such as `1inch` to get the best exchange rates across different decentralized exchanges on different blockchains and ecosystems.

#### INSTALL && RUN

- Clone our repo

```
   git clone git@github.com:dennohpeter/MultiDexArbBot.git
```

- cd into `MultiDexArbBot`

```
    cd MultiDexArbBot
```

- Install all the dependencies

```
    yarn install
```

- Rename `example.env` to `.env`

```
    mv example.env .env
```

- Update `.env` to contain your trading preferences and wallet info such private and public key

To receive trade notifications on telegram, you need to create a telegram bot at

[BotFather](https://t.me/BotFather). Send `/start` and follow prompts to create a tg bot, finally copy the Token the one below `Use this token to access the HTTP API:`
and set it to be the bot token value

For Mongo DB you need to install mongodb for your OS according to this [guide](https://www.mongodb.com/docs/manual/installation/#mongodb-installation-tutorials)

- Finally run the app by

```
    yarn start
```

#### TODO:

- I will be releasing a series of more robust and stable versions of arbitrage bots soon
