// ==UserScript==
// @name         知乎 优化
// @namespace    David
// @version      0.1
// @description  知乎 优化
// @author       David
// @match        https://zhuanlan.zhihu.com/p/*
// @license      MIT
// @grant        GM_addStyle
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
    'use strict';
    // 移除一些不必要的元素
    const elementsToRemove = [
        "button.FollowButton"
    ];
    elementsToRemove.forEach(selector => {
        document.querySelectorAll(selector).forEach(ele => {
            ele.remove();
        });
    });
})();