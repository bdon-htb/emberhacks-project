let scriptProperties = PropertiesService.getScriptProperties();

let setProp = (key, val) => {scriptProperties.deleteProperty(key); scriptProperties.setProperty(key, val);};
let getProp = scriptProperties.getProperty;


function onFileScopeReady(docs) {
  return {
  }
}


function onHomepage(ev) {
  setProp("title", getProp("title")+"a")
  const reviseAction = CardService.newAction().setFunctionName('revise');
  let reviseBtn = CardService.newTextButton().setText('Revise').setOnClickAction(reviseAction)
  const autoCompleteAction = CardService.newAction().setFunctionName('autoComplete');
  let autoCompleteBtn = CardService.newTextButton().setText('AutoComplete').setOnClickAction(autoCompleteAction)

  currWidg = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("Welcome to EmberComplete")
      .setSubtitle("Notetaking, upgraded.")
    )
    .addSection(CardService.newCardSection()
      .setHeader(getProp("status"))
      .addWidget(reviseBtn)
      .addWidget(autoCompleteBtn)
    )
    .build()

  //   "header": {
  //     "title": title ?? "this is a fallback title.",
  //     "subtitle": "Card Subtitle",
  //     "imageUrl": "https://developers.google.com/chat/images/quickstart-app-avatar.png",
  //     "imageType": "CIRCLE"
  //   },
  //   "sections": [
  //     {
  //       "header": "Section Header",
  //       "collapsible": true,
  //       "widgets": [
  //         {
  //           "textParagraph": debugStat
  //         },
  //         {
  //           "buttonList": {
  //             "buttons": [
  //               {
  //                 "text": "Fill",
  //                 "type": "FILLED",
  //                 "onClick": {
  //                   "action": {
  //                     "function": "processReplace",
  //                   }
  //                 }
  //               },
  //             ]
  //           }
  //         }
  //       ]
  //     }
  //   ]
  // }
  return currWidg
}

function makeAPIRequest(selection, contextBefore, contextAfter, mode) {
  const url = getProp('API_URL');
  console.log(url)
  const task_type = mode == AUTOCOMPLETE ? "autocomplete" : "revise";

    let data = {
      text: selection,
      context_before: contextBefore,
      context_after: contextAfter,
      task_type: task_type
    }
    let options = {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    }
    try {
      responseJSON = JSON.parse(UrlFetchApp.fetch(url, options));
    } catch (e) {
      return {
        status:-1,
        resp: mode == AUTOCOMPLETE ? "" : selection
      }
    }

    return {
      status: 1,
      resp: responseJSON.response.replace(/\n$/, "") // trim trailing newline
    }
}

function autoComplete() {
  return processReplace(AUTOCOMPLETE);
}

function revise() {
  return processReplace(REVISE);
}

const AUTOCOMPLETE = 1;
const REVISE = 2;
const MAX_CONTEXT_CHARS = 2000;

