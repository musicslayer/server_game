const url = require("url");

// TODO Use this when we implement creating an account?
class URLParser {
    static getURLParameter(_url, param) {
        const queryObject = url.parse(_url, true).query;
        return queryObject[param];
    }

    static isValidQuery(_url, requiredKeys, optionalKeys) {
        // Check for expected and optional query keys (order does not matter, but case and count do).
        const queryObject = url.parse(_url, true).query;

        for(let rk = 0; rk < requiredKeys.length; rk++) {
            requiredKey = requiredKeys[rk];

            // Each required option must appear exactly one time.
            if(typeof(queryObject[requiredKey]) !== "string") {
                return false;
            }

            delete(queryObject[requiredKey]);
        }

        for(let ok = 0; ok < optionalKeys.length; ok++) {
            optionalKey = optionalKeys[ok];

            // Each optional option must be absent or appear one time.
            if(typeof(queryObject[optionalKey]) !== "undefined" && typeof(queryObject[optionalKey]) !== "string") {
                return false;
            }

            delete(queryObject[optionalKey]);
        }

        // If any extra options are there, the query is invalid.
        if(Object.keys(queryObject).length > 0) {
            return false;
        }

        return true;
    }
}

module.exports = URLParser;