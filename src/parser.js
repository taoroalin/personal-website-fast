const exampleRoam = "((blockref)) [[page link]] ^^highlight^^ $$latex$$https://example.com";
const exampleRoamAll =
  "Attribute:: ((blockref)) [[page link]] ^^highlight^^ $$latex$$ https://example.com ![image alias](https://images.img/my_image.png) **bold** __italic__ ^^highlight^^ $$latex$$ {{roam-render}} regular text followed by long image ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fgraphminer%2FFl-tnQr6XJ?alt=media&token=9938544e-9053-416b-a662-1578efcc7a66)";

const examplePageLinks = "((Blockey)) and [[Pagey]] and another [[Few [[Links shortly]]and";

const regexImage = /!\[[a-zA-Z., ]*\]\(((https?\:\/\/)|(www\.))[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)\)/g;
const regexUrl = /((https?\:\/\/)|(www\.))[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/g;
const regexBlockRef = /\(\([0-9a-zA-Z\-\_]+\)\)/g;
const regexAttribute = /^[a-zA-Z0-9., ]+::/g;

const appendMatchList = (text) => {
  const matches = [];
  for (let match of text.matchAll(regexImage)) {
    matches.push({ tag: "img", start: match.index, end: match.index + match[0].length });
  }
  for (let match of text.matchAll(regexUrl)) {
    matches.push({ tag: "url", start: match.index, end: match.index + match[0].length });
  }
  for (let match of text.matchAll(regexBlockRef)) {
    matches.push({ tag: "brf", start: match.index, end: match.index + match[0].length });
  }
  for (let match of text.matchAll(regexAttribute)) {
    matches.push({ tag: "atr", start: match.index, end: match.index + match[0].length });
  }
  return matches;
};

const parseUnparsed = (unParsedNodes, regex, tag) => {
  const newUnParsedNodes = [];
  for (let unParsedNode of unParsedNodes) {
    let idx = 0;
    unParsedNode.kids = [];
    for (let match of unParsedNode.text.matchAll(regex)) {
      if (match.index !== idx) {
        const between = { text: unParsedNode.text.substring(idx, match.index) };
        unParsedNode.kids.push(between);
        newUnParsedNodes.push(between);
      }
      const here = { text: match[0], tag: tag };
      unParsedNode.kids.push(here);
      idx = match.index + match[0].length;
    }
    if (idx == 0) {
      newUnParsedNodes.push(unParsedNode);
    } else if (idx === unParsedNode.text.length - 1) {
    } else {
      const between = { text: unParsedNode.text.substring(idx) };
      unParsedNode.kids.push(between);
      newUnParsedNodes.push(between);
    }
  }
  return newUnParsedNodes;
};

const tokenList = (text) => {
  const initialUnparsed = { text };
  const unParsedNodes = [initialUnparsed];
  const tree = [initialUnparsed];
  const unParsedNodes2 = parseUnparsed(unParsedNodes, regexBlockRef, "brf");
  const unParsedNodes3 = parseUnparsed(unParsedNodes2, regexImage, "img");
  const unParsedNodes4 = parseUnparsed(unParsedNodes3, regexUrl, "url");
  // console.log(unParsedNodes4);
  return tree;
};
tokenList(exampleRoamAll);
// throw new Error("don't want to run rest");

// for (let i = 0; i < 10000; i++) {
//   tokenList(exampleRoamAll);
// }
// const stime = performance.now();
// for (let i = 0; i < 10000; i++) {
//   tokenList(exampleRoamAll);
// }
// console.log(`ptook ${performance.now() - stime}`);
// console.log(tokenList(exampleRoamAll));

// Descriptions of blocks that begin and end with double symbols, like [[, **, __
//     const pairs = [
//         { type: "bold", start: "*", end: "*", priority: 0 },
//         { type: "page ref", start: "[", end: "]", priority: 1 },
//         { type: "block ref", start: "(", end: ")", priority: 2 },
//     ];
//     const exampleAST = { type: "plain", children: [{ type: "page link", start: 0, end: 10, children: [{ type: "text", start: 2, end: 5 }] }] };

//     const pairStartTable = pairs.reduce((acc, val) => { acc[val.start + val.start] = val; return acc }, {});
//     const pairEndTable = pairs.reduce((acc, val) => { acc[val.end + val.end] = val; return acc }, {});

//     // regex for blocks of chars that are under no circumstances broken up.
//     const regexGuaranteedPlainText = new RegExp(`^[^${pairs.map(pair => `\\${pair.start}\\${pair.end}`).join()}]+`);
//     let textFull = examplePageLinks;
//     let textLeft = textFull;
//     const stime = performance.now();
//     const tree = { type: "plain", children: [], start: 0, end: textLeft.length, string: textFull };
//     const stack = [tree];
//     let i = 0;
//     while (textLeft.length > 0) {
//         const wordMatch = textLeft.match(regexGuaranteedPlainText);
//         if (wordMatch) {
//             i += wordMatch[0].length;
//             textLeft = textLeft.substring(wordMatch[0].length);
//         } else {
//             const nextTwoChars = textLeft.substring(0, 2);
//             const pairStart = pairStartTable[nextTwoChars];
//             if (pairStart !== undefined) {
//                 const newNode = { type: pairStart.type, start: i, children: [], string: textFull };
//                 stack[stack.length - 1].children.push(newNode);
//                 stack.push(newNode);
//             } else {
//                 const pairEnd = pairEndTable[nextTwoChars];
//                 if (pairEnd !== undefined) {
//                     if (pairEnd.type == stack[stack.length - 1].type) {
//                         stack[stack.length - 1].end = i + 3;
//                         stack.pop();
//                     }
//                 }
//             }
//             textLeft = textLeft.substring(2);
//             i += 2;
//         }
//     }
//     // kill all the incomplete parses at the end
//     for (let i = 1; i < stack.length; i++) {
//         const toBarf = tree.children.pop();
//         tree.children.push(...toBarf.children);
//     }
//     console.log(performance.now() - stime);
//     console.log(tree);

//     //tokens that are only seen at the very beginning of a block
//     const blockStartTokens = [
//         { type: "colon ref", regex: /^[^:]+::/ }, // idk what this should be called
//         // this could be handled as link nested in roam-render, or like this
//         // idk which is better
//         { type: "todo", regex: /^\{\{\[\[TODO\]\]\}\}/ },
//     ];
//     // AST nodes that never have children and can be parsed with 1 regex
//     const atomicTokens = { type: "url", regex: /((https?\:\/\/)|(www\.))[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/ }

// const tokenTypes = [
//     { re: /^https?:\/\/([a-zA-Z]+\.)?[a-zA-Z]+\.[a-zA-Z]+(\/[a-zA-Z]*)*(\?([a-zA-Z]+=[a-zA-Z]+))*/, tag: "url" },
//     { re: /^[^\[\]\{\}\(\)\!*_^$:]+/, tag: "text" },
//     { re: /^\[\[/, tag: "page-start" },
//     { re: /^\]\]/, tag: "page-end" },
//     { re: /^\{\{/, tag: "render-start" },
//     { re: /^\}\}/, tag: "render-end" },
//     { re: /^\*\*/, tag: "bold" },
//     { re: /^__/, tag: "italic" },
//     { re: /^\$\$/, tag: "latex" },
//     { re: /^\^\^/, tag: "highlight" },
//     { re: /^\(\([0-9a-zA-Z\-\_]+\)\)/, tag: "block" },
//     { re: /^./, tag: "text" }
// ];
// const lex = (text) => {
//     const tokens = [];
//     let i = 0;
//     while (text.length > 0) {
//         for (let tokenType of tokenTypes) {
//             const match = text.match(tokenType.re);
//             if (match) {
//                 const len = match[0].length;
//                 tokens.push({ tag: tokenType.tag, start: i, end: i + len });
//                 i += len;
//                 text = text.substring(len)
//                 break;
//             }
//         }
//     }
//     return tokens;
// }
// const stime = performance.now();
// for (let i = 0; i < 1000; i++) {
//     lex(exampleRoam);
// }
// console.log(performance.now() - stime);
// console.log(lex(exampleRoam));

// lexer. Jonathan Blow keeps talking about how good lexers are, so I'll try using one

// const tokens = [];
// textLeft = examplePageLinks;
// while(textLeft.length>0){
//     const
// }
