var PNG = require('png-js');

let folder = "world/map1/bitmap/";

var fs = require('fs');
var files = fs.readdirSync(folder);

var myimage = PNG.load("world/map1/bitmap/0.png");

console.log(myimage);