//#EXCLUDE_REFLECTION

const Logger = require("./Logger.js");
const EmailProcessor = require("./EmailProcessor.js");
const Socket = require("./Socket.js");
const Timer = require("./Timer.js");

const dnsUtil = require("./dns_util.js");
const emailUtil = require("./email_util.js");
const generateMessageString = require("./generateMessageString.js");

const RELAY_LMTP_PORT = 24;
const RELAY_SMTP_PORT = 25;

/*
*   Options:
*       auth.accessToken
*       auth.authMethod
*       auth.pass
*       auth.user
*
*       dkim.privateKey
*       dkim.keySelector
*
*       dns.domainIPs
*       dns.domainNames
*       dns.numTries
*       dns.timeout
*
*       email.crlfClient
*       email.crlfServer
*       email.isLMTP
*       email.timeout
*
*       logger.isColor
*       logger.logFcn
*
*       socket.encoding
*       socket.timeout
*
*       tls.cert
*       tls.key
*       tls.strict
*
*/

async function relayEmail(mail, options) {
    isRelay = true;
    serverPort = options?.email?.isLMTP ? RELAY_LMTP_PORT : RELAY_SMTP_PORT;
    serverHost = undefined;
    return await transmitEmail(isRelay, mail, serverPort, serverHost, options);
}

async function sendEmail(mail, serverPort, serverHost, options) {
    isRelay = false;
    return await transmitEmail(isRelay, mail, serverPort, serverHost, options);
}

async function transmitEmail(isRelay, mail, serverPort, serverHost, options) {
    try {
        return await _transmitEmail(isRelay, mail, serverPort, serverHost, options); 
    }
    finally {
        // Failsafe cleanup to make sure nodejs execution can actually complete.
        Socket.destroySockets();
        Timer.destroyTimers();
    }
}

async function _transmitEmail(isRelay, mail, serverPort, serverHost, options) {
    dnsUtil.validateOptions(options?.dns)

    let from = emailUtil.getAddress(mail.from);
    let srcHost = emailUtil.getHost(from);

    let message = generateMessageString(mail, srcHost);
    message = emailUtil.addDKIMSignatureHeader(message, srcHost, options?.dkim);

    let results = {};
    let promiseArray = [];
    let groups = {};

    if(isRelay) {
        // Send all the emails grouped by domain.
        groups = emailUtil.createDomainGroup(mail);
        for(let domain in groups) {
            promiseArray.push(processDomain(domain));
        }
    }
    else {
        // Send all the emails at once.
        let domain = "email";
        groups[domain] = emailUtil.getRecipients(mail);
        promiseArray.push(processDomain(domain));
    }

    await Promise.all(promiseArray);

    return results;

    async function processDomain(domain) {
        try {
            await sendToServer(isRelay, serverPort, serverHost, domain, options, srcHost, from, groups[domain], message);
        }
        catch(err) {
            // Only assign results for domains that produced errors.
            results[domain] = err;
        }
    }
}

async function sendToServer(isRelay, serverPort, serverHost, domain, options, srcHost, from, recipients, message) {
    let logger = new Logger(domain, options?.logger);

    // Create a net socket and try to upgrade it to TLS before doing anything.
    // This upgrade attempt is optional unless the user set the tls.strict option.
    let socket = await connectMX(isRelay, serverPort, serverHost, domain, options, logger);
    socket._hostname = dnsUtil.convertToName(socket.host, options?.dns);
    await socket.upgradeToTLS(options?.socket, options?.tls, logger);

    // Communicate with the server to send the email.
    let processor = new EmailProcessor(socket, logger, options);
    await processor.processTransaction(srcHost, from, recipients, message);
}

async function connectMX(isRelay, serverPort, serverHost, domain, options, logger) {
    if(isRelay) {
        // We are relaying the emails ourselves so we need to search the MX records to find a host to connect to.
        logger.logMX("MX DNS Resolving...");

        let serverHostArray = await dnsUtil.resolveMX(domain, options?.dns);

        logger.logMX("MX DNS Resolved:");
        for(let smptHost of serverHostArray) {
            logger.logMX("    " + smptHost);
        }

        return await Socket.createSocketFromHostArray(serverPort, serverHostArray, logger, options?.socket);
    }
    else {
        // Always use the host provided regardless of the domain we are actually emailing to.
        // Useful for when we are asking another server to do the email relaying for us.
        return await Socket.createSocket(serverPort, serverHost, logger, options?.socket);
    }
}

module.exports.relayEmail = relayEmail;
module.exports.sendEmail = sendEmail;
module.exports.transmitEmail = transmitEmail;