import crypto from "crypto";
import config from "../config/config.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const jsrsasign = require("jsrsasign");
/**
 * Generate timestamp in seconds
 */


/**
 * Sanitize title
 */
function sanitizeTitle(title) {
    if (!title) return "";
    const sanitized = title.replace(/[~`!#$%^*()\-+=|/<>?;:"\\[\]{}\\&]/g, '');
    return sanitized.trim().substring(0, 512);
}

/**
 * Validate title
 */
function validateTitle(title) {
    if (!title || title.trim().length === 0) {
        throw new Error("Title is required and cannot be empty");
    }
    const disallowedPattern = /[~`!#$%^*()\-+=|/<>?;:"\\[\]{}\\&]/;
    if (disallowedPattern.test(title)) {
        throw new Error("Title contains invalid characters.");
    }
    if (title.length > 512) {
        throw new Error("Title must be 512 characters or less");
    }
    return true;
}

/**
 * Validate amount
 */
function validateAmount(amount) {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) throw new Error("Amount must be a valid number");
    if (amountNum <= 0) throw new Error("Amount must be greater than 0");
    const amountStr = amount.toString();
    const decimalPart = amountStr.split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
        throw new Error("Amount can have maximum 2 decimal places");
    }
    return true;
}

/**
 * Recursively sort object keys
 * This is CRITICAL for consistent JSON stringification
 */
function sortObject(obj) {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }

    return Object.keys(obj).sort().reduce((sorted, key) => {
        sorted[key] = sortObject(obj[key]);
        return sorted;
    }, {});
}

/**
 * Clean private key format
 * Supports both PKCS#1 (BEGIN RSA PRIVATE KEY) and PKCS#8 (BEGIN PRIVATE KEY) formats.
 * If the key already has a PEM header, it is returned as-is.
 * Keys with the PKCS#8 body prefix (MIIEvgIBADANBgkq...) must use PKCS#8 headers.
 */
function formatPrivateKey(key) {
    // Already has a valid PEM header — return unchanged
    if (key.includes("-----BEGIN PRIVATE KEY-----") || key.includes("-----BEGIN RSA PRIVATE KEY-----")) {
        return key;
    }
    // Raw key body without header: default to PKCS#8 wrapper
    return `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
}

/**
 * Sign request object using SHA256WithRSA
 * Validates against TeleBirr reference logic:
 * 1. Exclude specific fields
 * 2. Flatten biz_content fields into the main map
 * 3. Sort all keys (top-level + biz_content) alphabetically
 * 4. Join as key=value&key=value
 */
// Fields not participating in signature
const excludeFields = [
    "sign",
    "sign_type",
    "header",
    "refund_info",
    "openType",
    "raw_request",
    "biz_content",
];

function signRequestObject(requestObject) {
    let fields = [];
    let fieldMap = {};
    for (let key in requestObject) {
        if (excludeFields.indexOf(key) >= 0) {
            continue;
        }
        fields.push(key);
        fieldMap[key] = requestObject[key];
    }
    // the fields in "biz_content" must Participating signature
    if (requestObject.biz_content) {
        let biz = requestObject.biz_content;
        for (let key in biz) {
            if (excludeFields.indexOf(key) >= 0) {
                continue;
            }
            fields.push(key);
            fieldMap[key] = biz[key];
        }
    }
    // sort by ascii
    fields.sort();

    let signStrList = [];
    for (let i = 0; i < fields.length; i++) {
        let key = fields[i];
        signStrList.push(key + "=" + fieldMap[key]);
    }
    let signOriginStr = signStrList.join("&");
    //console.log("Sign Str:", signOriginStr)
    return signString(signOriginStr, config.privateKey);
}

//

let signString = (text, privateKey) => {
    const sha256withrsa = new jsrsasign.KJUR.crypto.Signature({
         alg: "SHA256withRSA",
    });
    sha256withrsa.init(privateKey);
    sha256withrsa.updateString(text);
    const sign = jsrsasign.hextob64(sha256withrsa.sign());
    return sign;
};
//const signString = (text, privateKey) => {
    //const signature = crypto.sign(
        //"sha256",
        //Buffer.from(text, "utf8"),
        //{
        //    key: privateKey,
      //      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    //        saltLength: 32
  //      }
//    );

//    return signature.toString("base64");
//};

// function createTimeStamp() {
//     //return Math.round(new Date() / 1000) + "";
//     return Date.now().toString();
// }
function createTimeStamp() {
    return Math.floor(Date.now() / 1000).toString();
}


// create a 32 length random string
	function createNonceStr() {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let str = "";

    for (let i = 0; i < 32; i++) {
        const index = Math.floor(Math.random() * chars.length);
        str += chars[index];
    }

    return str;
}

/**
 * Separate checkout signer.
 * Keeps the existing preorder signer unchanged.
 */
function signCheckoutRequestObject(requestObject) {
    const fields = [
        "appid",
        "merch_code",
        "nonce_str",
        "prepay_id",
        "timestamp"
    ];

    for (const key of fields) {
        if (
            requestObject[key] === undefined ||
            requestObject[key] === null ||
            String(requestObject[key]).trim() === ""
        ) {
            throw new Error(`Missing checkout parameter: ${key}`);
        }
    }

    const signOriginStr = fields
        .map(key => `${key}=${requestObject[key]}`)
        .join("&");

    const signer = new jsrsasign.KJUR.crypto.Signature({
        alg: "SHA256withRSAandMGF1"
    });

    signer.init(config.privateKey);
    signer.updateString(signOriginStr);

    return jsrsasign.hextob64(signer.sign());
}
export default {
    createTimeStamp,
    createNonceStr,
    signRequestObject,
    signCheckoutRequestObject,
    sanitizeTitle,
    validateTitle,
    validateAmount
};
