import md from "markdown-it";
import { getGrammar } from "./tokenize";
import { initTsServer } from "./tsserver";
import { Plugin } from "vite";
import { renderTsCode } from "./renderTsCode";

export function markdownType(code: string, errorCode?: string){
  try {
    return renderTsCode(code,2)
  } catch (err) {
    console.log(err)
    return `<code>${code}</code>`;
  }
}


export async function markdownTypePlugIn(md: md, opts: Record<string, any>) {
  const defaultRenderer = md.renderer.rules.fence!.bind(md.renderer.rules);
  md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
    const token = tokens[idx];
    const code = token.content.trim();
    if (token.info.startsWith('ts-type')) {
      return markdownType(code);
    } else {
      return defaultRenderer(tokens, idx, opts, env, self);
    }
  }
}

export function viteInitPlugin():Plugin{
  return {
    name:"ts-type-init",
    buildStart(){
      getGrammar()
      initTsServer()
    }
  }
}