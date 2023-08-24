//#EXCLUDE_REFLECTION

const generateDKIMSignature = require("./generateDKIMSignature.js");

const CRLF = "\r\n";

function extractAddress(s) {
    let startIdx = s.indexOf("<");
    let endIdx = s.indexOf(">");
    return s.substring(startIdx + 1, endIdx);
}

function getAddress(address) {
    return address.replace(/^.+</, "").replace(/>\s*$/, "").trim();
}

function getAddresses(addresses) {
    let results = [];
    if(!Array.isArray(addresses)) {
        addresses = addresses.split(",");
    }

    for(let i = 0; i < addresses.length; i++) {
        results.push(getAddress(addresses[i]));
    }
    return results;
}

function getAccount(email) {
    let idx = email.indexOf("@");
    return email.substring(0, idx);
}

function getHost(email) {
    let m = /[^@]+@([\w\d\-\.]+)/.exec(email);
    return m && m[1];
}

function createDomainGroup(mail) {
    // Group recipients by domain.
    let recipients = getRecipients(mail);
    let groups = {};
    let host;
    for(let i = 0; i < recipients.length; i++) {
        host = getHost(recipients[i]);
        (groups[host] || (groups[host] = [])).push(recipients[i])
    }
    return groups;
}

function getRecipients(mail) {
    let recipients = [];
    if(mail.to) {
        recipients = recipients.concat(getAddresses(mail.to));
    }

    if(mail.cc) {
        recipients = recipients.concat(getAddresses(mail.cc));
    }

    if(mail.bcc) {
        recipients = recipients.concat(getAddresses(mail.bcc));
    }

    return recipients;
}

function addDKIMSignatureHeader(message, srcHost, dkimOptions) {
    if(dkimOptions?.privateKey && dkimOptions?.keySelector) {
        let signature = generateDKIMSignature(message, srcHost, dkimOptions.keySelector, dkimOptions.privateKey);
        return signature + CRLF + message;
    }

    return message;
}

module.exports.extractAddress = extractAddress;
module.exports.getAddress = getAddress;
module.exports.getAddresses = getAddresses;
module.exports.getAccount = getAccount;
module.exports.getHost = getHost;
module.exports.createDomainGroup = createDomainGroup;
module.exports.getRecipients = getRecipients;
module.exports.addDKIMSignatureHeader = addDKIMSignatureHeader;