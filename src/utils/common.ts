export const flat = async (arr: Array<any>, start: number = 0, end: number = 3): Promise<Array<any>> => {
    if (start < end) {
        start += 1
        return flat([].concat(...arr), start)
    }
    return arr
}