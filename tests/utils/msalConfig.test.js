/* eslint-disable quotes */
/* eslint-disable no-undef */
// loadConfig.test.js
const { loadConfig } = require('../../server/utils/msalConfig');

describe('loadConfig', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV };
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    it('should load config correctly from env variables', async () => {
        process.env.CLIENT_ID = 'test-client-id';
        process.env.TENANT_ID = 'test-tenant-id';
        process.env.CLIENT_SECRET = 'test-client-secret';

        const { msalConfig, tokenValidationConfig } = await loadConfig();

        expect(msalConfig).toEqual({
            auth: {
                clientId: 'test-client-id',
                authority: 'https://login.microsoftonline.com/test-tenant-id',
                clientSecret: 'test-client-secret',
            },
            system: {
                loggerOptions: {
                    loggerCallback: expect.any(Function),
                    piiLoggingEnabled: false,
                    logLevel: 'Verbose',
                },
            },
        });

        expect(tokenValidationConfig).toEqual({
            issuer: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
            audience: 'test-client-id',
        });
    });

    it('loggerCallback should log message', () => {
        process.env.CLIENT_ID = 'id';
        process.env.TENANT_ID = 'tenant';
        process.env.CLIENT_SECRET = 'secret';

        return loadConfig().then(({ msalConfig }) => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            msalConfig.system.loggerOptions.loggerCallback('test message');
            expect(consoleSpy).toHaveBeenCalledWith('test message');

            consoleSpy.mockRestore();
        });
    });
});