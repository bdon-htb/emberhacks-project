// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2025-10-26
// @description  try to take over the world!
// @author       You
// @run-at document-start
// @match        https://addons.gsuite.*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
})();

let revBtn, autoCompBtn;

function refreshBtn(document) {
  console.log(document.querySelectorAll("iframe"));
  for (let iframe in document.querySelectorAll("iframe")) {
    refreshBtn(iframe.contentWindow.document);
  }
  let q = document.querySelectorAll("button");
  for (let ele in q) {
    if (ele.innerHTML.match("Revise", "i")) {
      revBtn = ele;
    }
    if (ele.innerHTML.match("AutoComplete","i")) {
      autoCompBtn = ele;
    }
  }
}


window.addEventListener("keydown", (event)=>{
  if (event.ctrlKey && event.altKey && !event.shiftKey) {
    // ctrl+alt:
    refreshBtn(window.document);
    console.log(revBtn, autoCompBtn)
    if (event.key == "c") {
      revBtn.click();
    }
    if (event.key == "r") {
      autoCompBtn.click();
    }
  }
})

