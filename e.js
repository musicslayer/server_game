const SR = require("./SR.js");
let sr = new SR("ABC");

sr.on("readable", () => {
    let chunk;
    while (null !== (chunk = sr.read())) {
        console.log(chunk);
    }
});

sr.on("end", () => {
    console.log("DONE!");
});