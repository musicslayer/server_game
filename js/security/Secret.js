const fs = require("fs");
const path = require("path");

// TODO Should all of these files be stored in one place (Constants.js)?
const SECRET_FILE = path.resolve(path.join("secrets", "secrets.json"));

class Secret {
    static secretMap;

    static init() {
        let secretsJSON = fs.readFileSync(SECRET_FILE);
        Secret.secretMap = new Map(Object.entries(JSON.parse(secretsJSON)));

        Secret.secretMap.set("ssl_key", fs.readFileSync("secrets/ssl/_.musicslayer.com.key"));
        Secret.secretMap.set("ssl_cert", fs.readFileSync("secrets/ssl/_.musicslayer.com.crt"));
        Secret.secretMap.set("ssl_ca", fs.readFileSync("secrets/ssl/_.musicslayer.com.issuer.crt"));

        Secret.secretMap.set("dkim_private_key", fs.readFileSync("secrets/dkim/musicslayer.key"));
        Secret.secretMap.set("dkim_key_selector", fs.readFileSync("secrets/dkim/musicslayer.selector"));
    }

    static getSecret(key) {
        return Secret.secretMap.get(key);
    }
}

module.exports = Secret;