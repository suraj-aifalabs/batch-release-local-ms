const { default: axios } = require("axios");
const { getApiUsername, getApiPassword } = require("../utils/envUtils");


const postRequest = async (url = "", data = {}) => {
    try {
        // eslint-disable-next-line no-undef
        const cart_end_point = process.env.CART_SERVICE_ENDPOINT;
        // eslint-disable-next-line no-undef
        const username = process.env.SERVICE_API_USERNAME || await getApiUsername();
        // eslint-disable-next-line no-undef
        const password = process.env.SERVICE_API_PASSWORD || await getApiPassword();
        const resData = await axios.post(`${cart_end_point}/${url}`, data, {
            auth: {
                username: username,
                password: password
            },
            headers: {
                "Content-Type": "application/json"
            }
        });

        return resData?.data;
    } catch (e) {
        console.log("Error in API request", e);
    }
};

module.exports = {
    postRequest
};