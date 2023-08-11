const fs = require("fs");
const http = require("http");
const url = require("url");

const FAVICON_FILE = "favicon.ico";
const HTML_HOME = "html/index.html";
const HTML_IMAGE_CATALOG = "html/ImageCatalog.js";
const HTML_JSZIP = "html/jszip.min.js";
const HTML_SOCKETIO = "html/socket.io.min.js";
const IMAGE_ZIP = "assets/image.zip";

const SERVER_PORT = 80;
const SERVER_REQUEST_TIMEOUT = 30000; // milliseconds

class HTTPServer {
    server;

    constructor() {
        this.server = http.createServer((req, res) => {
            res.isEnded = false;
    
            try {
                // Only allow GET method.
                if(req.method !== "GET") {
                    //console.log("HTTP Invalid Method " + req.method);
    
                    serveError(res, 400, `Invalid method (${req.method}).`);
                    return;
                }
    
                // Serve pages.
                let pathname = url.parse(req.url, true).pathname;
                //console.log("HTTP Serve Pathname " + pathname);
    
                switch(pathname) {
                    case "/": {
                        serveFile(res, "text/html", HTML_HOME);
                        break;
                    }
                    case "/favicon.ico": {
                        serveFile(res, "image/x-icon", FAVICON_FILE);
                        break;
                    }
                    case "/ImageCatalog.js": {
                        serveFile(res, "application/javascript", HTML_IMAGE_CATALOG);
                        break;
                    }
                    case "/jszip.min.js": {
                        serveFile(res, "application/javascript", HTML_JSZIP);
                        break;
                    }
                    case "/socket.io.min.js": {
                        serveFile(res, "application/javascript", HTML_SOCKETIO);
                        break;
                    }
                    case "/images": {
                        serveFile(res, "application/zip", IMAGE_ZIP);
                        break;
                    }
                    default: {
                        serveError(res, 404, "Error 404: Page not found.\n" + pathname);
                        break;
                    }
                }
    
                //console.log("HTTP Serve Page Success: " + pathname);
            }
            catch(err) {
                //console.log("HTTP Serve Page Failure: " + pathname + "\n" + err);
    
                serveError(res, 400, "Error processing request.");
            }
        });
    
        this.server.timeout = SERVER_REQUEST_TIMEOUT;
    
        this.server.listen(SERVER_PORT, () => {
            console.log("HTTP Server Listening On Port " + SERVER_PORT);
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