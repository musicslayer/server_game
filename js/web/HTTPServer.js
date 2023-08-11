const fs = require("fs");
const http = require("http");
const url = require("url");

const FAVICON_FILE = "favicon.ico";
const HTML_HOME = "html/index.html";
const HTML_IMAGE_CATALOG = "html/ImageCatalog.js";
const HTML_JSZIP = "html/jszip.min.js";

const SERVER_PORT = 80;
const SERVER_REQUEST_TIMEOUT = 30000; // milliseconds

class HTTPServer {
    server;

    constructor() {
        this.server = http.createServer(async (req, res) => {
            res.isEnded = false;
    
            try {
                // Only allow GET method.
                if(req.method !== "GET") {
                    //console.log("HTTP Invalid Method " + req.method);
    
                    serveError(res, 400, `Invalid method (${req.method}).`);
                    return;
                }
    
                // Special case for favicon. Use exact match.
                if(req.url === "/favicon.ico") {
                    //console.log("HTTP Favicon");
    
                    serveFavicon(res);
                    return;
                }
    
                // Serve pages.
                let pathname = url.parse(req.url, true).pathname;
                //console.log("HTTP Serve Pathname " + pathname);
    
                let pageName;
                switch(pathname) {
                    case "/": {
                        pageName = "Home";
                        serveHTML(res, HTML_HOME);
                        break;
                    }
                    case "/ImageCatalog.js": {
                        pageName = "ImageCatalog";
                        serveJS(res, HTML_IMAGE_CATALOG);
                        break;
                    }
                    case "/jszip.min.js": {
                        pageName = "JSZip";
                        serveJS(res, HTML_JSZIP);
                        break;
                    }
                    case "/images": {
                        pageName = "image";
                        await serveImages(res);
                        break;
                    }
                    default: {
                        pageName = "Default";
                        serveError(res, 404, "Error 404: Page not found.");
                        break;
                    }
                }
    
                //console.log("HTTP Serve Page Success " + pageName);
            }
            catch(err) {
                //console.log("HTTP Serve Page Failure " + pageName + "\n" + err);
    
                serveError(res, 400, "Error processing request.");
            }
        });
    
        this.server.timeout = SERVER_REQUEST_TIMEOUT;
    
        this.server.listen(SERVER_PORT, () => {
            console.log("HTTP Server Listening On Port " + SERVER_PORT);
        });
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

function serveFavicon(res) {
	if(!res.isEnded) {
		res.isEnded = true;
		res.statusCode = 200;
		res.setHeader("Content-Type", "image/x-icon");
		fs.createReadStream(FAVICON_FILE).pipe(res);
	}
}

function serveHTML(res, htmlFile) {
	if(!res.isEnded) {
		res.isEnded = true;
		res.statusCode = 200;
		res.setHeader("Content-Type", "text/html");
		fs.createReadStream(htmlFile).pipe(res);
	}
}

function serveJS(res, htmlFile) {
	if(!res.isEnded) {
		res.isEnded = true;
		res.statusCode = 200;
		res.setHeader("Content-Type", "application/javascript");
		fs.createReadStream(htmlFile).pipe(res);
	}
}

async function serveImages(res) {
	let file = "assets/image.zip";

	if(!res.isEnded) {
		res.isEnded = true;
		res.statusCode = 200;
		res.setHeader("Content-Type", "image/png");

		fs.createReadStream(file).pipe(res);
	}
}

module.exports = HTTPServer;