const fs = require("fs");
const http = require("http");
const https = require("https");
const url = require("url");

const Constants = require("../constants/Constants.js");
const ErrorPrinter = require("../error/ErrorPrinter.js");
const RateLimit = require("../security/RateLimit.js");

const FAVICON_FILE = "favicon.ico";
const HTML_HOME = "html/index.html";
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

        let serverName = this.isHTTPS ? "HTTP" : "HTTPS";
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
    
                //console.log(serverName + " Serve Page Success: " + pathname);
            }
            catch(err) {
                //console.log(serverName + " Serve Page Failure: " + pathname + "\n" + err);
    
                // TODO Give generic error and log the real error to hide info from the user.
                serveError(res, 400, "Error processing request.\n\n" + ErrorPrinter.createErrorString(err));
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
}

function serveFile(res, contentType, file) {
	if(!res.isEnded) {
		res.isEnded = true;
		res.statusCode = 200;
		res.setHeader("Content-Type", contentType);
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