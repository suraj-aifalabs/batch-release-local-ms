/* eslint-disable no-undef */
/* eslint-disable quotes */
// ssm.test.js
const AWS = require("aws-sdk");
const { getParam } = require('../../server/utils/ssm');

jest.mock('aws-sdk', () => {
    const mockGetParameter = jest.fn();
    return {
        SSM: jest.fn(() => ({
            getParameter: mockGetParameter,
        })),
        config: {
            update: jest.fn(),
        },
    };
});

describe('SSM Parameter Store', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.AWS_REGION = 'us-east-1';
    });

    test('getParam should return mock data when NODE_ENV is LOCAL', async () => {
        process.env.NODE_ENV = 'LOCAL';

        const result = await getParam('StripeSecretKey');

        expect(result).toEqual({
            Parameter: {
                Name: "StripeSecretKey",
                Type: "SecureString",
                Value: "myVal",
                Version: 1,
                LastModifiedDate: 1530018761.888,
                ARN: "arn:aws:ssm:us-east-1:123456789012:parameter/helloSecureWorld",
            },
        });
    });

    test('getParam should call AWS SSM client when NODE_ENV is not LOCAL', async () => {
        process.env.NODE_ENV = 'PRODUCTION';

        const mockValue = { Parameter: { Value: 'mockValue' } };

        const mockGetParameter = jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue(mockValue),
        });

        AWS.SSM.prototype.getParameter = mockGetParameter;

        await getParam('mockParameterName');
    });

    test('getParam should handle errors thrown by AWS SSM client', async () => {
        process.env.NODE_ENV = 'PRODUCTION';

        const mockError = new Error('Some error occurred');
        const mockGetParameter = jest.fn().mockReturnValue({
            promise: jest.fn().mockRejectedValue(mockError),
        });

        AWS.SSM.prototype.getParameter = mockGetParameter;

        await getParam('mockParameterName');

    });
});
