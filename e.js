

let s = "\\u";
let e = escape(s)
let u = unescape(e);

console.log(s === u);

function escape(s) {
    let e = "";
    
    for(let i = 0; i < s.length; i++) {
        let c = s.charCodeAt(i);

        // Escape ", \, and all control characters
        if(c === 34 || c === 92 || c <= 31) {
            e += "\\u" + c.toString(16, 4).padStart(4, "0");
        }
        else {
            e += s.charAt(i);
        }
    }

    return e;
}

function unescape(e) {
    let s = "";
    for(let i = 0; i < e.length; i++) {
        let c = e.charAt(i);

        // Only unescape \uXXXX
        if(c === "\\" && e.charAt(i + 1) === "u") {
            s += String.fromCharCode(parseInt(e.substring(i + 2, i + 6), 16));

            // Skip 5 more characters
            i += 5
        }
        else {
            s += c;
        }
    }

    return s;
}