function processReplace(mode) {
  currDoc = DocumentApp.getActiveDocument();
  range = DocumentApp.getActiveDocument().getSelection();
  let selection = getSelectedText(range);
  let cursor = currDoc.getCursor();

  if (selection.length == 0) {


    if (!cursor) {
      return refreshHome();
    }

    // selection = cursor.getElement.element.asText():
    let ctn = cursor.getElement();
    while (ctn &&
           ctn.getType() !== DocumentApp.ElementType.PARAGRAPH &&
           ctn.getType() !== DocumentApp.ElementType.LIST_ITEM) {
      ctn = ctn.getParent();
    }

    if (ctn) {
     //let ele = cursor.getElement();
     //console.log(ele.className);
      console.log(ctn.getType())
      let rangeBuilder = currDoc.newRange();
      rangeBuilder.addElementsBetween(ctn.getChild(0), ctn.getChild(ctn.getNumChildren()-1));
      range = rangeBuilder.build();
      selection = getSelectedText(range);

   }
  }
  if (range.getRangeElements().length == 0) {
    return onHomepage();
  }
  console.log("THIS IS CONTEXT:", selection);

  dbgOut = "";



  /// for testing only
  // TODO: Replace first and second arguments with proper context.

  apiResp = makeAPIRequest(selection, "", "", mode);
  response = apiResp.resp;
  setProp("status", `Revision ${apiResp.status >= 0 ? "complete" : "failed, please try again!"}`);

  // response = "R"+selection+"L"

  // Insert a new paragraph after the reference paragraph
  // let lastListItem = range.getRangeElements()[range.getRangeElements().length-1].getElement();
  // let ctn = lastListItem;

  // while (ctn &&
  //         ctn.getType() !== DocumentApp.ElementType.PARAGRAPH &&
  //         ctn.getType() !== DocumentApp.ElementType.LIST_ITEM) {
  //   ctn = ctn.getParent();
  // }


  replaceActiveSel(mode == AUTOCOMPLETE ? response + selection : response)




  return refreshHome()
}

function replaceActiveSel(newText) {
  const selection = DocumentApp.getActiveDocument().getSelection();
  if (selection) {
    let replaced = false;
    const elements = selection.getSelectedElements();
    if (elements.length === 1 && elements[0].getElement().getType() ===
      DocumentApp.ElementType.INLINE_IMAGE) {
      throw new Error('Can\'t insert text into an image.');
    }
    for (let i = 0; i < elements.length; ++i) {
      if (elements[i].isPartial()) {
        const element = elements[i].getElement().asText();
        const startIndex = elements[i].getStartOffset();
        const endIndex = elements[i].getEndOffsetInclusive();
        element.deleteText(startIndex, endIndex);
        if (!replaced) {
          element.insertText(startIndex, newText);
          replaced = true;
        } else {
          // This block handles a selection that ends with a partial element. We
          // want to copy this partial text to the previous element so we don't
          // have a line-break before the last partial.
          const parent = element.getParent();
          const remainingText = element.getText().substring(endIndex + 1);
          parent.getPreviousSibling().asText().appendText(remainingText);
          // We cannot remove the last paragraph of a doc. If this is the case,
          // just remove the text within the last paragraph instead.
          if (parent.getNextSibling()) {
            parent.removeFromParent();
          } else {
            element.removeFromParent();
          }
        }
      } else {
        const element = elements[i].getElement();
        if (!replaced && element.editAsText) {
          // Only translate elements that can be edited as text, removing other
          // elements.
          element.clear();
          element.asText().setText(newText);
          replaced = true;
        } else {
          // We cannot remove the last paragraph of a doc. If this is the case,
          // just clear the element.
          if (element.getNextSibling()) {
            element.removeFromParent();
          } else {
            element.clear();
          }
        }
      }
    }
  } else {
    const cursor = DocumentApp.getActiveDocument().getCursor();
    const surroundingText = cursor.getSurroundingText().getText();
    const surroundingTextOffset = cursor.getSurroundingTextOffset();

    // If the cursor follows or preceds a non-space character, insert a space
    // between the character and the translation. Otherwise, just insert the
    // translation.
    // if (surroundingTextOffset > 0) {
    //   if (surroundingText.charAt(surroundingTextOffset - 1) !== ' ') {
    //     newText = ' ' + newText;
    //   }
    // }
    if (surroundingTextOffset < surroundingText.length) {
      if (surroundingText.charAt(surroundingTextOffset) !== ' ') {
        newText += ' ';
      }
    }
    cursor.getSurroundingText().setText("")
    cursor.insertText(newText);
  }
}

function printSelection() {
  const selectedText = getSelectedText();
  console.log(selectedText ? `The selected text is "${selectedText}".` : `No text is selected.`);
}

