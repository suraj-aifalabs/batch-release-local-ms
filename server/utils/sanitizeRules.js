const { TextDecoder } = require("util");

const decodeHtmlEntitiesNative = (encodedStr) => {
    const decoder = new TextDecoder("utf-8");
    // eslint-disable-next-line no-undef
    const buffer = Buffer.from(encodedStr, "utf-8");
    return decoder.decode(buffer)
        .replace(/&quot;/g, "\"")
        .replace(/&amp;/g, "&"); // add necessary replace function in future
};
const sanitizeRules = {
    html: (value) => {
        if (!value) {return value;}
        return value.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#x27;");
    },

    sql: (value) => {
        if (!value) {return value;}
        return value.toString()
            .replace(/'/g, "''")
            .replace(/\\/g, "\\\\")
            .replace(/\0/g, "\\0");
    },

    ldap: (value) => {
        if (!value) {return value;}
        return value.toString()
            .replace(/\\/g, "\\5c")
            .replace(/\*/g, "\\2a")
            .replace(/\(/g, "\\28")
            .replace(/\)/g, "\\29")
            .replace(/\0/g, "\\00");
    },

    // For file paths
    path: (value) => {
        if (!value) {return value;}
        return value.toString()
            .replace(/\.\./g, "")        // Remove parent directory references
            .replace(/~/g, "")           // Remove home directory references
            .replace(/\0/g, "");         // Remove null bytes
    }
};

const sanitizeInput = (obj) => {
    if (!obj) {return obj;}
    const sanitized = {};
    for (const key in obj) {
        if (typeof obj[key] === "string") {
            sanitized[key] = sanitizeRules.html(obj[key]);

            if (key.toLowerCase().includes("path")) {
                sanitized[key] = sanitizeRules.path(sanitized[key]);
            }
            if (key.toLowerCase().includes("query") || key.toLowerCase().includes("filter")) {
                sanitized[key] = sanitizeRules.ldap(sanitized[key]);
            }
        } else {
            sanitized[key] = obj[key];
        }
    }
    return sanitized;
};


module.exports = { sanitizeRules, sanitizeInput, decodeHtmlEntitiesNative };