let map = new Map();

let f = (m) => {
    console.log(m);
}

let s = f.toString();

let f2 = new Function('return ' + s);
let f3 = f2()

f3(map);