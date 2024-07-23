// ==UserScript==
// @name         CSDN 优化
// @namespace    David
// @version      0.1
// @description  CSDN 优化
// @author       David
// @match        https://blog.csdn.net/*
// @license      MIT
// @grant        GM_addStyle
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
    'use strict';
    // 修改样式
    GM_addStyle("#content_views pre,#content_views pre code {-webkit-touch-callout: auto !important;-webkit-user-select: auto !important;-khtml-user-select: auto !important;-moz-user-select: auto !important;-ms-user-select: auto !important;user-select: auto !important;}");
    GM_addStyle(".passport-login-container {display: none !important;}");
    document.querySelectorAll("div.d-flex")[0].setAttribute("class", "main_father clearfix justify-content-center");
    document.querySelectorAll("main")[0].setAttribute("style", "width:100%;");
    document.querySelectorAll("div#mainBox")[0].setAttribute("class", "");

    // 移除一些不必要的元素
    const elementsToRemove = [
        "div.passport-login-tip-container",
        "div.csdn-side-toolbar",
        "div.tool-active-list",
        "aside.blog_container_aside",
        "aside.recommend-right_aside",
        "div.more-toolbox-new",
        "div.recommend-box",
        "div.common-nps-box",
        "div.blog-footer-bottom",
        "div.passport-login-container",
        "div.recommend-right"
    ];
    elementsToRemove.forEach(selector => {
        document.querySelectorAll(selector).forEach(ele => {
            ele.remove();
        });
    });

    // 破解复制按钮
    const codeButtons = [
        "div.hljs-button"
    ];
    codeButtons.forEach(selector => {
        document.querySelectorAll(selector).forEach(btn => {
            // 更改标题
            btn.dataset.title = "复制";
            // 移除点击事件
            btn.setAttribute("data-report-click", "");
            btn.setAttribute("onclick", "");

            // 重新添加点击事件
            btn.addEventListener("click", (ele) => {
                // 实现复制
                const parentPreBlock = ele.target.closest("pre");
                const codeBlocks = parentPreBlock.querySelectorAll("code");
                GM_setClipboard(codeBlocks[0].innerText);
                ele.target.dataset.title = "复制成功";
                setTimeout(() => {
                    ele.target.dataset.title = "复制";
                }, 1000);
                ele.stopPropagation();
                ele.preventDefault();
            });
        });
    });

})();