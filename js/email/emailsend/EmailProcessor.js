const crypto = require("crypto");

const Timer = require("./Timer.js");

const emailUtil = require("./email_util.js");

const CRLF_CLIENT = "\r\n";
const CRLF_SERVER = "\r\n";
const TIMEOUT_EMAIL = 30000; // milliseconds

class EmailProcessor {
    socket;
    logger;
    authOptions;
    emailOptions;
    socketOptions;
    tlsOptions;

    crlfClient;
    crlfServer;

    message;
    numRecipientsToProcess;

    capabilities = [];
    emailQueue = [];
    loginQueue = [];
    handshakeQueue = [];
    authCmd;
    msgBuffer = "";
    msgError;

    // * indicates terminal state.
    recipientState = "initial"; // initial, in-progress, done*
    socketState; // initial, in-progress, net*, tls*

    _completeListener;
    _dataListener;
    _errorListener;

    constructor(socket, logger, options) {
        this.socket = socket;
        this.logger = logger;
        this.authOptions = options?.auth;
        this.emailOptions = options?.email;
        this.socketOptions = options?.socket;
        this.tlsOptions = options?.tls;

        this.crlfClient = this.emailOptions?.crlfClient ?? CRLF_CLIENT;
        this.crlfServer = this.emailOptions?.crlfServer ?? CRLF_SERVER;

        this.socketState = this.socket.type == "tls" ? "tls" : "initial";
    }

    async processTransaction(srcHost, from, recipients, message) {
        return new Promise((resolve, reject) => {
            let timer;

            try {
                timer = Timer.createTimer(() => {
                    this.socket.destroy();
                    reject(new Error("Email Transaction Timeout"));
                }, this.emailOptions?.timeout ?? TIMEOUT_EMAIL);

                this.message = message;

                // For LMTP, each recipient can pass/fail individually, whereas for SMTP the group passes or fails together.
                // Also, LMTP and SMTP have different handshake commands.
                if(this.emailOptions?.isLMTP) {
                    this.numRecipientsToProcess = recipients.length;
                    this.handshakeQueue.push("LHLO " + srcHost);
                }
                else {
                    this.numRecipientsToProcess = 1;
                    this.handshakeQueue.push("EHLO " + srcHost);
                    this.handshakeQueue.push("HELO " + srcHost); // Fallback for older servers.
                }

                // Initialize email queue of commands.
                this.emailQueue.push("MAIL FROM:<" + from + ">");

                for(let i = 0; i < recipients.length; i++) {
                    this.emailQueue.push("RCPT TO:<" + recipients[i] + ">");
                }

                this.emailQueue.push("DATA");

                // Add the socket listeners. This will allow us to read the server's initial response and start the process.
                this._completeListener = () => {
                    timer.finish();
                    this.socket.destroy();

                    resolve();
                }

                this._dataListener = async (data) => {
                    await this.readFromSocket(data).catch((err) => {
                        timer.finish();
                        this.socket.destroy();

                        reject(err);
                    });
                }

                this._errorListener = (err) => {
                    timer.finish();
                    this.socket.destroy();

                    reject(err);
                }

                this.socket.removeAllListeners();
                this.socket.addListener("complete", this._completeListener);
                this.socket.addListener("data", this._dataListener);
                this.socket.addListener("error", this._errorListener);
            }
            catch(err) {
                timer.finish();
                this.socket.destroy();
                
                reject(err);
            }
        });
    }

