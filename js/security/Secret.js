const fs = require("fs");
const path = require("path");

// Do not store any of this information in "Constants.js".
const SECRET_ROOT_FOLDER = path.resolve("secrets");
const SECRET_SSL_PRIVATE_KEY_FILE = path.resolve(path.join(SECRET_ROOT_FOLDER, "ssl", "private-key.pem"));
const SECRET_SSL_CERTIFICATE_FILE = path.resolve(path.join(SECRET_ROOT_FOLDER, "ssl", "certificate.pem"));

class Secret {
    static secretMap;

    static init() {
        Secret.secretMap = new Map();

        if(fs.existsSync(SECRET_ROOT_FOLDER)) {
            Secret.secretMap.set("ssl_private_key", readFileSyncIfExists(SECRET_SSL_PRIVATE_KEY_FILE));
            Secret.secretMap.set("ssl_certificate", readFileSyncIfExists(SECRET_SSL_CERTIFICATE_FILE));
        }
    }

    static getSecret(key) {
        return Secret.secretMap.get(key);
    }
}

function readFileSyncIfExists(filename) {
    if(fs.existsSync(filename)) {
        return fs.readFileSync(filename);
    }
    else {
        return undefined;
    }
}

module.exports = Secret;