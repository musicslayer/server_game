const fs = require("fs");
const http = require("http");
const https = require("https");
const url = require("url");

const Constants = require("../constants/Constants.js");
const RateLimit = require("../security/RateLimit.js");

const FAVICON_FILE = "favicon.ico";
const HTML_HOME = "html/index.html";
const HTML_LOGIN = "html/login.html";
const HTML_CREATE_ACCOUNT = "html/create_account.html";
const HTML_CREATE_CHARACTER = "html/create_character.html";
const HTML_CHANGE_PASSWORD = "html/change_password.html";
const HTML_CHANGE_EMAIL = "html/change_email.html";
const HTML_TROUBLESHOOT_ACCOUNT = "html/troubleshoot_account.html";
const HTML_GAME = "html/game.html";
const HTML_IMAGE_CATALOG = "html/ImageCatalog.js";
const HTML_UNZIP_STREAM = "html/UnzipStream.js";
const HTML_SOCKETIO = "html/socket.io.min.js";
const IMAGE_ZIP = "assets/image.zip";

const HTTP_PORT = 80;
const HTTPS_PORT = 443;

class HTTPServer {
    server;
    isHTTPS;

    constructor(certificateData) {
        this.isHTTPS = certificateData === undefined;

        let serverFcn = this.isHTTPS ? http.createServer : https.createServer;
        let serverArgs = this.isHTTPS ? [] : [certificateData];

        this.server = serverFcn(...serverArgs, (req, res) => {
            try {
                let ip = req.socket.remoteAddress
                res.isEnded = false;

                if(RateLimit.isRateLimited("html", ip)) {
                    serveError(res, 400, "Too many HTML requests from this IP address. Please wait and try again.");
                    return;
                }

                // Only allow GET method.
                if(req.method !== "GET") {
                    serveError(res, 400, `Invalid method (${req.method}).`);
                    return;
                }
    
                // Serve pages.
                let pathname = url.parse(req.url, true).pathname;
    
                switch(pathname) {
                    case "/":
                        serveFile(res, "text/html", HTML_HOME);
                        break;

                    case "/login":
                        serveFile(res, "text/html", HTML_LOGIN);
                        break;

                    case "/create_account":
                        serveFile(res, "text/html", HTML_CREATE_ACCOUNT);
                        break;

                    case "/create_character":
                        serveFile(res, "text/html", HTML_CREATE_CHARACTER);
                        break;

                    case "/change_password":
                        serveFile(res, "text/html", HTML_CHANGE_PASSWORD);
                        break;

                    case "/change_email":
                        serveFile(res, "text/html", HTML_CHANGE_EMAIL);
                        break;

                    case "/troubleshoot_account":
                        serveFile(res, "text/html", HTML_TROUBLESHOOT_ACCOUNT);
                        break;

                    case "/game":
                        serveFile(res, "text/html", HTML_GAME);
                        break;

                    case "/favicon.ico":
                        serveFile(res, "image/x-icon", FAVICON_FILE);
                        break;

                    case "/ImageCatalog.js":
                        serveFile(res, "application/javascript", HTML_IMAGE_CATALOG);
                        break;

                    case "/UnzipStream.js":
                        serveFile(res, "application/javascript", HTML_UNZIP_STREAM);
                        break;

                    case "/socket.io.min.js":
                        serveFile(res, "application/javascript", HTML_SOCKETIO);
                        break;

                    case "/images":
                        serveFile(res, "application/zip", IMAGE_ZIP);
                        break;

                    default:
                        serveError(res, 404, "Error 404: Page not found.\n" + pathname);
                        break;
                }
            }
            catch(err) {
                // Print the specific error to the console but do not show it to the client.
                serveError(res, 400, "Error processing request.");
                console.error(err);
            }
        });
    
        this.server.timeout = Constants.server.REQUEST_TIMEOUT;
    }

    async listen() {
        return new Promise((resolve) => {
            let serverPort = this.isHTTPS ? HTTP_PORT : HTTPS_PORT;

            this.server.listen(serverPort, () => {
                resolve();
            });
        });
    }

    terminate() {
        this.server.close();
    }
}

function serveFile(res, contentType, file) {
	if(!res.isEnded) {
		res.isEnded = true;
		res.statusCode = 200;
		res.setHeader("Content-Type", contentType);

        // Use these to disable caching.
        res.setHeader("Surrogate-Control", "no-store");
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Expires", "0");

		fs.createReadStream(file).pipe(res);
	}
}

function serveError(res, statusCode, str) {
	if(!res.isEnded) {
		res.isEnded = true;
		res.statusCode = statusCode;
		res.setHeader("Content-Type", "text/plain");
		res.write(str);
		res.end();
	}
}

module.exports = HTTPServer;