// if you want to read these regexes, use regex101.com
const regexWhitespace = /^[ \t\r\n,]+/;
const regexFalse = /^false(?![.*+!\-_?$$%&=<>:#a-zA-Z0-9])[ \t\r\n,]*/; // make sure this isn't the beginning of a symbol
const regexTrue = /^true(?![.*+!\-_?$$%&=<>:#a-zA-Z0-9])[ \t\r\n,]*/;
const regexNil = /^nil(?![.*+!\-_?$$%&=<>:#a-zA-Z0-9])[ \t\r\n,]*/;

const regexSymbol = /^(([.+-][.*+!\-_?$$%&=<>a-zA-Z:#])|([*!_?$$%&=<>a-zA-Z])[.*+!\-_?$$%&=<>:#a-zA-Z0-9]*\/)?(([.+-][.*+!\-_?$$%&=<>a-zA-Z:#])|([*!_?$$%&=<>a-zA-Z]))[.*+!\-_?$$%&=<>:#a-zA-Z0-9]*[ \t\r\n,]*/;
const regexKeyword = /^:(([.+-][.*+!\-_?$$%&=<>a-zA-Z:#])|([*!_?$$%&=<>a-zA-Z])[.*+!\-_?$$%&=<>:#a-zA-Z0-9]*\/)?(([.+-][.*+!\-_?$$%&=<>a-zA-Z:#])|([*!_?$$%&=<>a-zA-Z]))[.*+!\-_?$$%&=<>:#a-zA-Z0-9]*[ \t\r\n,]*/;
const regexTag = /^#([a-zA-Z][.*+!\-_?$$%&=<>:#a-zA-Z0-9]*\/)?(([.+-][.*+!\-_?$$%&=<>a-zA-Z:#])|([*!_?$$%&=<>a-zA-Z])[.*+!\-_?$$%&=<>:#a-zA-Z0-9]*)[ \t\r\n,]*/;

const regexInteger = /^[+-]?(0|([1-9][0-9]*))(N)?[ \t\r\n,]*/;

/**
 * capturing groups ( all int parts include the optional +- at the front )
 * int part
 * frac tail (if no exp)
 * exp (if no frac tail)
 * frac (if exp)
 * exp (if frac tail)
 * M (means it's exact)
 */
const regexFloat = /^([+-]?(?:0|(?:[1-9][0-9]*)))(?:(?:\.([0-9]+)[eE]([+-]?(?:0|(?:[1-9][0-9]*))))|(?:(?:\.([0-9]+))|(?:[eE]([+-]?(?:0|(?:[1-9][0-9]*))))))(M?)[ \t\r\n,]*/;

let textLeft = `nil false (true {1111.232 hi} symbol-hello)`;

const parseEdn = (text) => {
  let textLeft = text;
  const tree = { kids: [], type: "list" };
  const stack = [tree];
  let tag = null;

  // get rid of whitespace after each token and before entire string
  textLeft = textLeft.replace(/^[ \t\r\n,]+/, "");
  while (textLeft.length > 0) {
    let match;
    match = textLeft.match(/^\([ \t\r\n,]*/);
    if (match !== null) {
      const newList = { kids: [], type: "list" };
      stack[stack.length - 1].kids.push(newList);
      textLeft = textLeft.substring(match[0].length);
      stack.push(newList);
      if (tag !== null) {
        newList.tag = tag;
      }
      continue;
    }
    match = textLeft.match(/^\)[ \t\r\n,]*/);
    if (match !== null) {
      if (stack[stack.length - 1].type !== "list") {
        throw new Error("unmatched closing parenthesis");
      }
      stack.pop();
      textLeft = textLeft.substring(match[0].length);
      if (tag !== null) {
        throw new Error("tag by itself");
      }
      continue;
    }
    match = textLeft.match(/^\[[ \t\r\n,]*/);
    if (match !== null) {
      const newVector = { kids: [], type: "vector" };
      stack[stack.length - 1].kids.push(newVector);
      textLeft = textLeft.substring(match[0].length);
      stack.push(newVector);
      if (tag !== null) {
        newVector.tag = tag;
      }
      continue;
    }
    match = textLeft.match(/^\][ \t\r\n,]*/);
    if (match !== null) {
      if (stack[stack.length - 1].type !== "vector") {
        throw new Error("unmatched end of vector");
      }
      stack.pop();
      textLeft = textLeft.substring(match[0].length);
      if (tag !== null) {
        throw new Error("tag by itself");
      }
      continue;
    }
    match = textLeft.match(/^\{[ \t\r\n,]*/);
    if (match !== null) {
      const newMap = { kids: [], type: "map" };
      stack[stack.length - 1].kids.push(newMap);
      textLeft = textLeft.substring(match[0].length);
      stack.push(newMap);
      if (tag !== null) {
        newMap.tag = tag;
      }
      continue;
    }
    match = textLeft.match(/^\}[ \t\r\n,]*/);
    if (match !== null) {
      if (stack[stack.length - 1].type !== "map") {
        throw new Error("unmatched end of map");
      }
      if (stack[stack.length - 1].kids.length % 2 !== 0) {
        throw new Error("map with odd number of forms");
      }
      const end = stack.pop();
      end.map = {};
      for (let i = 0; i < end.kids.length / 2; i++) {
        end.map[end.kids[i]] = end.kids[i + 1];
      }
      textLeft = textLeft.substring(match[0].length);
      if (tag !== null) {
        throw new Error("tag by itself");
      }
      continue;
    }
    match = textLeft.match(regexNil);
    if (match !== null) {
      stack[stack.length - 1].kids.push(null);
      textLeft = textLeft.substring(match[0].length);
      continue;
    }
    match = textLeft.match(regexFalse);
    if (match !== null) {
      stack[stack.length - 1].kids.push(false);
      textLeft = textLeft.substring(match[0].length);
      continue;
    }
    match = textLeft.match(regexTrue);
    if (match !== null) {
      stack[stack.length - 1].kids.push(true);
      textLeft = textLeft.substring(match[0].length);
      continue;
    }
    match = textLeft.match(regexFloat);
    if (match !== null) {
      stack[stack.length - 1].kids.push(parseFloat(match[0]));
      textLeft = textLeft.substring(match[0].length);
      if (tag !== null) {
        throw new Error("no tags for Float");
      }
      continue;
    }
    match = textLeft.match(regexInteger);
    if (match !== null) {
      stack[stack.length - 1].kids.push(parseInt(match[0]));
      textLeft = textLeft.substring(match[0].length);
      if (tag !== null) {
        throw new Error("no tags for Integer");
      }
      continue;
    }
    match = textLeft.match(regexSymbol);
    if (match !== null) {
      match[0].type = "symbol";
      stack[stack.length - 1].kids.push(match[0]);
      textLeft = textLeft.substring(match[0].length);
      if (tag !== null) {
        match[0].tag = tag;
      }
      continue;
    }
    match = textLeft.match(regexKeyword);
    if (match !== null) {
      stack[stack.length - 1].kids.push(match[0]);
      match[0].type = "keyword";
      textLeft = textLeft.substring(match[0].length);
      if (tag !== null) {
        match[0].tag = tag;
      }
      continue;
    }
    tag = null;
    match = textLeft.match(regexTag);
    if (match !== null) {
      if (tag !== null) {
        throw new Error(`tags go before values to modify them. They can't go before tags`);
      }
      tag = match[0];
      textLeft = textLeft.substring(match[0].length);
      continue;
    }
  }
  return tree;
};
console.log(parseEdn(textLeft));

// for (let i = 0; i < 10000; i++) {
//   parseEdn(textLeft);
// }
const stime = performance.now();
for (let i = 0; i < 10000; i++) {
  parseEdn(textLeft);
}
console.log(`took ${performance.now() - stime}`);
