# Scripts

## 简介

这是一些油猴脚本。

## 组成

- 将网页内容复制并转换为 Markdown 格式：
    - [copy2md.js](copy2md.js)
    - [hexo2md.js](hexo2md.js)
    - [hugo2md.js](hugo2md.js)
    - [copy2tex.js](copy2tex.js)
- 美化
    - [csdn.js](csdn.js)

## 代码解释

代码解释以 copy2md.js 为主。

```js
// 转换得到的 Markdown 的格式配置
const basicOptions = {
    headingStyle: 'atx', //'setext'|'atx'
    hr: '* * *', //'* * *'|'- - -'
    bulletListMarker: '-', //'*'|'+'|'-'
    codeBlockStyle: 'fenced', //'indented'|'fenced'
    fence: '```', //'```'|'~~~'
    emDelimiter: '*', //'_'|'*'
    strongDelimiter: '**', //'**'|'__'
    linkStyle: 'inlined', //'inlined'|'referenced'
    linkReferenceStyle: 'full', //'full'|'collapsed'|'shortcut'
    preformattedCode: false //false|true
};
```

对于每个网站，都可以配置这样一个转换的函数。可以自定义一些规则。

```js
let zhihu2md = function () {
    let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
    turndownService.addRule('all_math', {
        filter: function (node, options) {
            return node.nodeName === 'SPAN' && node.getAttribute('data-tex') !== null;
        },
        replacement: function (content, node, options) {
            // 注意多行公式与内联公式
            let dataTex = node.outerHTML.match(/data-tex="([^"]*)"/)[1].replaceAll('&amp;', '&');
            if (dataTex.indexOf("begin") !== -1) {
                return '\n$$\n' + dataTex + '\n$$\n';
            } else {
                return '$' + dataTex + '$';
            }
        }
    });
    turndownService.addRule('figure', {
        filter: function (node, options) {
            return node.nodeName === 'FIGURE';
        },
        replacement: function (content, node, options) {
            let imageSrc = node.querySelector("img").getAttribute("src");
            let description = "";
            let figCaption = node.querySelector("figcaption");
            if (figCaption !== null) {
                description = figCaption.textContent;
            }
            return '![](' + imageSrc + ')  \n' + description;
        }
    });
    let md = getMarkdown(turndownService, ['article.Post-Main header.Post-Header h1.Post-Title', 'div.AuthorInfo-head'], ['article.Post-Main div.Post-RichTextContainer', 'span.RichText']);
    return md;
};
```
