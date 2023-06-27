const MyClass = require("./MyClass.js");
const MyClass2 = require("./MyClass2.js");

let obj = new MyClass();
let obj2 = new MyClass();
let obj3 = new MyClass();

let map = new Map();
map.set("a", obj);
map.set("b", obj2);
map.set("c", obj3);

for(let key of map.keys()) {
    if(map.get(key) === obj3) {
        map.delete(key);
    }
}

console.log(map);