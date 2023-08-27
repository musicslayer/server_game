//#EXCLUDE_REFLECTION

const crypto = require("crypto");

const CRLF = "\r\n";

function generateMessageString(mail, domainName) {
    let fromString = mail.from;
    let toString = mail.to.join(", ");
    let subjectString = mail.subject;
    let messageIDString = generateMessageId(domainName);
    let dateString =  generateDate();

    // The body is exactly one of mail.text or mail.html.
    let isText = mail.text !== undefined;
    let isHTML = mail.html !== undefined;
    if((isText && isHTML) || (!isText && !isHTML)) {
        throw(new Error("Exactly one of mail.text or mail.html must be specified."));
    }
    let contentType = isText ? "text/plain" : "text/html";
    let bodyString = isText ? mail.text : mail.html;

    // The transfer encoding is based on the body content, which may need to be modified.
    let transferEncoding = getTransferEncoding(bodyString);
    bodyString = encodeText(bodyString, transferEncoding);

    // Try to make everything obey a line limit of 76 characters.
    return "Content-Type: " + contentType + "; charset=utf-8" + CRLF +
        "From: " + fromString + CRLF +
        foldText("To: " + toString, 76, ",", CRLF) + CRLF +
        foldText("Subject: " + subjectString, 76, " ", CRLF + " ") + CRLF +
        "Message-ID: " + messageIDString + CRLF +
        "Content-Transfer-Encoding: " + transferEncoding + CRLF +
        "Date: " + dateString + CRLF +
        "MIME-Version: 1.0" + CRLF +
        CRLF +
        wrapText(bodyString, 76, CRLF) + CRLF;
}

function getTransferEncoding(str) {
    // Use "7bit" for simple cases and "base64" for everything else.
    let isSimpleText = isPlainText(str) && !hasLongerLines(str, 76);
    return isSimpleText ? "7bit" : "base64";
}

function isPlainText(str) {
    return !/[\x00-\x08\x0b\x0c\x0e-\x1f\u0080-\uFFFF]/.test(str);
}

function hasLongerLines(str, lineLength) {
    if (str.length > 128 * 1024) {
        // do not test strings longer than 128kB
        return true;
    }
    return new RegExp("^.{" + (lineLength + 1) + ",}", "m").test(str);
}

function encodeText(bodyString, transferEncoding) {
    // Only modify "bodyString" if we are using "base64".
    if(transferEncoding === "base64") {
        bodyString = Buffer.from(bodyString).toString("base64");
    }

    return bodyString;
}

function wrapText(str, lineLength, insertChar) {
    // Wrap text into lines with fixed width.
    let pattern = ".{" + lineLength + "}";
    pattern = pattern + "(?!$)"; // Excludes a match at the end
    return str.replace(new RegExp(pattern, "g"), "$&" + insertChar);
}

function foldText(str, lineLength, delimiter, insertChar) {
    // Wrap text into lines ending with a delimiter, keeping them within "lineLength" if possible.
    // However, a single delimited section will not be broken and thus may be longer than "lineLength".
    // The text may or may not end with a delimiter.

    // Look for a match in this order:
    // -> Match the entire string if it is within "lineLength".
    // -> Match up to the furthest delimiter that is within "lineLength".
    // -> Match up to the first delimiter regardless of whether it is within "lineLength".
    // -> Match the entire string regardless of whether it is within "lineLength".
    // Note that the entire text can be broken up into these patterns.
    let pattern1 = "(?:.{1," + lineLength + "}$)";
    let pattern2 = "(?:.{1," + lineLength + "}" + delimiter + ")";
    let pattern3 = "(?:.*?" + delimiter + ")";
    let pattern4 = "(?:.*$)";

    let pattern = "(?:" + pattern1 + "|" + pattern2 + "|" + pattern3 + "|" + pattern4 + ")";
    pattern = pattern + "(?!$)"; // Excludes a match at the end
    return str.replace(new RegExp(pattern, "g"), "$&" + insertChar)
}

function generateDate() {
    return new Date().toUTCString().replace("GMT", "+0000");
}

function generateMessageId(domainName) {
    return "<" + generateUUID() + "@" + domainName + ">";
}

function generateUUID() {
    return crypto.randomBytes(4).toString("hex") + 
    "-" + crypto.randomBytes(2).toString("hex") +
    "-" + crypto.randomBytes(2).toString("hex") +
    "-" + crypto.randomBytes(2).toString("hex") +
    "-" + crypto.randomBytes(6).toString("hex");
}

module.exports = generateMessageString;