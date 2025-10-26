// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2025-10-26
// @description  try to take over the world!
// @author       You
// @run-at document-start
// @match        https://addons.gsuite.google.com*
// @match        https://docs.google.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
})();

let revBtn, autoCompBtn;

function refreshBtn(document) {
/*   console.log(document) */
  for (let iframe of document.querySelectorAll("iframe")) {
    console.log(iframe.contentWindow.documentElement.querySelectorAll("button"))
    refreshBtn(iframe.contentWindow.documentElement);
    iframe.contentWindow.addEventListener("keydown", clickBtn)
  }
  let q = document.querySelectorAll("button");
  console.log(q)
  for (let ele of q) {
    if (ele.innerHTML.match("Revise", "i")) {
      revBtn = ele;
      console.log("button found!", ele)
    }
    if (ele.innerHTML.match("AutoComplete","i")) {
      autoCompBtn = ele;
      console.log("button found!", ele)
    }
  }
}


window.addEventListener("keydown", clickBtn)

console.log("topdoc=", document)

function clickBtn(event) {
  if (event.ctrlKey && event.altKey && !event.shiftKey) {
    // ctrl+alt:

    refreshBtn(document);
    console.log(revBtn, autoCompBtn)
    if (event.key == "c") {
      revBtn.click();
    }
    if (event.key == "r") {
      autoCompBtn.click();
    }
  }
}