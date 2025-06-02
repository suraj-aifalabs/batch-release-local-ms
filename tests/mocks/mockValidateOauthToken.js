// tests/mocks/mockValidateOauthToken.js
module.exports.validateOauthToken = (req, res, next) => {
    req.user = {
        username: "testuser",
        email: "test@example.com",
        name: "Test User",
        roles: ["admin"],
    };
    req.isActiveSession = true; // pretend session is valid
    next();
};