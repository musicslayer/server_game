M = new Map();

let x = 0;
let y = 1;

let key = [0, 1].join(",");
//M.set([0, 0], 7);
//M.set([1, 0], 8);
//M.set([0, 1], 9);
M.set([1, 1], 10);

M.set(key, 10);

console.log(M);