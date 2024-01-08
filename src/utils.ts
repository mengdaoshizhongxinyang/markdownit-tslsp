const uidLength = 16;
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const radix = alphabet.length
const array = new Uint32Array(uidLength)
function cmap<item, cb>(array: Array<item> | Uint32Array, callback: (v: item | number, i: number, array: Array<item> | Uint32Array) => cb) {
    let i = 0
    let length = array.length
    let result: Array<cb> = Array(length)
    for (; i < length; i++) {
        result[i] = callback(array[i], i, array)
    }
    return result
}
export function uid() {
    crypto.getRandomValues(array);
    return cmap(array, (value: number) => {
        return alphabet[value as number % radix]
    }).join('')
}
