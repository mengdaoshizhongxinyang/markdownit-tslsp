
import { computePosition, autoUpdate, flip, shift, offset, inline } from '@floating-ui/dom';
function isString(val:unknown):val is string{
  return typeof val=='string'
}
type DisplaySymbol = string | [string, string];
const lsInfoAttrName = `ls-info`;
class InfoElement {
  private el: HTMLElement;

  private pre: HTMLElement;

  private list: HTMLElement[] = [];

  private cleanup?: () => void;

  constructor() {
    const el = document.createElement('div');
    const pre = document.createElement('pre');

    el.setAttribute('class', 'ls-info-box');
    el.setAttribute('style', 'opacity: 0');
    el.appendChild(pre);

    this.el = el;
    this.pre = pre;
  }

  private setInfo(infos: DisplaySymbol[]) {
    const { list, pre } = this;

    while (this.list.length > infos.length) {
      pre.removeChild(this.list.pop()!);
    }

    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];

      let text: HTMLElement;

      if (list[i]) {
        text = list[i];
      } else {
        text = document.createElement('span');
        list.push(text);
        pre.appendChild(text);
      }

      if (isString(info)) {
        text.removeAttribute('class');
        text.textContent = info;
      } else {
        text.setAttribute('class', info[0]);
        text.textContent = info[1];
      }
    }
  }

  hidden() {
    const { el } = this;

    if (document.body.contains(el)) {
      el.setAttribute('style', 'opacity: 0');
      document.body.removeChild(el);
    }

    this.cleanup?.();
    this.cleanup = undefined;
  }

  show(reference: HTMLElement, infos: DisplaySymbol[]) {
    if (!document.body.contains(this.el)) {
      document.body.appendChild(this.el);
    }

    const updatePosition = () => {
      computePosition(reference, this.el, {
        placement: 'top-start',
        strategy: 'fixed',
        middleware: [
          flip(),
          shift(),
          inline(),
          offset({
            crossAxis: 0,
            mainAxis: 14,
          }),
        ],
      }).then(({ x, y }) => {
        this.el.setAttribute('style', `left: ${x}px; top: ${y}px`);
      });
    };

    this.setInfo(infos);
    this.cleanup = autoUpdate(reference, this.el, updatePosition);
  }
}

export function active() {
  const infoEle = new InfoElement();
  const elHasInfo = document.querySelectorAll<HTMLElement>(`span[${lsInfoAttrName}]`);
  console.log(elHasInfo)
  const hiddenEvent = () => infoEle.hidden();

  for (const el of Array.from(elHasInfo)) {
    const infoStr = el.getAttribute(lsInfoAttrName) ?? '';
    const infoData = JSON.parse(decodeURI(infoStr));

    // 生产模式需要移除语言服务信息
    if (process.env.NODE_ENV === 'production') {
      el.setAttribute(lsInfoAttrName, '');
    }

    if (!infoData) {
      break;
    }

    el.addEventListener('mouseenter', () => {
      infoEle.show(el, infoData);
    });

    el.addEventListener('mouseleave', hiddenEvent);
  }

  return () => {
    infoEle.hidden();

    /**
     * 为什么不移除元素列表的事件，详细见
     * https://stackoverflow.com/questions/6033821/do-i-need-to-remove-event-listeners-before-removing-elements
     */
  };
}

