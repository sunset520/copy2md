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
    // 获取 Markdown 内容
    let getMarkdown = function(turndownService, titleSelectors, contentSelectors) {
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
    let default2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['title'], ['body']);
        return md;
    };
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
    let csdn2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('katex_math', {
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
                        while(true){
                            if(mathFormula[index] === ' ') {
                                index++;
                            }
                            else {
                                break;
                            }
                        }
                        if(c===mathFormula[index]) {
                            index++;
                        }
                        else {
                            break;
                        }
                    }
                }
                if (node.classList.contains('katex--inline')) {
                    return '$' + mathFormula.substr(index, mathFormula.length-1).trim() + '$';
                }
                else {
                    return '\n$$\n' + mathFormula.substr(index, mathFormula.length-1).trim() + '\n$$\n';
                }
            }
        });
        turndownService.addRule('mathjax_math', {
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
        });
        let md = getMarkdown(turndownService, ['h1#articleContentId'], ['div#content_views']);
        return md;
    };
    let aliyun2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('block_code', {
            filter: function (node, options) {
                return node.nodeName === 'PRE';
            },
            replacement: function (content, node, options) {
                return '\n' + options.fence + '\n' + node.innerText + '\n' + options.fence + '\n';
            }
        });
        let md = getMarkdown(turndownService, ['h1.article-title'], ['div.article-inner']);
        return md;
    };
    let tencent2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('all_math', {
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
        });
        turndownService.addRule('rm_copy_button', {
            filter: function (node, options) {
                return node.nodeName === 'BUTTON';
            },
            replacement: function (content, node, options) {
                return "";
            }
        });
        let md = getMarkdown(turndownService, ['h2.title-text', 'h1.J-articleTitle', 'h1.article-title'], ['div.rno-markdown' ,'div.J-articleContent']);
        return md;
    };
    let juejin2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('rm_style', {
            filter: function (node, options) {
                return node.nodeName === 'STYLE';
            },
            replacement: function (content, node, options) {
                return "";
            }
        });
        turndownService.addRule('all_math', {
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
        });
        let md = getMarkdown(turndownService, ['h1.article-title'], ['div.markdown-body']);
        return md;
    };
    let cnblogs2md = function () {
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
        let md = getMarkdown(turndownService, ['h1.postTitle'], ['div#cnblogs_post_body']);
        return md;
    };
    let jianshu2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('all_math', {
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
        });
        let md = getMarkdown(turndownService, ['h1[title]'], ['article']);
        return md;
    };
    let planetmath2md = function () {
        let turndownService = new TurndownService(basicOptions).use([]);
        turndownService.addRule('all_math', {
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
        });
        turndownService.addRule('rm_script', {
            filter: function (node, options) {
                return node.nodeName === 'SCRIPT';
            },
            replacement: function (content, node, options) {
                return "";
            }
        });
        turndownService.addRule('rm_mjx-math', {
            filter: function (node, options) {
                return node.nodeName === 'SPAN' && node.getAttribute('class') === 'mjx-math ltx_Math';
            },
            replacement: function (content, node, options) {
                return "";
            }
        });
        let md = getMarkdown(turndownService, [], ['article.ltx_document']);
        return md;
    };
    let oschina2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1.article-box__title'], ['div.content']);
        return md;
    };
    let segmentfault2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('block_code', {
            filter: function (node, options) {
                return node.nodeName === 'PRE';
            },
            replacement: function (content, node, options) {
                return '\n' + options.fence + '\n' + node.innerText + '\n' + options.fence + '\n';
            }
        });
        let md = getMarkdown(turndownService, ['h1'], ['article.article-content']);
        return md;
    };
    let writebug2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['div.title', 'h2.heading'], ['div.milkdown div']);
        return md;
    };
    let luogu2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h2.article-content-post-title', 'div.mdui-typo-display-1-opacity'], ['div#article-content', 'div.mdblog-article-content']);
        return md;
    };
    let cxymm2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h2[style="line-height: 32px;"]'], ['div.htmledit_views']);
        return md;
    };
    let srcmini2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1.article-title'], ['article.article-content']);
        return md;
    };
    let _51cto2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('block_code', {
            filter: function (node, options) {
                return node.nodeName === 'PRE';
            },
            replacement: function (content, node, options) {
                return '\n' + options.fence + '\n' + node.innerText + '\n' + options.fence + '\n';
            }
        });
        let md = getMarkdown(turndownService, ['div.article-title h1'], ['div.article-content']);
        return md;
    };
    let cbiancheng2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('block_code', {
            filter: function (node, options) {
                return node.nodeName === 'PRE';
            },
            replacement: function (content, node, options) {
                return '\n\n' + options.fence + node.className + '\n' + node.innerText + '\n' + options.fence + '\n\n';
            }
        });
        let md = getMarkdown(turndownService, ['h1'], ['div#arc-body']);
        return md;
    };
    let infoq2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('rm_copy_div', {
            filter: function (node, options) {
                return node.nodeName === 'DIV' && node.hasAttribute('data-codeblock-copy');
            },
            replacement: function (content, node, options) {
                return "";
            }
        });
        let md = getMarkdown(turndownService, ['h1.article-title'], ['div.article-preview']);
        return md;
    };
    let imooc2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('rm_showmore_div', {
            filter: function (node, options) {
                return node.nodeName === 'DIV' && node.className === 'showMore';
            },
            replacement: function (content, node, options) {
                return "";
            }
        });
        let md = getMarkdown(turndownService, ['h1.detail-title'], ['div.detail-content']);
        return md;
    };
    let sspai2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['div.title'], ['div.content']);
        return md;
    };
    let leetcode2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('block_code', {
            filter: function (node, options) {
                return node.nodeName === 'PRE';
            },
            replacement: function (content, node, options) {
                return '\n' + options.fence + '\n' + node.innerText + '\n' + options.fence + '\n';
            }
        });
        let md = getMarkdown(turndownService, ['h1.css-izy0el-Title'], ['div.css-eojhts-StyledMarkdown']);
        return md;
    };
    let baidu2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1'], ['div.markdown-body']);
        return md;
    };
    let learnku2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1'], ['div.markdown-body']);
        return md;
    };
    let helloworld2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['p.blog-title'], ['div.content-body']);
        return md;
    };
    let itpub2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1.preview-title', 'h3'], ['div.preview-main', '.content']);
        return md;
    };
    let iotword2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1.entry-title'], ['div.entry-content']);
        return md;
    };
    let hackertalk2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1'], ['div.markdown-body']);
        return md;
    };
    let bytedance2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1'], ['article.tui-editor-contents']);
        return md;
    };
    let bmabk2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1.entry-title'], ['div.bpp-post-content']);
        return md;
    };
    let ctyun2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1'], ['div.detail-content']);
        return md;
    };
    let huaweicloud2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1.cloud-blog-detail-title'], ['div.markdown-preview']);
        return md;
    };
    let alipay2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['div.titleDec___3Fl0L'], ['div.yuque-servicify-content']);
        return md;
    };
    let cfanz2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['p.title'], ['article']);
        return md;
    };
    let cvmart2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['div.title-text'], ['div.markdown-body']);
        return md;
    };
    let weixin2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1#activity-name'], ['div#js_content']);
        return md;
    };
    let haicoder2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('block_code', {
            filter: function (node, options) {
                return node.nodeName === 'PRE';
            },
            replacement: function (content, node, options) {
                return '\n\n' + options.fence + node.className + '\n' + node.innerText + '\n' + options.fence + '\n\n';
            }
        });
        let md = getMarkdown(turndownService, ['h1.title'], ['div.markdown-body']);
        return md;
    };
    let coder2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1'], ['div#content']);
        return md;
    };
    let guyuehome2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['div.content-head h1'], ['div.article-body']);
        return md;
    };
    let jiguang2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, [], ['section.article-body']);
        return md;
    };
    let codenong2md = function () {
        // 这个网站代码是放在 table 里的
        // 有问题，以后修改
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1.entry-title'], ['div.single-content']);
        return md;
    };
    let freesion2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['div#main h2'], ['div#article_content']);
        return md;
    };
    let saikr2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('all_math', {
            filter: function (node, options) {
                return node.nodeName === 'SPAN'&&
                    node.className === 'math-tex';
            },
            replacement: function (content, node, options) {
                return '$' + node.lastChild.innerText + '$';
            }
        });
        let md = getMarkdown(turndownService, ['h1.circle-homepage-tit'], ['div.para']);
        return md;
    };

    let vsdiffer2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        let md = getMarkdown(turndownService, ['h1'], ['div#article-content']);
        return md;
    };

    let mathcubic2md = function () {
        let turndownService = new TurndownService(basicOptions).use([turndownPluginGfm.gfm]);
        turndownService.addRule('mathjax_math', {
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
        });
        turndownService.addRule('rm_math_unused', {
            filter: function (node, options) {
                return node.nodeName === 'DIV' && node.getAttribute('class') === 'MathJax_Display' || node.nodeName === 'SPAN' && node.getAttribute('class') === 'MathJax';
            },
            replacement: function (content, node, options) {
                return "";
            }
        });
        let md = getMarkdown(turndownService, ['div.article-box h2'], ['div#article_content']);
        return md;
    };
    const html2mds = {
        'default': default2md
        ,'zhihu': zhihu2md
        ,'csdn': csdn2md
        ,'aliyun': aliyun2md
        ,'tencent': tencent2md
        ,'juejin': juejin2md
        ,'cnblogs': cnblogs2md
        ,'jianshu': jianshu2md
        ,'planetmath': planetmath2md
        ,'oschina': oschina2md
        ,'segmentfault': segmentfault2md
        ,'writebug': writebug2md
        ,'luogu': luogu2md
        ,'cxymm': cxymm2md
        ,'srcmini': srcmini2md
        ,'51cto': _51cto2md
        ,'biancheng': cbiancheng2md
        ,'infoq': infoq2md
        ,'imooc': imooc2md
        ,'sspai': sspai2md
        ,'leetcode': leetcode2md
        ,'baidu': baidu2md
        ,'learnku': learnku2md
        ,'helloworld': helloworld2md
        ,'itpub': itpub2md
        ,'iotword': iotword2md
        ,'hackertalk': hackertalk2md
        ,'bytedance': bytedance2md
        ,'bmabk': bmabk2md
        ,'ctyun': ctyun2md
        ,'huaweicloud': huaweicloud2md
        ,'alipay': alipay2md
        ,'cfanz': cfanz2md
        ,'cvmart': cvmart2md
        ,'weixin': weixin2md
        ,'haicoder': haicoder2md
        ,'coder': coder2md
        ,'guyuehome': guyuehome2md
        ,'jiguang': jiguang2md
        ,'codenong': codenong2md
        ,'freesion': freesion2md
        ,'saikr': saikr2md
        ,'vsdiffer': vsdiffer2md
        ,'mathcubic': mathcubic2md
    };
    let currentKey = 'default';
    const info = window.location.host.toLowerCase();
    for (const key in html2mds) {
        if (info.includes(key)) {
            currentKey = key;
            break;
        }
    }
    const md = html2mds[currentKey]();
    GM_setClipboard(md);
})();