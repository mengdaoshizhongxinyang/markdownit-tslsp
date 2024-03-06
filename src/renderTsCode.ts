import { escape } from "html-escaper";
import { tokenize } from "./tokenize";

const splitTag = `<span></span>`;
function addSplitLabelInSpace(tabCount: number, tabWidth: number, label = splitTag) {
  const space = Array(tabWidth).fill(' ').join('');
  return Array(tabCount).fill(`${label}${space}`).join('').trim();
}

function getTabCount(code: string, tabWidth: number) {
  const space = /^ */.exec(code);

  if (space) {
    return Math.ceil(space[0].length / tabWidth);
  } else {
    return 0;
  }
}
function addSplitLabel(code: string | string[], tabWidth: number, label = splitTag) {
  let currentTab = 0;

  const lines = Array.isArray(code) ? code : code.split('\n');
  const labeled = lines.map((line) => {
    const isSpace = line.trim().length === 0;

    if (isSpace) {
      return addSplitLabelInSpace(currentTab, tabWidth, label);
    } else {
      currentTab = getTabCount(line, tabWidth);
      return addSplitLabelInCode(line, tabWidth, label);
    }
  });
  return labeled;
}


export function getLineSpaceWidth(str: string) {
  const result = /^ +/.exec(str);
  return result ? result[0].length : 0;
}
function getMinSpaceWidth(str: string) {
  const result = str
    .trim()
    .split('\n')
    .reduce((ans, line) => {
      const space = getLineSpaceWidth(line);

      if (space <= 0) {
        return ans;
      }

      if (ans === 0 || space < ans) {
        return space;
      } else {
        return ans;
      }
    }, 0);

  const widths = [2, 4, 8, 16].sort((pre, next) => {
    const preRes = Math.abs(pre - result);
    const nextRes = Math.abs(next - result);

    return preRes < nextRes ? -1 : 1;
  });

  return widths[0];
}

function addSplitLabelInCode(code: string, tabWidth: number, label = splitTag) {
  const space = /^ */.exec(code);

  if (!space) {
    return code;
  }

  const chars = code.split('');

  let index = 0;
  let spaceIndex = 0;

  while (chars[index] === ' ') {
    if (index === 0 || spaceIndex === tabWidth) {
      chars.splice(index, 0, label);
      index++;
      spaceIndex = 1;
    } else {
      spaceIndex++;
    }

    index++;
  }

  return chars.join('');
}

export function renderTsCode(
  code: string,
  tabWith: number
) {
  const linesTokens = tokenize(code);
  const lineCodes = linesTokens.map((line) => {
    let code = '';

    for (const token of line) {
      if (token.class || token.info) {
        code += '<span';

        if (token.class) {
          code += ` class="${token.class}"`;
        }

        if (token.info) {
          code += `ls-info="${token.info}"`;
        }

        code += `>${escape(token.text)}</span>`;
      } else {
        code += escape(token.text);
      }
    }

    return code;
  });
  const lines=addSplitLabel(lineCodes, tabWith)
  return `
    <pre class="code-block-wrapper">
      <code class="code-block-list">
        <ul class="code-block-gutter">
          ${lines.map(item=>`<li>${item}</li>`).join('')}
        </ul>
      </code>
    </pre>
  `;
}