
async function loadConfig() {
    // eslint-disable-next-line no-undef
    const clientId = process.env.CLIENT_ID;
    // eslint-disable-next-line no-undef
    const tenantId = process.env.TENANT_ID;
    // eslint-disable-next-line no-undef
    const ClientSecret = process.env.CLIENT_SECRET;

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
        issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
        audience: clientId,
    };

    return { msalConfig, tokenValidationConfig };
}

module.exports = { loadConfig };
