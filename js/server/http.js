const fs = require("fs");
const http = require("http");
const url = require("url");

const FAVICON_FILE = "favicon.ico";
const HTML_HOME = "html/index.html";

const SERVER_PORT = 80;
const SERVER_REQUEST_TIMEOUT = 30000; // milliseconds

function createHTTPServer() {
	const server = http.createServer((req, res) => {
		res.isEnded = false;

		try {
			// Only allow GET method.
			if(req.method !== "GET") {
				console.log("HTTP Invalid Method " + req.method);

				serveError(res, 400, `Invalid method (${req.method}).`);
				return;
			}

			// Special case for favicon. Use exact match.
			if(req.url === "/favicon.ico") {
				console.log("HTTP Favicon");

				serveFavicon(res);
				return;
			}

			// Serve pages.
			const pathname = url.parse(req.url, true).pathname;

			switch(pathname) {
				case "/": {
					pageName = "Home";
					serveHTML(res, HTML_HOME);
					break;
				}
				default: {
					pageName = "Default";
					serveError(res, 404, "Error 404: Page not found.");
					break;
				}
			}

			console.log("HTTP Serve Page Success " + pageName);
		}
		catch(err) {
			console.log("HTTP Serve Page Failure " + err + pageName);

			serveError(res, 400, "Error processing request.");
		}
	});

	server.timeout = SERVER_REQUEST_TIMEOUT;

	server.listen(SERVER_PORT, () => {
		console.log("HTTP Server Listening On Port " + SERVER_PORT);
	});

	return server;
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

module.exports.createHTTPServer = createHTTPServer;