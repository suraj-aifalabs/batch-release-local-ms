require("dotenv").config();
const { getParam } = require("./ssm.js");

const getDBHost = async () => {
    try {
        // eslint-disable-next-line no-undef
        const res = await getParam(process.env.POSTGRESQL_HOST);
        return res.Parameter.Value;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log("error getting ssm secret POSTGRESQL_HOST", e);
    }
};

const getDBUser = async () => {
    try {
        // eslint-disable-next-line no-undef
        const res = await getParam(process.env.POSTGRESQL_DB_USER);
        return res.Parameter.Value;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log("error getting ssm secret POSTGRESQL_DB_USER", e);
    }
};

const getDBPassword = async () => {
    try {
        // eslint-disable-next-line no-undef
        const res = await getParam(process.env.POSTGRESQL_DB_PASSWORD);
        return res.Parameter.Value;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log("error getting ssm secret POSTGRESQL_DB_PASSWORD", e);
    }
};

const getDBName = async () => {
    try {
        // eslint-disable-next-line no-undef
        const res = await getParam(process.env.POSTGRESQL_DB_NAME);
        return res.Parameter.Value;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log("error getting ssm secret POSTGRESQL_DB_NAME", e);
    }
};

const getMSALTenantID = async () => {
    try {
        // eslint-disable-next-line no-undef
        const res = await getParam(process.env.MSAL_TENANT_ID);
        return res.Parameter.Value;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log("error getting ssm secret MSAL_TENANT_ID", e);
    }
};

const getMSALClientID = async () => {
    try {
        // eslint-disable-next-line no-undef
        const res = await getParam(process.env.MSAL_CLIENT_ID);
        return res.Parameter.Value;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log("error getting ssm secret MSAL_CLIENT_ID", e);
    }
};

const getMSALClientSecret = async () => {
    try {
        // eslint-disable-next-line no-undef
        const res = await getParam(process.env.MSAL_CLIENT_SECRET);
        return res.Parameter.Value;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log("error getting ssm secret MSAL_CLIENT_SECRET", e);
    }
};

const getApiUsername = async () => {
    try {
        // eslint-disable-next-line no-undef
        const res = await getParam(process.env.SR_API_USERNAME);
        return res.Parameter.Value;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log("error getting ssm secret SR_API_USERNAME", e);
    }
};

const getApiPassword = async () => {
    try {
        // eslint-disable-next-line no-undef
        const res = await getParam(process.env.SR_API_PASSWORD);
        return res.Parameter.Value;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log("error getting ssm secret SR_API_PASSWORD", e);
    }
};

module.exports = {
    getDBHost,
    getDBUser,
    getDBPassword,
    getDBName,
    getMSALTenantID,
    getMSALClientID,
    getMSALClientSecret,
    getApiUsername,
    getApiPassword
};
