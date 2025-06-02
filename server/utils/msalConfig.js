const { getMSALClientID, getMSALTenantID, getMSALClientSecret } = require("./envUtils");

async function loadConfig() {
    // eslint-disable-next-line no-undef
    const clientId = process.env.CLIENT_ID || await getMSALClientID();
    // eslint-disable-next-line no-undef
    const tenantId = process.env.TENANT_ID || await getMSALTenantID();
    // eslint-disable-next-line no-undef
    const ClientSecret = process.env.CLIENT_SECRET || await getMSALClientSecret();

    const msalConfig = {
        auth: {
            clientId,
            authority: `https://login.microsoftonline.com/${tenantId}`,
            clientSecret: ClientSecret,
        },
        system: {
            loggerOptions: {
                loggerCallback(message) {
                    // eslint-disable-next-line no-console
                    console.log(message);
                },
                piiLoggingEnabled: false,
                logLevel: "Verbose",
            },
        },
    };

    const tokenValidationConfig = {
        // for v2.0 token
        issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
        audience: clientId,
    };

    return { msalConfig, tokenValidationConfig };
}

module.exports = { loadConfig };
