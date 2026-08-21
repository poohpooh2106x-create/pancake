"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
function errorHandler(err, req, res, next) {
    logger_1.logger.error({
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
    }, 'Unhandled Application Error');
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
    });
}
//# sourceMappingURL=error.middleware.js.map