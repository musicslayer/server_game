const fs = require("fs");
const path = require("path");

// Do not store any of this information in "Constants.js".
const SECRET_JSON_FILE = path.resolve(path.join("secrets", "secrets.json"));
const SECRET_SSL_KEY_FILE = path.resolve(path.join("secrets", "ssl", "_.musicslayer.com.key"));
const SECRET_SSL_CERT_FILE = path.resolve(path.join("secrets", "ssl", "_.musicslayer.com.crt"));
const SECRET_SSL_CA_FILE = path.resolve(path.join("secrets", "ssl", "_.musicslayer.com.issuer.crt"));
const SECRET_DKIM_PRIVATE_KEY_FILE = path.resolve(path.join("secrets", "dkim", "musicslayer.key"));
const SECRET_DKIM_SELECTOR_FILE = path.resolve(path.join("secrets", "dkim", "musicslayer.selector"));

class Secret {
    static secretMap;

    static init() {
        Secret.secretMap = new Map();

        let secretsJSON = readFileSyncIfExists(SECRET_JSON_FILE);
        if(secretsJSON !== undefined) {
            let fileEntries = Object.entries(JSON.parse(secretsJSON))
            for(let fileEntry of fileEntries) {
                Secret.secretMap.set(fileEntry[0], fileEntry[1]);
            }
        }

        Secret.secretMap.set("ssl_key", readFileSyncIfExists(SECRET_SSL_KEY_FILE));
        Secret.secretMap.set("ssl_cert", readFileSyncIfExists(SECRET_SSL_CERT_FILE));
        Secret.secretMap.set("ssl_ca", readFileSyncIfExists(SECRET_SSL_CA_FILE));
        Secret.secretMap.set("dkim_private_key", readFileSyncIfExists(SECRET_DKIM_PRIVATE_KEY_FILE));
        Secret.secretMap.set("dkim_key_selector", readFileSyncIfExists(SECRET_DKIM_SELECTOR_FILE));
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