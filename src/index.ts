import md from "markdown-it";
import oniguruma from "vscode-oniguruma";
import * as ts from "typescript";
import { tokenize } from "./test";
export function markdownType(code: string, errorCode?: string){
  try {
    console.log(tokenize(code))
    return `<div class="mermaid">${code}</div>`;

  } catch (err) {
    return `<code>${code}</code>`;
  }
}


export function markdownTypePlugIn(md: md, opts: Record<string, any>) {
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