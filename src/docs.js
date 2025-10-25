let scriptProperties = PropertiesService.getScriptProperties();

let setProp = (key, val) => {scriptProperties.deleteProperty(key); scriptProperties.setProperty(key, val);};
let getProp = scriptProperties.getProperty;


function onFileScopeReady(docs) {
  return {
  }
}


function onHomepage(ev) {
  // Open the active document (for a container-bound script)
  var doc = DocumentApp.getActiveDocument();

  // Get the body of the document (or the active tab's body)
  var body = doc.getBody();

  // Get all paragraphs in the body
  var paragraphs = body.getParagraphs();

  // Iterate through paragraphs and log their text content
  for (var i = 0; i < paragraphs.length; i++) {
    var paragraphText = paragraphs[i].getText();
    console.log("Paragraph " + (i + 1) + ": " + paragraphText);
  }

  // Example: Extracting content from tables
  var tables = body.getTables();
  if (tables.length > 0) {
    console.log("\nTables found:");
    for (var j = 0; j < tables.length; j++) {
      var table = tables[j];
      console.log("Table " + (j + 1) + ":");
      for (var r = 0; r < table.getNumRows(); r++) {
        var rowContent = [];
        for (var c = 0; c < table.getRow(r).getNumCells(); c++) {
          rowContent.push(table.getRow(r).getCell(c).getText());
        }
        console.log("  Row " + (r + 1) + ": " + rowContent.join(", "));
      }
    }
  }

  setProp("title", getProp("title")+"a")
  const action   = CardService.newAction().setFunctionName('processReplace');
  let btnElement = CardService.newTextButton().setText('process!').setOnClickAction(action)
  console.log(btnElement)

  currWidg = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(getProp("title")))
    .addSection(CardService.newCardSection()
      .setHeader("header:"+getProp("dbg"))
      .addWidget(btnElement))
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

function processReplace() {
  currDoc = DocumentApp.getActiveDocument();
  let context = getSelectedText();
  if (context.length == 0) {
    context = [currDoc.getCursor()?.getSurroundingText()?.getText()];
  }
  console.log("THIS IS CONTEXT:", context);

  setProp("dbg", `len=${context.length} / c=${context.join(",")}`);

  response = "padstart" + context + "responseadded"

  return refreshHome()
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

/**
* Gets the currently selected text in a document.
*
* @param {DocumentApp.Range} range Optional. The document range where to get text. Defaults to currently selected text.
* @return {String} The text in range joined with newlines, or an empty string when the range does not contain text.
*/
function getSelectedText(range = DocumentApp.getActiveDocument().getSelection()) {
  const result = [];
  let currEle = ""
  if (range) {
    range.getRangeElements().forEach(rangeElement => {
      if (rangeElement.isPartial()) {
        const startIndex = rangeElement.getStartOffset();
        const endIndex = rangeElement.getEndOffsetInclusive();
        currEle += rangeElement.getElement().asText().getText().substring(startIndex, endIndex + 1)
        + "\n";
      } else {
        const element = rangeElement.getElement();
        if (element.editAsText) {
          const elementText = element.asText().getText();
          if (elementText) {
            currEle += elementText + "\n";
          }
        }
        else {
          result.push(currEle)
          currEle = "";
        }
      }
    });
  }
  return result;
}