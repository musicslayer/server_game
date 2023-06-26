const MyClass = require("./MyClass.js");
const MyClass2 = require("./MyClass2.js");

let obj = new MyClass();
obj.a = 1;
obj.R = new MyClass2();
let s = JSON.parse(JSON.stringify(obj));

let dObj = new MyClass(s)

console.log(s);
console.log(dObj);