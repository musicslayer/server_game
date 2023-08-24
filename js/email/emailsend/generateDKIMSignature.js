//#EXCLUDE_REFLECTION

const crypto = require("crypto");

// All listed fields from RFC4871 #5.5
// Some providers do not like Message-Id, Date, Bounces-To and Return-Path
// fields in DKIM signed data so these are not included.
// Also all entries are in their canonical form for DKIM signing.
const DKIM_FIELD_NAMES = ["from", "sender", "reply-to", "subject", "to",
"cc", "mime-version", "content-type", "content-transfer-encoding", "content-id",
"content-description", "resent-date", "resent-from", "resent-sender",
"resent-to", "resent-cc", "resent-message-id", "in-reply-to", "references",
"list-id", "list-help", "list-unsubscribe", "list-subscribe", "list-post",
"list-owner", "list-archive"];

const CRLF = "\r\n";

function generateDKIMSignature(email, domainName, keySelector, privateKey) {
    // Separate the headers from the body.
    let separator = CRLF + CRLF;
    let idx = email.indexOf(CRLF + CRLF);
    let headers = email.substr(0, idx);
    let body = email.substring(idx + separator.length);

    // Canonicalize the headers before using them in the signature.
    let canonicalizedHeaderData = canonicalizeRelaxHeaders(headers);
    let reducedHeaderData = reduceHeaderData(canonicalizedHeaderData);
    let reducedFieldNames = reducedHeaderData.fieldNames.join(":");
    let reducedHeaders = reducedHeaderData.headers.join(CRLF) + CRLF;

    // Canonicalize the body before using it in the signature.
    let canonicalizedBody = canonicalizeRelaxBody(body);
    let canonicalizedBodyHash = hash("sha256", canonicalizedBody, "base64");
    
    // Generate a DKIM header to add to the others.
    let dkimInfo = [
        "v=1",
        "a=rsa-sha256",
        "c=relaxed/relaxed",
        "d=" + domainName,
        "q=dns/txt",
        "s=" + keySelector,
        "bh=" + canonicalizedBodyHash,
        "h=" + reducedFieldNames
    ].join("; ");

    reducedHeaders += "dkim-signature:" + dkimInfo + "; b=";
    let signature = sign("RSA-SHA256", reducedHeaders, privateKey, "base64");

    return "DKIM-Signature: " + dkimInfo + "; b=" + signature;
}

function hash(algorithm, str, encoding) {
    return crypto.createHash(algorithm).update(str).digest(encoding);
}

function sign(algorithm, str, privateKey, encoding) {
    return crypto.createSign(algorithm).update(str).sign(privateKey, encoding);
}

function canonicalizeRelaxHeaders(headers) {
    // Canonicalize the headers with the relax algorithm.
    let canonicalizedHeaderData = {
        fieldNames: [],
        headers: []
    }

    let headerArray = headers.split(CRLF);
    for(let header of headerArray) {
        let parts = header.split(":");
        let key = parts[0].toLowerCase().trim();
        let value = parts[1].replace(/\s+/g, " ").trim(); // only single spaces

        canonicalizedHeaderData.fieldNames.push(key);
        canonicalizedHeaderData.headers.push(key + ":" + value);
    }

    return canonicalizedHeaderData;
}

function reduceHeaderData(headerData) {
    // Only use allowed headers and put them in the expected order.
    let reducedHeaderData = {
        fieldNames: [],
        headers: []
    }

    for(let i = 0; i < DKIM_FIELD_NAMES.length; i++) {
        let fieldName = DKIM_FIELD_NAMES[i];
        let idx = headerData.fieldNames.indexOf(fieldName);
        if(idx !== -1) {
            reducedHeaderData.fieldNames.push(headerData.fieldNames[idx]);
            reducedHeaderData.headers.push(headerData.headers[idx]);
        }
    }

    return reducedHeaderData;
}

function canonicalizeRelaxBody(body) {
    // Canonicalize the body with the relax algorithm.

    // Replace \r and \r\n with \n
    body = body.replace(/\r?\n|\r/g, "\n");

    // Split by \n and then for each part, right-trim whitespace and replace any contiguous spaces with a single space.
    body = body.split("\n").map(function(line) {
        return line.replace(/\s*$/, ""). //rtrim
        replace(/\s+/g, " "); // only single spaces
    }).join("\n");

    // Replace contiguous \n at the end with a single \n
    body = body.replace(/\n*$/, "\n");

    // Replace \n with \r\n
    body = body.replace(/\n/g, "\r\n");

    return body;
}

module.exports = generateDKIMSignature;