function refreshHome() {
  let nav = CardService.newNavigation().popToRoot().updateCard(onHomepage());
  return CardService.newActionResponseBuilder()
        .setNavigation(nav)
        .build();
}


function getSelectedText(range = DocumentApp.getActiveDocument().getSelection()) {
  const result = [];
  if (range) {
    range.getRangeElements().forEach(rangeElement => {
      if (rangeElement.isPartial()) {
        const startIndex = rangeElement.getStartOffset();
        const endIndex = rangeElement.getEndOffsetInclusive();
        result.push(rangeElement.getElement().asText().getText().substring(startIndex, endIndex + 1));
      } else {
        const element = rangeElement.getElement();
        if (element.editAsText) {
          const elementText = element.asText().getText();
          if (elementText) {
            result.push(elementText);
          }
        }
      }
    });
  }
  return result.length ? result.join('\n') : '';
}

// function getSelectedText(range = DocumentApp.getActiveDocument().getSelection()) {
//   // var doc = DocumentApp.getActiveDocument();
//   // var selection = doc.getSelection();
//   if (range == null) return []
//   var rangeElems = range.getRangeElements(); //Get main Elements of selection
//   if (rangeElems.length == 0) return []
//   outs = [];
//   rangeElems.forEach(function(elem){ //Let's rn through each to find ALL of their children.
//     var elem = elem.getElement(); //We have an ElementType. Let's get the full element.
//     outs.push(...getNestedTextElements(elem, elem.getType())); //Time to go down the rabbit hole.

//   });
//   return outs
// }

// function getNestedTextElements(elem, typeChain) {
//   outs = [];
//   var elemType = elem.getType();
//   if (elemType == "TABLE" || elemType == "LIST_ITEM" || elemType == "PARAGRAPH" || elemType == "TABLE_ROW" || elemType == "TABLE_CELL") { //Lets see if element is one of our basic 5, if so they could have children.
//     var numChildren = elem.getNumChildren(); //How many children are there?
//     if (numChildren > 0) {
//       for (var i = 0; i < numChildren; i++) { //Let's go through them.
//         var child = elem.getChild(i);
//         outs.push(...getNestedTextElements(child, typeChain + "." + child.getType())); //Recursion step to look for more children.
//       }
//     }
//   } else if (elemType == "TEXT") {
//     //THIS IS WHERE WE CAN PERFORM OUR OPERATIONS ON THE TEXT ELEMENT
//     outs.push(elem);
//   } else {
//     // console.log("*" + typeChain); //Let's log the new elem we dont deal with now - for future proofing.
//   }
//   return outs;
// }



// /**
// * Gets the currently selected text in a document.
// *
// * @param {DocumentApp.Range} range Optional. The document range where to get text. Defaults to currently selected text.
// * @return {any} The text in range joined with newlines, or an empty string when the range does not contain text.
// */
// function getSelectedText(range = DocumentApp.getActiveDocument().getSelection()) {
//   const result = [];
//   let currEle = null
//   if (range) {
//     range.getRangeElements().forEach(rangeElement => {
//       if (rangeElement.isPartial()) {
//         const startIndex = rangeElement.getStartOffset();
//         const endIndex = rangeElement.getEndOffsetInclusive();
//         newele = rangeElement.getElement().asText().getText().substring(startIndex, endIndex + 1);
//         if (newele == null) return;
//         if (currEle == null) currEle = newele;
//         else currEle.setText(currEle.getText()+newele.getText()); // merge with prev
//       } else {
//         const element = rangeElement.getElement();
//         if (element.getType() == DocumentApp.ElementType.TEXT) {
//           // const elementText = element.asText().getText();
//           if (currEle == null) currEle = element;
//           else currEle.setText(currEle.getText()+element.getText());
//         }
//         else {
//           result.push(currEle)
//           currEle = null;
//         }
//       }
//     });
//     if (currEle != null) {
//       result.push(currEle);
//     }
//   }
//   return result;
// }
