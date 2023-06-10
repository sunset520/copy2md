// ==UserScript==
// @name         HUGO2MD
// @namespace    zlh
// @version      0.1
// @description  将 HUGO 复制为 MD
// @author       zlh
// @match        *://*/*
// @require      https://unpkg.com/turndown/dist/turndown.js
// @require      https://unpkg.com/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js
// @grant        GM_setClipboard
// @run-at       context-menu
// ==/UserScript==
(function () {
    'use strict';
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
    function getMarkdown(turndownService, titleSelectors, contentSelectors) {
        let title = "";
        if (titleSelectors.length > 0) {
            for (const selector of titleSelectors) {
                const titleElement = document.querySelector(selector);
                if (titleElement) {
                    title = `# ${titleElement.innerText.trim()}\n\n`;
                    break;
                }
            }
        }
        let content = "";
        if (contentSelectors.length > 0) {
            for (const selector of contentSelectors) {
                const contentElement = document.querySelector(selector);
                if (contentElement) {
                    content = turndownService.turndown(contentElement.innerHTML);
                    break;
                }
            }
        }
        const markdown = `${title}${content}`;
        return markdown;
    }
    let hugo2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('block_code', {
            filter: function (node, options) {
                return node.nodeName === 'FIGURE' && node.classList.contains('hljs');
            },
            replacement: function (content, node, options) {
                const results = Array.from(node.querySelectorAll('td.code pre div.line'));
                const code_snippets = results.map(result => result.innerText).join('\n');
                return '\n' + options.fence + '\n' + code_snippets + '\n' + options.fence + '\n';
            }
        });
        let md = getMarkdown(turndownService, ['h1.post-title'], ['div.post-content']);
        return md;
    };
    const md = hugo2md();
    GM_setClipboard(md);
})();