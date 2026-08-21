"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../db/prisma");
const router = (0, express_1.Router)();
// GET /api/health
router.get('/', async (_req, res) => {
    let dbStatus = 'disconnected';
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        dbStatus = 'connected';
    }
    catch {
        dbStatus = 'error';
    }
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
    });
});
exports.default = router;
//# sourceMappingURL=health.routes.js.map