    async processState(code, msg) {
        if(this.recipientState != "in-progress") {
            switch(code) {
                case 211: // system status or help.
                case 214: // help
                    // Do nothing.
                    break;

                case 220: // on server ready
                    if(this.socketState === "in-progress") {
                        // Switch the socket to a secure one. The upgrade must succeed regardless of the user's strict option.
                        this.socket.removeAllListeners();

                        await this.socket.upgradeToTLS(this.socketOptions, {...this.tlsOptions, ...{strict: true}}, this.logger);

                        this.socket.addListener("complete", this._completeListener);
                        this.socket.addListener("data", this._dataListener);
                        this.socket.addListener("error", this._errorListener);

                        this.socketState = "tls"
                    }

                    this.writeToSocket(this.handshakeQueue.shift());

                    break;

                case 221: // bye
                    // This happens after a QUIT command.
                    if(this.msgError) {
                        this.socket.emit("error", this.msgError);
                    }
                    else {
                        this.socket.emit("complete");
                    }
                    break;

                case 235: // verify ok
                case 250: // operation OK
                    // Capabilities may change over time, so be sure to update them whenever they are presented.
                    this.processCapabilities(msg);

                    if(this.socketState != "net" && this.socketState != "tls") {
                        if(this.tlsOptions && this.capabilities.includes("STARTTLS")) {
                            this.socketState = "in-progress";
                            this.writeToSocket("STARTTLS");
                            break;
                        }
                        else {
                            // An upgrade is not possible.
                            this.socketState = "net";
                        }
                    }

                    // Fall through

                case 251: // forward
                    if(this.emailQueue.length == 0) {
                        this.socket.emit("complete");
                        break;
                    }

                    if(this.authCmd && this.capabilities.includes("AUTH")) {
                        // Do authentication now before progressing with the email queue.
                        this.writeToSocket(this.authCmd);
                    }
                    else {
                        this.writeToSocket(this.emailQueue.shift());
                    }

                    break;

                case 334: // input login
                    // In some cases, the login credentials may depend on the server response.
                    if(this.loginQueue.length == 0) {
                        this.processLoginInfo(msg);

                        if(this.loginQueue.length == 0) {
                            this.msgError = new Error("Could not provide login information\nauthCmd: " + this.authCmd + "\nmsg: " + msg);
                            this.writeToSocket("QUIT");
                            break;
                        }
                    }

                    this.writeToSocket(this.loginQueue.shift());

                    break;

                case 354: // write email message, ending with . (dot)
                    this.writeToSocket(this.message);
                    this.writeToSocket("");
                    this.writeToSocket(".");

                    this.recipientState = "in-progress";
                    break;

                default:
                    if(this.handshakeQueue.length > 0) {
                        this.writeToSocket(this.handshakeQueue.shift());
                        break;
                    }

                    if(code >= 400) {
                        // If an error occurs after the initial handshake then give up immediately.
                        this.msgError = new Error(msg);
                        this.writeToSocket("QUIT");
                    }
                    else {
                        // Codes below 400 are not errors so we can keep going, but we still warn because the process may not have completed as intended.
                        console.warn("Unknown Server Code: " + code + "\n" + msg);
                    }
            }
        }
        else {
            // We may receive multiple lines at once, even with different server codes.
            let lines = this.msgBuffer.split(this.crlfServer);
            for(let i = 0; i < lines.length - 1; i++) {
                let line = lines[i];
                let lineCode = parseInt(line.substring(0, 3));

                // We only care if the code is 400+ or not.
                if(lineCode >= 400) {
                    if(this.emailOptions?.isLMTP) {
                        // In LMTP each recipient may pass/fail separately, so keep track of each separate error.
                        // Do not assume the order that we receive the responses.
                        let recipientAccount = emailUtil.getAccount(emailUtil.extractAddress(line));

                        if(!this.msgError) {
                            this.msgError = {};
                        }
                        this.msgError[recipientAccount] = new Error(line);
                    }
                    else {
                        this.msgError = new Error(msg);
                    }
                }

                this.numRecipientsToProcess--;
                if(this.numRecipientsToProcess == 0) {
                    this.recipientState = "done";
                    this.writeToSocket("QUIT");
                }
            }
        }
    }

    processCapabilities(msg) {
        // Keep track of certain capabilities that the server has revealed to us.
        this.capabilities = [];

        let lines = msg.split(this.crlfServer);
        
        for(let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // STARTTLS allows us to upgrade a NET connection to a secure TLS one.
            if(this.hasCapability(line, "STARTTLS")) {
                this.capabilities.push("STARTTLS");
            }

            // Authentication may be needed before issuing other commands.
            if(this.hasCapability(line, "AUTH")) {
                this.capabilities.push("AUTH");
                this.processAuthInfo(line);
            }
        }
    }

