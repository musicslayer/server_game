const fs = require("fs");
const http = require("http");
const https = require("https");
const url = require("url");

const ErrorPrinter = require("../error/ErrorPrinter.js");
const RateLimit = require("../security/RateLimit.js");

const FAVICON_FILE = "favicon.ico";
const HTML_HOME = "html/index.html";
const HTML_IMAGE_CATALOG = "html/ImageCatalog.js";
const HTML_UNZIP_STREAM = "html/UnzipStream.js";
const HTML_SOCKETIO = "html/socket.io.min.js";
const IMAGE_ZIP = "assets/image.zip";

const SERVER_REQUEST_TIMEOUT = 30000; // milliseconds

class HTTPServer {
    server;

    constructor(certificateData) {
        let serverName = certificateData === undefined ? "HTTP" : "HTTPS";
        let serverPort = certificateData === undefined ? 80 : 443;
        let serverFcn = certificateData === undefined ? http.createServer : https.createServer;
        let serverArgs = certificateData === undefined ? [] : [certificateData];

        this.server = serverFcn(...serverArgs, (req, res) => {
            let ip = req.socket.remoteAddress
            res.isEnded = false;
    
            try {
                RateLimit.rateLimitTask("html", ip, () => {}, () => {
                    throw("Too many html requests from this IP address. Please wait and try again.");
                });

                // Only allow GET method.
                if(req.method !== "GET") {
                    //console.log(serverName + " Invalid Method " + req.method);
    
                    serveError(res, 400, `Invalid method (${req.method}).`);
                    return;
                }
    
                // Serve pages.
                let pathname = url.parse(req.url, true).pathname;
                //console.log(serverName + " Serve Pathname " + pathname);
    
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
    
                serveError(res, 400, "Error processing request.\n\n" + ErrorPrinter.createErrorString(err));
            }
        });
    
        this.server.timeout = SERVER_REQUEST_TIMEOUT;
    
        this.server.listen(serverPort, () => {
            console.log(serverName + " Server Listening On Port " + serverPort);
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