declare module "*.plite"{
    const content:string
    export default content
}

declare module "*?raw"{
    const content:string
    export default content
}

declare module "*.wasm"{
    const content:ArrayBuffer
    export default content
}
