const net = require("net");
const tls = require("tls");

const Timer = require("./Timer.js");

const ENCODING_SOCKET = "utf8";
const TIMEOUT_SOCKET = 3000; // milliseconds

class Socket {
    static _socketArray = [];

    port;
    host;
    type;

    _hostname;
    _sock;

    static destroySockets() {
        while(Socket._socketArray.length > 0) {
            try {
                Socket._socketArray.pop().destroy();
            }
            finally {
            }
        }
    }

    static async createSocket(port, host, logger, socketOptions) {
        return await Socket.createSocketFromHostArray(port, [host], logger, socketOptions);
    }

    static async createSocketFromHostArray(port, hostArray, logger, socketOptions) {
        let socket = new Socket();
        let [sock, host] = await Socket.createNetSocketFromHostArray(port, hostArray, logger, socketOptions);
        socket._sock = sock;
        socket.host = host;
        socket.port = port;
        socket.type = "net";
        return socket;
    }

    static async createNetSocketFromHostArray(port, hostArray, logger, socketOptions) {
        return new Promise((resolve, reject) => {
            try {
                logger.logMX("MX Finding Connection");

                let sockArray = [];

                let timer = Timer.createTimer(() => {
                    for(let i = 0; i < sockArray.length; i++) {
                        sockArray[i].destroy();
                    }

                    reject(new Error("[" + logger.domain + "] Can not connect to any server on port " + port));
                }, socketOptions?.timeout ?? TIMEOUT_SOCKET);

                for(let i = 0; i < hostArray.length; i++) {
                    let host = hostArray[i];
                    let sock = net.createConnection(port, host);
                    
                    Socket._socketArray.push(sock);
                    sockArray.push(sock);

                    sock.on("connect", () => {
                        if(!timer.isFinished) {
                            timer.finish();

                            logger.logMX("MX Connection Successful: " + host + ":" + port + "\n");

                            sock.removeAllListeners("error");
                            resolve([sock, host]);
                        }
                        else {
                            sock.destroy();
                        }
                    })

                    // Don't reject for individual errors.
                    sock.on("error", (err) => {
                        logger.logMX("MX Connection Failed: " + host + ":" + port);
                        logger.logMX(err + "\n" + err.stack);
                    });
                
                    sock.setEncoding(socketOptions?.encoding ?? ENCODING_SOCKET);
                }
            }
            catch(err) {
                reject(err);
            }
        });
    }

    async upgradeToTLS(socketOptions, tlsOptions, logger) {
        try {
            logger.logMX("Attempting TLS Upgrade...");

            await this.convertNetSocketToTLSSocket(tlsOptions);

            logger.logMX("TLS Upgrade Successful\n");
            this.type = "tls";
        }
        catch(err) {
            logger.logMX("TLS Upgrade Failed\n");

            if(tlsOptions?.strict) {
                // We do not allow any insecure connection, so just error.
                throw(new Error("A secure TLS connection could not be made.",  {cause: err}));
            }
            else {
                // Go back to using an insecure net socket.
                [this._sock, this.host] = await Socket.createNetSocketFromHostArray(this.port, [this.host], logger, socketOptions);
                this.type = "net";
            }
        }
    }

    async convertNetSocketToTLSSocket(tlsOptions) {
        return new Promise((resolve, reject) => {
            try {
                // Pause the net socket and replace it with a secure TLS socket.
                this._sock.pause();

                // Use _hostname instead of host to work around a warning when using IP addresses directly.
                // IP addresses should only appear if they are provided in the dns options.
                this._sock = tls.connect({
                    socket: this._sock,
                    servername: this._hostname,
                    host: this._hostname,
                    key: tlsOptions?.key,
                    cert: tlsOptions?.cert
                });

                Socket._socketArray.push(this._sock);

                this._sock.on("error", function(err) {
                    reject(err);
                });

                this._sock.on("secure", () => {
                    this._sock.removeAllListeners("error");
                    resolve();
                });
            }
            catch(err) {
                reject(err);
            }
        });
    }

    addListener(eventName, eventListener) {
        this._sock.on(eventName, eventListener);
    }

    removeAllListeners(eventName) {
        this._sock.removeAllListeners(eventName);
    }

    emit(eventName, ...arg) {
        this._sock.emit(eventName, ...arg);
    }

    write(s) {
        this._sock.write(s);
    }

    destroy() {
        this._sock.destroy();
    }
}

module.exports = Socket;