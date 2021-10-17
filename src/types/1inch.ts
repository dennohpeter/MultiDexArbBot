export interface Token {
    symbol: string,
    name: string,
    address: string,
    decimals?: number,
    logoURI?: string
}
export interface Quote {
    srcToken: Token,
    toToken: Token,
    srcAmount: string,
    toAmount: string,
    protocols: any
}