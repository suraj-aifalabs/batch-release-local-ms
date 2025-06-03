/* eslint-disable quotes */
/* eslint-disable no-undef */
// envUtils.test.js
require("dotenv").config();
const {
    getDBHost,
    getDBUser,
    getDBPassword,
    getDBName,
    getMSALTenantID,
    getMSALClientID,
    getMSALClientSecret,
    getMilestoneClientID,
    getMilestoneClientSecret
} = require('../../server/utils/envUtils');

jest.mock('../../server/utils/ssm.js', () => ({
    getParam: jest.fn((paramName) => {
        const params = {
            POSTGRESQL_HOST: { Parameter: { Value: 'localhost' } },
            POSTGRESQL_DB_USER: { Parameter: { Value: 'user' } },
            POSTGRESQL_DB_PASSWORD: { Parameter: { Value: 'password' } },
            POSTGRESQL_DB_NAME: { Parameter: { Value: 'database' } },
            MSAL_TENANT_ID: { Parameter: { Value: 'tenantId' } },
            MSAL_CLIENT_ID: { Parameter: { Value: 'clientId' } },
            MSAL_CLIENT_SECRET: { Parameter: { Value: 'clientSecret' } },
            MILESTONE_CLIENT_ID: { Parameter: { Value: 'milestoneClientId' } },
            MILESTONE_CLIENT_SECRET: { Parameter: { Value: 'milestoneClientSecret' } },
        };
        return Promise.resolve(params[paramName]);
    }),
}));

beforeAll(() => {
    process.env.POSTGRESQL_HOST = 'POSTGRESQL_HOST';
    process.env.POSTGRESQL_DB_USER = 'POSTGRESQL_DB_USER';
    process.env.POSTGRESQL_DB_PASSWORD = 'POSTGRESQL_DB_PASSWORD';
    process.env.POSTGRESQL_DB_NAME = 'POSTGRESQL_DB_NAME';
    process.env.MSAL_TENANT_ID = 'MSAL_TENANT_ID';
    process.env.MSAL_CLIENT_ID = 'MSAL_CLIENT_ID';
    process.env.MSAL_CLIENT_SECRET = 'MSAL_CLIENT_SECRET';
    process.env.MILESTONE_CLIENT_ID = 'MILESTONE_CLIENT_ID';
    process.env.MILESTONE_CLIENT_SECRET = 'MILESTONE_CLIENT_SECRET';
});

describe('Environment Variable Fetching Functions', () => {
    test('getDBHost should return the database host', async () => {
        const host = await getDBHost();
        expect(host).toBe('localhost');
    });

    test('getDBUser should return the database user', async () => {
        const user = await getDBUser();
        expect(user).toBe('user');
    });

    test('getDBPassword should return the database password', async () => {
        const password = await getDBPassword();
        expect(password).toBe('password');
    });

    test('getDBName should return the database name', async () => {
        const dbName = await getDBName();
        expect(dbName).toBe('database');
    });

    test('getMSALTenantID should return the MSAL tenant ID', async () => {
        const tenantId = await getMSALTenantID();
        expect(tenantId).toBe('tenantId');
    });

    test('getMSALClientID should return the MSAL client ID', async () => {
        const clientId = await getMSALClientID();
        expect(clientId).toBe('clientId');
    });

    test('getMSALClientSecret should return the MSAL client secret', async () => {
        const clientSecret = await getMSALClientSecret();
        expect(clientSecret).toBe('clientSecret');
    });

    test('getMilestoneClientID should return the Milestone client ID', async () => {
        const milestoneClientId = await getMilestoneClientID();
        expect(milestoneClientId).toBe('milestoneClientId');
    });

    test('getMilestoneClientSecret should return the Milestone client secret', async () => {
        const milestoneClientSecret = await getMilestoneClientSecret();
        expect(milestoneClientSecret).toBe('milestoneClientSecret');
    });
});
