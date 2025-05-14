
module.exports = (err, req, res, next) => {

    err.statusCode = err.statusCode || 500;

    err.message = err.message || "Internal Error";

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
    // eslint-disable-next-line no-console
    console.error("error", err);
    next();
};