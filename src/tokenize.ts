import  vsctm from "vscode-textmate";
import  oniguruma from "vscode-oniguruma";

import { TsServer, getTsServer } from "./tsserver";

import { readFile } from "fs/promises";
import { getAccessor } from "./accessor";

interface Token extends vsctm.IToken {
  /** 距离整个代码开头的偏移 */
  offset: number;
  /** 原始字符串 */
  text: string;
  /** 渲染后的标签类名 */
  class?: string;
  /** 代码提示 */
  info?: string;
}
let i=1
const tsGrammar = getAccessor<vsctm.IGrammar>('tsGrammar');
let tsGrammars:vsctm.IGrammar
export async function getGrammar() {
  if (tsGrammar.get()) {
    return;
  }
  const wasmContent = await readFile("node_modules/vscode-oniguruma/release/onig.wasm");

  const vscodeOnigurumaLib: Promise<vsctm.IOnigLib> = (oniguruma).loadWASM(wasmContent.buffer).then(
    () =>
    ({
      createOnigScanner: (source: string[]) => new oniguruma.OnigScanner(source),
      createOnigString: (str: string) => new oniguruma.OnigString(str),
    } as any),
  );

  const registry = new vsctm.Registry({
    onigLib: vscodeOnigurumaLib,
    loadGrammar: async (scopeName) => {
      return vsctm.parseRawGrammar((await readFile("./src/tmLanguage.plite")).toString('utf-8'));
    },
  });

  const tsGrammarInstance = await registry.loadGrammar('source.ts');

  if (!tsGrammarInstance) {
    throw new Error('语法器加载失败');
  }
  tsGrammars=tsGrammarInstance

  tsGrammar.set(tsGrammarInstance);
}

/** 不需要获取语法提示的字符 */
const noInfoChar = Array.from('{}:();,+-*/.\'"=[]%`<>|^&~!')
  .concat(['=>', '**', '>>', '<<', '>>>', '&&', '||'])
  .concat(['==', '===', '!=', '!==', '>=', '<=', '++', '--'])
  .concat(['new', 'function'])
  .reduce((ans, item) => ((ans[item] = true), ans), {} as Record<string, boolean>);

/**
 * 分割行首 token
 * 行首的 token 如果有空格，则需要把空格和后面的内容分隔开
 */
function lineStartTokenSplit(token: Token) {
  if (token.startIndex !== 0 || !/^ +/.test(token.text) || /^ +$/.test(token.text)) {
    return [token];
  }

  const space = /^ +/.exec(token.text)!;
  const spaceToken: Token = {
    startIndex: 0,
    endIndex: space.length,
    offset: token.offset,
    scopes: [],
    text: space[0],
  };

  return [
    spaceToken,
    {
      startIndex: spaceToken.text.length,
      endIndex: token.endIndex,
      offset: token.offset + spaceToken.text.length,
      scopes: token.scopes,
      text: token.text.substring(spaceToken.text.length),
    },
  ];
}

function getClass(token: Token) {
  const valText = token.text.trim();

  if (valText.length === 0) {
    return;
  }

  return token.scopes
    .filter((item) => item !== 'source.ts')
    .map((item) => `lsp-${item.replace(/\.ts/, '').replace(/\./g, '-')}`)
    .join(' ');
}

function getInfo(server: TsServer, token: Token) {
  const innerText = token.text.trim();

  if (innerText.length === 0 || noInfoChar[innerText]) {
    return;
  }

  const tokenScope = token.scopes.join(' ');

  if (tokenScope.includes('meta.import.ts') && tokenScope.includes('string.quoted')) {
    return;
  }

  const info = server.getQuickInfoAtPosition(token.offset);
  if (!info) {
    return;
  }
  

  return info;
}

export function tokenize(code: string) {
  const server = getTsServer();
  const lines = code.split(/[\n\r]/);
  const linesToken: Token[][] = [];
  const grammar = tsGrammars
  if (!grammar) {
    throw new Error('语法器加载失败2');
  }

  server.setFile(code);

  
  

  let ruleStack = vsctm.INITIAL;
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineTokens = grammar.tokenizeLine(line, ruleStack);
    linesToken.push(
      lineTokens.tokens
        .map((token) =>
          lineStartTokenSplit({
            ...token,
            offset: token.startIndex + offset,
            text: line.substring(token.startIndex, token.endIndex),
          }),
        )
        .reduce((ans, token) => ans.concat(token), [])
        .map((token) => ({
          ...token,
          class: getClass(token),
          info: getInfo(server, token),
        })),
    );

    offset += line.length + 1;
    ruleStack = lineTokens.ruleStack;
  }
  
  return linesToken;
}