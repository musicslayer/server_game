const Constants = require("../constants/Constants.js");
const Logger = require("../log/Logger.js");
const Secret = require("../security/Secret.js");
const emailsend = require("./emailsend/emailsend.js");
const dns_util = require("./emailsend/dns_util.js");

class EmailSender {
    static async sendAccountCreationEmail(emailAddress, urlQuery) {
        if(!(await isEmailAddressValid(emailAddress))) {
            return false;
        }
        
        try {
            let url = Constants.server.URL_BASE + "/create_account_verify" + urlQuery;

            let mail = {
                from: Constants.email.EMAIL_FROM,
                to: emailAddress,
                subject: "Account Creation",
                html: "Click the following link to complete the account creation process:<br/>" +
                `<a href=${url}>Finish Account Creation</a>` + 
                getSuffixText()
            };

            let results = await sendEmail(mail);
            let isSuccess = Object.keys(results).length === 0;

            if(isSuccess) {
                //log.logEvent("EMAIL", "main", "Server Email Success", "Account Creation", emailAddress);
            }
            else {
                for(let domain in results) {
                    //log.logError("EMAIL", "main", "Server Email Failure", results[domain], "Account Creation", domain, emailAddress);
                }
            }

            return isSuccess;
        }
        catch(err) {
            //log.logError("EMAIL", "main", "Server Email Failure", err, "Account Creation", emailAddress);
            console.error(err);

            return false;
        }
    }
}

async function sendEmail(mail) {
    return await emailsend.relayEmail(mail, getEmailOptions());
}

function getSuffixText() {
	return "<br/><br/>Please do not reply to this email.<br/>" +
	`If you have any questions or problems, please email the <a href="mailto:${Constants.email.EMAIL_SUPPORT}">support</a> address.`;
}

async function isEmailAddressValid(emailAddress) {
	return isEmailAddressCorrectFormat(emailAddress) && await isEmailAddressDNSActive(emailAddress);
}

function isEmailAddressCorrectFormat(emailAddress) {
	var emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

    if (!emailAddress)
        return false;

    if(emailAddress.length > 254)
        return false;

    var valid = emailRegex.test(emailAddress);
    if(!valid)
        return false;

    // Further checking of some things regex can't handle
    var parts = emailAddress.split("@");
    if(parts[0].length>64)
        return false;

    var domainParts = parts[1].split(".");
    if(domainParts.some((part) => { return part.length > 63; }))
        return false;

    return true;
}

async function isEmailAddressDNSActive(emailAddress) {
	let parts = emailAddress.split("@");
	let domain = parts[1];

	try {
        let serverHostArray = await dns_util.resolveMX(domain, getDNSOptions());
		return serverHostArray.length > 0;
	}
	catch(err) {
		return false;
	}
}

function getDNSOptions() {
    // Return values that will make localhost properly resolve.
    return {
        domainNames: ["dev_mail.musicslayer.com"],
        domainIPs: ["127.0.0.1"]
    }
}

function getEmailOptions() {
    return {
        // ??? Only needed when sending emails to ourselves.
        dns: getDNSOptions(),
        
        dkim: {
            privateKey: Secret.getSecret("dkim_private_key"),
            keySelector: Secret.getSecret("dkim_key_selector")
        },

        tls: {
            key: Secret.getSecret("ssl_key"),
            cert: Secret.getSecret("ssl_cert")
        },

        logger: {
            logFcn: (str) => { Logger.logEvent("EMAIL", "main", "Email Communication", str); }
        }
    }
}

module.exports = EmailSender;