import vsctm from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';
let tsGrammar: vsctm.IGrammar;
import ts from "./tmLanguage.plite?raw";
import wasmBin from "vscode-oniguruma/release/onig.wasm?raw";

async function getGrammar() {
    // const bufferA=new ArrayBuffer(wasmBin)
    const buffer=Buffer.from(wasmBin)
    const vscodeOnigLib = oniguruma.loadWASM(buffer).then(() => ({
        createOnigScanner: (source: string[]) => {
            return new oniguruma.OnigScanner(source);
        },
        createOnigString: (str: string) => {
            return new oniguruma.OnigString(str);
        },
    }));
    const registry = new vsctm.Registry({
        onigLib: vscodeOnigLib,
        loadGrammar: (scopeName) => {
            if (scopeName === 'source.ts') {
                return Promise.resolve(vsctm.parseRawGrammar(ts));
            } else {
                throw new Error(`Unknown scopeName: ${scopeName}.`);
            }
        },
    });
    tsGrammar = (await registry.loadGrammar('source.ts'))!;
}
export function tokenize(code: string) {
    const lines = code.split(/[\n\r]/);
    const linesToken: vsctm.ITokenizeLineResult[] = [];
    let ruleStack = vsctm.INITIAL;
    for (let i = 0; i < lines.length; i++) {
        linesToken.push(tsGrammar.tokenizeLine(lines[i], ruleStack));
    }
    return linesToken;
}