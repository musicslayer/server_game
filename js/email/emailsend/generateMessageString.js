//#EXCLUDE_REFLECTION

const crypto = require("crypto");

const CRLF = "\r\n";

function generateMessageString(mail, domainName) {
    let fromString = mail.from;
    let toString = mail.to.join(", ");
    let subjectString = mail.subject;
    let messageIDString = _generateMessageId(domainName);
    let dateString =  _generateDate();
    let bodyString = mail.text;

    return "Content-Type: text/plain; charset=utf-8" + CRLF +
        "From: " + fromString + CRLF +
        "To: " + toString + CRLF +
        "Subject: " + subjectString + CRLF +
        "Message-ID: " + messageIDString + CRLF +
        "Content-Transfer-Encoding: 7bit" + CRLF +
        "Date: " + dateString + CRLF +
        "MIME-Version: 1.0" + CRLF +
        CRLF +
        bodyString + CRLF;
}

function _generateDate() {
    return new Date().toUTCString().replace("GMT", "+0000");
}

function _generateMessageId(domainName) {
    return "<" + _generateUUID() + "@" + domainName + ">";
}

function _generateUUID() {
    return crypto.randomBytes(4).toString("hex") + 
    "-" + crypto.randomBytes(2).toString("hex") +
    "-" + crypto.randomBytes(2).toString("hex") +
    "-" + crypto.randomBytes(2).toString("hex") +
    "-" + crypto.randomBytes(6).toString("hex");
}

module.exports = generateMessageString;