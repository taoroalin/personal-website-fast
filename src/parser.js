const exampleLisp =
  "(hello (thing and thing (and thing) andy) ando)(hello (thing and thing (and thing) andy) ando)(hello (thing and thing (and thing) andy) ando)(hello (thing and thing (and thing) andy) ando)(hello (thing and thing (and thing) andy) ando)";

const regexNotParen = /[^\(\)]+/;
console.log("hoi()".match(regexNotParen));

const stime = process.hrtime()[1];
console.log(stime);
let result = 0;
for (let i = 0; i < 10000; i++) {
  result += exampleLisp.substring(1, 200).length;
}
console.log((process.hrtime()[1] - stime) / 1000000);
