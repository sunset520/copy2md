// ==UserScript==
// @name         HEXO2MD
// @namespace    zlh
// @version      0.1
// @description  将 HEXO 复制为 MD
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
    let hexo2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('mathjax_math', {
            filter: function (node, options) {
                return node.nodeName === 'SCRIPT' && (node.getAttribute('type') === 'math/tex; mode=display' || node.getAttribute('type') === 'math/tex');
            },
            replacement: function (content, node, options) {
                let mathText = node.innerText;
                if (node.getAttribute('type') === 'math/tex') {
                    return '$' + mathText + '$';
                }
                else {
                    return '\n$$\n' + mathText + '\n$$\n';
                }
            }
        });
        turndownService.addRule('rm_math_unused', {
            filter: function (node, options) {
                return node.nodeName === 'DIV' && node.getAttribute('class') === 'MathJax_Display' || node.nodeName === 'SPAN' && node.getAttribute('class') === 'MathJax';
            },
            replacement: function (content, node, options) {
                return "";
            }
        });
        let md = getMarkdown(turndownService, ['h1.post-title'], ['div.post-body']);
        return md;
    };
    const md = hexo2md();
    GM_setClipboard(md);
})();