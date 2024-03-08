// ==UserScript==
// @name         COPY2MD
// @namespace    zlh
// @version      0.1
// @description  将网页复制为 MD
// @author       zlh
// @match        *://*/*
// @require      https://unpkg.com/turndown/dist/turndown.js
// @require      https://unpkg.com/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js
// @grant        GM_setClipboard
// @run-at       context-menu
// ==/UserScript==
(function () {
    'use strict';
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
    const gfm = turndownPluginGfm.gfm;
    const tables = turndownPluginGfm.tables;
    const strikethrough = turndownPluginGfm.strikethrough;
    // 获取 Markdown 内容
    let getMarkdown = function (turndownService, titleSelectors, contentSelectors) {
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
    };

    const plain = {
        titleSelectors: ['title', 'h1'],
        contentSelectors: ['body'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const zhihu = {
        titleSelectors: ['article.Post-Main header.Post-Header h1.Post-Title', 'div.AuthorInfo-head'],
        contentSelectors: ['article.Post-Main div.Post-RichTextContainer', 'span.RichText'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'zhihu_math',
            content: {
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
            }
        }, {
            key: 'zhihu_img',
            content: {
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
            }
        }]
    };

    const csdn = {
        titleSelectors: ['h1#articleContentId'],
        contentSelectors: ['div#content_views'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'csdn_katex_math',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'SPAN' && (node.classList.contains('katex--inline') || node.classList.contains('katex--display'));
                },
                replacement: function (content, node, options) {
                    let mathText = node.querySelectorAll('span.katex-mathml')[0].innerText;
                    let mathLines = mathText.split('  ');
                    let mathFormula = mathLines[0].trim();
                    for (let line of mathLines) {
                        line = line.trim();
                        if (line === "") {
                            continue;
                        }
                        else {
                            mathFormula = line;
                        }
                    }
                    let unusedText = node.querySelectorAll('span.katex-html')[0].innerText;
                    let index = 0;
                    for (let c of unusedText) {
                        if (c === ' ') {
                            continue;
                        }
                        else {
                            while (true) {
                                if (mathFormula[index] === ' ') {
                                    index++;
                                }
                                else {
                                    break;
                                }
                            }
                            if (c === mathFormula[index]) {
                                index++;
                            }
                            else {
                                break;
                            }
                        }
                    }
                    if (node.classList.contains('katex--inline')) {
                        return '$' + mathFormula.substr(index, mathFormula.length - 1).trim() + '$';
                    }
                    else {
                        return '\n$$\n' + mathFormula.substr(index, mathFormula.length - 1).trim() + '\n$$\n';
                    }
                }
            }
        }, {
            key: 'csdn_mathjax_math',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'SCRIPT' && node.hasAttribute('type') && (node.getAttribute('type') === 'math/tex; mode=display' || node.getAttribute('type') === 'math/tex');
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
            }
        }]
    };

    const aliyun = {
        titleSelectors: ['h1.article-title'],
        contentSelectors: ['div.article-inner'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'aliyun_block_code',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'PRE';
                },
                replacement: function (content, node, options) {
                    return '\n' + options.fence + '\n' + node.innerText + '\n' + options.fence + '\n';
                }
            }
        }]
    };

    const tencent = {
        titleSelectors: ['h2.title-text', 'h1.J-articleTitle', 'h1.article-title'],
        contentSelectors: ['div.rno-markdown', 'div.J-articleContent'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'tencent_math',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'SPAN';
                },
                replacement: function (content, node, options) {
                    let name = node.parentNode.nodeName;
                    if (name === 'FIGURE') {
                        return "\n$$\n" + node.innerText + "\n$$\n";
                    }
                    else {
                        return '$' + node.innerText + '$';
                    }
                }
            }
        }, {
            key: 'tencent_rm_copy_button',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'BUTTON';
                },
                replacement: function (content, node, options) {
                    return "";
                }
            }
        }]
    };

    const juejin = {
        titleSelectors: ['h1.article-title'],
        contentSelectors: ['div.markdown-body'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'juejin_rm_style',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'STYLE';
                },
                replacement: function (content, node, options) {
                    return "";
                }
            }
        }, {
            key: 'juejin_math',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'IMG' && node['alt'].length > 0;
                },
                replacement: function (content, node, options) {
                    let name = node.parentNode.nodeName;
                    if (name === 'FIGURE') {
                        return "\n$$\n" + node['alt'] + "\n$$\n";
                    }
                    else {
                        return "$" + node['alt'] + "$";
                    }
                }
            }
        }]
    };

    const cnblogs = {
        titleSelectors: ['h1.postTitle'],
        contentSelectors: ['div#cnblogs_post_body'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'cnblogs_math',
            content: {
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
            }
        }, {
            key: 'cnblogs_rm_math_unused',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'DIV' && node.getAttribute('class') === 'MathJax_Display' || node.nodeName === 'SPAN' && node.getAttribute('class') === 'MathJax';
                },
                replacement: function (content, node, options) {
                    return "";
                }
            }
        }]
    };

    const jianshu = {
        titleSelectors: ['h1[title]'],
        contentSelectors: ['article'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'jianshu_math',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'IMG' && node.outerHTML.search("math") != -1;
                },
                replacement: function (content, node, options) {
                    if (node.outerHTML.search("math-inline") != -1) {
                        return '$' + node.outerHTML.replace(/^.*?alt="(.*?) *?".*?$/, "$1") + '$';
                    }
                    if (node.outerHTML.search("math-block") != -1) {
                        return '\n$$\n' + node.outerHTML.replace(/^.*?alt="(.*?) *?".*?$/, "$1") + '\n$$\n';
                    }
                }
            }
        }]
    };

    const planetmath = {
        titleSelectors: [],
        contentSelectors: ['article.ltx_document'],
        options: basicOptions,
        plugins: [],
        rules: [{
            key: 'planetmath_math',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'math';
                },
                replacement: function (content, node, options) {
                    var myplanetmathstr = node.getAttribute('alttext');
                    var tempstr = "";
                    if (node.getAttribute('display') === 'block') {
                        tempstr = '\n$$\n' + myplanetmathstr + '\n$$\n';
                        return tempstr;
                    }
                    if (node.getAttribute('display') === 'inline') {
                        tempstr = '$' + myplanetmathstr + '$';
                        return tempstr;
                    }
                    tempstr = '$' + myplanetmathstr + '$';
                    return tempstr;
                }
            }
        }, {
            key: 'planetmath_rm_script',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'SCRIPT';
                },
                replacement: function (content, node, options) {
                    return "";
                }
            }
        }, {
            key: 'planetmath_rm_mjx-math',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'SPAN' && node.getAttribute('class') === 'mjx-math ltx_Math';
                },
                replacement: function (content, node, options) {
                    return "";
                }
            }
        }]
    };

    const oschina = {
        titleSelectors: ['h1.article-box__title'],
        contentSelectors: ['div.content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const segmentfault = {
        titleSelectors: ['h1'],
        contentSelectors: ['article.article-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'segmentfault_block_code',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'PRE';
                },
                replacement: function (content, node, options) {
                    return '\n' + options.fence + '\n' + node.innerText + '\n' + options.fence + '\n';
                }
            }
        }]
    };

    const writebug = {
        titleSelectors: ['div.title', 'h2.heading'],
        contentSelectors: ['div.milkdown div'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const luogu = {
        titleSelectors: ['h2.article-content-post-title', 'div.mdui-typo-display-1-opacity'],
        contentSelectors: ['div#article-content', 'div.mdblog-article-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const cxymm = {
        titleSelectors: ['h2[style="line-height: 32px;"]'],
        contentSelectors: ['div.htmledit_views'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const srcmini = {
        titleSelectors: ['h1.article-title'],
        contentSelectors: ['article.article-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const _51cto = {
        titleSelectors: ['div.article-title h1'],
        contentSelectors: ['div.article-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: '_51cto_block_code',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'PRE';
                },
                replacement: function (content, node, options) {
                    return '\n' + options.fence + '\n' + node.innerText + '\n' + options.fence + '\n';
                }
            }
        }]
    };

    const cbiancheng = {
        titleSelectors: ['h1'],
        contentSelectors: ['div#arc-body'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'cbiancheng_block_code',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'PRE';
                },
                replacement: function (content, node, options) {
                    return '\n' + options.fence + '\n' + node.innerText + '\n' + options.fence + '\n';
                }
            }
        }]
    };

    const infoq = {
        titleSelectors: ['h1.article-title'],
        contentSelectors: ['div.article-preview'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'infoq_rm_copy_div',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'DIV' && node.hasAttribute('data-codeblock-copy');
                },
                replacement: function (content, node, options) {
                    return "";
                }
            }
        }]
    };

    const imooc = {
        titleSelectors: ['h1.detail-title'],
        contentSelectors: ['div.detail-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'imooc_rm_showmore_div',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'DIV' && node.className === 'showMore';
                },
                replacement: function (content, node, options) {
                    return "";
                }
            }
        }]
    };

    const sspai = {
        titleSelectors: ['div.title'],
        contentSelectors: ['div.content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const leetcode = {
        titleSelectors: ['h1.css-izy0el-Title'],
        contentSelectors: ['div.css-eojhts-StyledMarkdown'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'leetcode_block_code',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'PRE';
                },
                replacement: function (content, node, options) {
                    return '\n' + options.fence + '\n' + node.innerText + '\n' + options.fence + '\n';
                }
            }
        }]
    };

    const baidu = {
        titleSelectors: ['h1'],
        contentSelectors: ['div.markdown-body'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const learnku = {
        titleSelectors: ['h1'],
        contentSelectors: ['div.markdown-body'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const helloworld = {
        titleSelectors: ['p.blog-title'],
        contentSelectors: ['div.content-body'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const itpub = {
        titleSelectors: ['h1.preview-title', 'h3'],
        contentSelectors: ['div.preview-main', '.content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const iotword = {
        titleSelectors: ['h1.entry-title'],
        contentSelectors: ['div.entry-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const hackertalk = {
        titleSelectors: ['h1'],
        contentSelectors: ['div.markdown-body'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const bytedance = {
        titleSelectors: ['h1'],
        contentSelectors: ['article.tui-editor-contents'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const bmabk = {
        titleSelectors: ['h1.entry-title'],
        contentSelectors: ['div.bpp-post-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const ctyun = {
        titleSelectors: ['h1'],
        contentSelectors: ['div.detail-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const huaweicloud = {
        titleSelectors: ['h1.cloud-blog-detail-title'],
        contentSelectors: ['div.cloud-blog-detail-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const alipay = {
        titleSelectors: ['div.titleDec___3Fl0L'],
        contentSelectors: ['div.yuque-servicify-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const cfanz = {
        titleSelectors: ['p.title'],
        contentSelectors: ['article'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const cvmart = {
        titleSelectors: ['div.title-text'],
        contentSelectors: ['div.markdown-body'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const weixin = {
        titleSelectors: ['h1#activity-name'],
        contentSelectors: ['div#js_content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const haicoder = {
        titleSelectors: ['h1.title'],
        contentSelectors: ['div.markdown-body'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const coder = {
        titleSelectors: ['h1'],
        contentSelectors: ['div#content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const guyuehome = {
        titleSelectors: ['div.content-head h1'],
        contentSelectors: ['div.article-body'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };


    const jiguang = {
        titleSelectors: [],
        contentSelectors: ['section.article-body'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    // 这个网站代码是放在 table 里的
    // 有问题，以后修改
    const codenong = {
        titleSelectors: ['h1.entry-title'],
        contentSelectors: ['div.single-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };


    const freesion = {
        titleSelectors: ['div#main h2'],
        contentSelectors: ['div#article_content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const saikr = {
        titleSelectors: ['h1.circle-homepage-tit'],
        contentSelectors: ['div.para'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'saikr_math',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'SPAN' &&
                        node.className === 'math-tex';
                },
                replacement: function (content, node, options) {
                    return '$' + node.lastChild.innerText + '$';
                }
            }
        }]
    };

    const vsdiffer = {
        titleSelectors: ['h1'],
        contentSelectors: ['div#article-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };


    const mathcubic = {
        titleSelectors: ['div.article-box h2'],
        contentSelectors: ['div#article_content'],
        options: basicOptions,
        plugins: [gfm],
        rules: [{
            key: 'mathcubic_math',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'SCRIPT' && node.hasAttribute('type') && (node.getAttribute('type') === 'math/tex; mode=display' || node.getAttribute('type') === 'math/tex');
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
            }
        }, {
            key: 'mathcubic_rm_math_unused',
            content: {
                filter: function (node, options) {
                    return node.nodeName === 'DIV' && node.getAttribute('class') === 'MathJax_Display' || node.nodeName === 'SPAN' && node.getAttribute('class') === 'MathJax';
                },
                replacement: function (content, node, options) {
                    return "";
                }
            }
        }]
    };

    const bilibili = {
        titleSelectors: ['h1.title'],
        contentSelectors: ['div#article-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    const nodeseek = {
        titleSelectors: ['div.post-title'],
        contentSelectors: ['div.post-content'],
        options: basicOptions,
        plugins: [gfm],
        rules: []
    };

    function html2md(website) {
        let turndownService = new TurndownService(website.options);
        for (const plugin of website.plugins) {
            turndownService.use(plugin);
        }
        for (const rule of website.rules) {
            turndownService.addRule(rule.key, rule.content);
        }
        return getMarkdown(turndownService, website.titleSelectors, website.contentSelectors);
    }

    const html2mds = {
        'zhihu': zhihu
        , 'csdn': csdn
        , 'aliyun': aliyun
        , 'tencent': tencent
        , 'juejin': juejin
        , 'cnblogs': cnblogs
        , 'jianshu': jianshu
        , 'planetmath': planetmath
        , 'oschina': oschina
        , 'segmentfault': segmentfault
        , 'writebug': writebug
        , 'luogu': luogu
        , 'cxymm': cxymm
        , 'srcmini': srcmini
        , '51cto': _51cto
        , 'biancheng': cbiancheng
        , 'infoq': infoq
        , 'imooc': imooc
        , 'sspai': sspai
        , 'leetcode': leetcode
        , 'baidu': baidu
        , 'learnku': learnku
        , 'helloworld': helloworld
        , 'itpub': itpub
        , 'iotword': iotword
        , 'hackertalk': hackertalk
        , 'bytedance': bytedance
        , 'bmabk': bmabk
        , 'ctyun': ctyun
        , 'huaweicloud': huaweicloud
        , 'alipay': alipay
        , 'cfanz': cfanz
        , 'cvmart': cvmart
        , 'weixin': weixin
        , 'haicoder': haicoder
        , 'coder': coder
        , 'guyuehome': guyuehome
        , 'jiguang': jiguang
        , 'codenong': codenong
        , 'freesion': freesion
        , 'saikr': saikr
        , 'vsdiffer': vsdiffer
        , 'mathcubic': mathcubic
        , 'bilibili': bilibili
        , 'nodeseek': nodeseek
    };

    const info = window.location.host.toLowerCase();
    let website = plain;
    for (const key in html2mds) {
        if (info.includes(key)) {
            website = html2mds[key];
            break;
        }
    }
    const md = html2md(website);
    GM_setClipboard(md);
})();
 