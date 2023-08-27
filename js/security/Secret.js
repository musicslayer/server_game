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
        let secretsJSON = fs.readFileSync(SECRET_JSON_FILE);
        Secret.secretMap = new Map(Object.entries(JSON.parse(secretsJSON)));

        Secret.secretMap.set("ssl_key", fs.readFileSync(SECRET_SSL_KEY_FILE));
        Secret.secretMap.set("ssl_cert", fs.readFileSync(SECRET_SSL_CERT_FILE));
        Secret.secretMap.set("ssl_ca", fs.readFileSync(SECRET_SSL_CA_FILE));
        Secret.secretMap.set("dkim_private_key", fs.readFileSync(SECRET_DKIM_PRIVATE_KEY_FILE));
        Secret.secretMap.set("dkim_key_selector", fs.readFileSync(SECRET_DKIM_SELECTOR_FILE));
    }

    static getSecret(key) {
        return Secret.secretMap.get(key);
    }
}

module.exports = Secret;