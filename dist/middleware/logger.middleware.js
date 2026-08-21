"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoggerMiddleware = requestLoggerMiddleware;
const logger_1 = require("../utils/logger");
function requestLoggerMiddleware(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.info({
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: duration,
            ip: req.ip,
        }, 'HTTP Request Handled');
    });
    next();
}
//# sourceMappingURL=logger.middleware.js.map