    processAuthInfo(line) {
        // Select the first authentication method that we have the credentials for, if any.
        this.authCmd = undefined;
        this.loginQueue = [];

        // Support overriding the authentication method. Proper authentication credentials are still required.
        if(this.authOptions?.authMethod) {
            line = this.authOptions.authMethod;
        }

        if(line.includes("PLAIN")) {
            if(this.authOptions?.user && this.authOptions?.pass){
                this.authCmd = "AUTH PLAIN";
                this.loginQueue.push(Buffer.from("\u0000" + this.authOptions.user + "\u0000" + this.authOptions.pass).toString("base64"));
                return;
            }
        }

        if(line.includes("LOGIN")) {
            if(this.authOptions?.user && this.authOptions?.pass){
                this.authCmd = "AUTH LOGIN";
                this.loginQueue.push(Buffer.from(this.authOptions.user).toString("base64"));
                this.loginQueue.push(Buffer.from(this.authOptions.pass).toString("base64"));
                return;
            }
        }

        if(line.includes("CRAM-MD5")) {
            if(this.authOptions?.user && this.authOptions?.pass){
                // Require a username and a password, but don't use them here.
                // Login info will be added later because we need the server to give us a challenge string.
                this.authCmd = "AUTH CRAM-MD5";
                return;
            }
        }

        if(line.includes("XOAUTH2")) {
            // For XOAUTH2, the AUTH command itself must contain the token. Do not fill in login information.
            if(this.authOptions?.user && this.authOptions?.accessToken){
                let authData = ["user=" + this.authOptions.user, "auth=Bearer " + this.authOptions.accessToken, "", ""];
                let token = Buffer.from(authData.join("\x01"), "utf-8").toString("base64");

                this.authCmd = "AUTH XOAUTH2 " + token;
                return;
            }
        }
    }

    processLoginInfo(msg) {
        if(this.authCmd == "AUTH CRAM-MD5") {
            /**
             * Handle the response for AUTH CRAM-MD5 command. We are expecting
             * '334 <challenge string>'. Data to be sent as response needs to be
             * base64 decoded challenge string, MD5 hashed using the password as
             * a HMAC key, prefixed by the username and a space, and finally all
             * base64 encoded again.
             */

            // msg should be a single line starting with "334 " and ending with CRLF
            let challengeMatch = msg.trim().substr(4);

            if(!challengeMatch) {
                return;
            } 

            // Challenge string is always the second match.
            let challengeString = challengeMatch[1];

            // Decode from base64
            let base64decoded = Buffer.from(challengeString, "base64").toString("ascii");
            let hmacMD5 = crypto.createHmac("md5", this.authOptions.pass);

            hmacMD5.update(base64decoded);
            let prepended = this.authOptions.user + " " + hmacMD5.digest("hex");

            this.loginQueue.push(Buffer.from(prepended).toString("base64"));
        }

        // Other authentication methods do not need to add any login information here.
    }

    hasCapability(line, capability) {
        return line.startsWith("250 " + capability) || line.startsWith("250-" + capability);
    }

    async readFromSocket(data) {
        // Input data could be either a string or a Buffer array.
        // A server response is incomplete if the last code has a dash after (###-) or the last line does not end with CRLF.
        // A server response is complete if the last code has no character after (###) or a space after (### ) and the last line ends with CRLF.
        this.logger.logReceive("\n" + data + "\n");

        this.msgBuffer += (data + "");
        if(!this.msgBuffer.endsWith(this.crlfServer)) {
            return;
        }

        let lines = this.msgBuffer.split(this.crlfServer);
        let lastLine = lines[lines.length - 2];
        if(lastLine && (lastLine.length == 3 || lastLine[3] == " ")) {
            let serverCode = parseInt(lastLine.substring(0, 3));
            await this.processState(serverCode, this.msgBuffer);
            this.msgBuffer = "";
        }
    }

    writeToSocket(data) {
        this.logger.logSend("\n" + data + "\n");
        this.socket.write(data + this.crlfClient);
    }
}

module.exports = EmailProcessor;

/*
*   Server Status Codes:
*       211   System status, or system help reply
*       214   Help message
*       220   Service Ready
*       221   Service closing transmission channel i.e. Goodbye
*       235   Authentication succeeded
*       250   Requested mail action okay, completed
*       251   User not local; will forward
*       334   Server challenge - the text part contains the Base64-encoded challenge
*       354   Start mail input
*       400+  Error codes
*
*/