// ==UserScript==
// @name         一键复制公式
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  Click to copy equation in Wikipedia and Zhihu
// @author       flaribbit
// @match        http://*.wikipedia.org/*
// @match        https://*.wikipedia.org/*
// @match        http://www.wikiwand.com/*
// @match        https://www.wikiwand.com/*
// @match        https://www.zhihu.com/question/*
// @match        https://zhuanlan.zhihu.com/p/*
// @match        https://blog.csdn.net/*/article/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const host = document.location.host;
    const el = document.createElement('style');
    el.innerText = '@keyframes aniclick{0%{background:#03A9F400}20%{background:#03A9F47F}100%{background:#03A9F400}}';
    document.head.appendChild(el);
    const clearAnimation = function () {
        this.style.animation = '';
    }

    const copyTex = function (tex) {
        navigator.clipboard.writeText('$' + tex + '$');
        this.style.animation = 'aniclick .4s';
    }
    const checkEquations = function (eqs) {
        for (let i = 0; i < eqs.length; i++) {
            eqs[i].onclick = function () {
                const tex = this.getAttribute('data-tex') || this.alt || this.getElementsByTagName('math')[0]?.getAttribute("alttext") || this.querySelector('annotation')?.textContent.trim();
                copyTex.call(this, tex);
            };
            eqs[i].addEventListener('animationend', clearAnimation);
            eqs[i].title = '点击即可复制公式';
        }
    }

    if (host.includes('wikipedia')) {
        const eqs = document.querySelectorAll('.mwe-math-fallback-image-inline, .mwe-math-fallback-image-display');
        checkEquations(eqs);
    } else if (host.includes('wikiwand')) {
        const eqs = document.querySelectorAll('.mwe-math-element');
        checkEquations(eqs);
        const targetNode = document.getElementsByTagName('article')[0];
        const config = { attributes: false, childList: true, subtree: true };
        const observer = new MutationObserver(function (mutationList) {
            checkEquations(mutationList[0].addedNodes[0]?.querySelectorAll('.mwe-math-element') || []);
        });
        observer.observe(targetNode, config);
    } else if (host.includes('zhihu')) {
        const checkEquations = function () {
            if (document.visibilityState == 'visible') {
                const eqs = document.querySelectorAll('.ztext-math');
                for (let i = 0; i < eqs.length; i++) {
                    eqs[i].onclick = function () {
                        const tex = this.getAttribute('data-tex');
                        copyTex.call(this, tex);
                    };
                    eqs[i].addEventListener('animationend', clearAnimation);
                    eqs[i].title = '点击即可复制公式';
                }
            }
        };
        if (document.location.href.includes('question')) {
            setInterval(checkEquations, 1000);
        } else {
            checkEquations();
        }
    } else if (host.includes('blog.csdn')) {
        const eqs = document.querySelectorAll('.katex');
        checkEquations(eqs);
    }
})();