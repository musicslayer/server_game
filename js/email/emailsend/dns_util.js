//#EXCLUDE_REFLECTION

const dns = require("dns");

const DNS_SERVERS = [
    "1.1.1.1", // Cloudflare
    "8.8.4.4", // Google
    "8.8.8.8", // Google
    "208.67.220.220", // OpenDNS
    "208.67.222.222" // OpenDNS
];

const TIMEOUT_DNS = 3000; // milliseconds
const TRIES_DNS = 1;

function validateOptions(dnsOptions) {
    // If the dns options are present, the two fields must contain an array of equal length.
    if(!dnsOptions) {
        return;
    }

    let isValid = 
        dnsOptions?.domainNames && dnsOptions?.domainIPs &&
        Array.isArray(dnsOptions.domainNames) && Array.isArray(dnsOptions.domainIPs) &&
        dnsOptions.domainNames.length == dnsOptions.domainIPs.length;

    if(!isValid) {
        throw(new Error("Invalid DNS Options"));
    }
}

function convertToName(host, dnsOptions) {
    // If host is an IP provided in the dns options, convert it to a name. Otherwise return host unaltered.
    let idx = dnsOptions ? dnsOptions.domainIPs.indexOf(host) : -1;
    if(idx != -1) {
        return dnsOptions.domainNames[idx];
    }
    return host;
}

function convertToIP(host, dnsOptions) {
    // If host is a name provided in the dns options, convert it to an IP. Otherwise return host unaltered.
    let idx = dnsOptions ? dnsOptions.domainNames.indexOf(host) : -1;
    if(idx != -1) {
        return dnsOptions.domainIPs[idx];
    }
    return host;
}

async function resolveMX(domain, dnsOptions) {
    // Immediately resolve any domains provided in the dns options.
    let host = convertToIP(domain, dnsOptions);
    if(host != domain) {
        return([host]);
    }

    // Try as many DNS servers in parallel as we can until one succeeds, ignoring any errors.
    servers = Array.from(new Set(DNS_SERVERS.concat(dns.getServers())));

    let promiseArray = [];
    for(let i = 0; i < servers.length; i++) {
        promiseArray[i] = resolveMXWithServer(i);
    }

    let data;

    try {
        data = await Promise.any(promiseArray);
    }
    catch(err) {
        throw(new Error("<" + domain + "> Can not resolve MX"));
    }

    // Before returning we sort by priority and extract hosts into an array.
    data.sort(function(a, b) { return a.priority - b.priority });
    return data.map((x) => { return x.exchange; });

    async function resolveMXWithServer(i) {
        let resolver = new dns.promises.Resolver({
            timeout: dnsOptions?.timeout ?? TIMEOUT_DNS, 
            tries: dnsOptions?.numTries ?? TRIES_DNS
        });

        resolver.setServers([servers[i]]);

        return await resolver.resolveMx(domain);
    }
}

module.exports.validateOptions = validateOptions;
module.exports.convertToName = convertToName;
module.exports.convertToIP = convertToIP;
module.exports.resolveMX = resolveMX;