"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetsService = void 0;
const googleapis_1 = require("googleapis");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class GoogleSheetsService {
    static sheetsClient = null;
    /**
     * Initialize Google Sheets API client with Service Account JWT
     */
    static async getClient() {
        if (!env_1.env.GOOGLE_SHEETS_ENABLED) {
            return null;
        }
        if (!env_1.env.GOOGLE_SHEETS_SPREADSHEET_ID || !env_1.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env_1.env.GOOGLE_PRIVATE_KEY) {
            logger_1.logger.warn('Google Sheets is enabled but credentials or Spreadsheet ID are missing in .env');
            return null;
        }
        if (this.sheetsClient) {
            return this.sheetsClient;
        }
        try {
            const formattedPrivateKey = env_1.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
            const auth = new googleapis_1.google.auth.JWT({
                email: env_1.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                key: formattedPrivateKey,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            this.sheetsClient = googleapis_1.google.sheets({ version: 'v4', auth });
            return this.sheetsClient;
        }
        catch (error) {
            logger_1.logger.error({ error: error.message }, 'Failed to authenticate with Google Sheets API');
            return null;
        }
    }
    /**
     * Ensure Header Row matches user's exact Sheet structure:
     * A: วันที่รับ | B: เวลา | C: ที่มา | D: ชื่อลูกค้า | E: เบอร์โทร | F: รถที่สนใจ | G: เซลล์ที่รับ
     */
    static async ensureHeadersExist(targetSheetName) {
        const sheets = await this.getClient();
        if (!sheets)
            return;
        const spreadsheetId = env_1.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        try {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${targetSheetName}!A1:G1`,
            });
            const rows = response.data.values;
            if (!rows || rows.length === 0 || !rows[0] || rows[0].length === 0) {
                const headers = [
                    'วันที่รับ',
                    'เวลา',
                    'ที่มา',
                    'ชื่อลูกค้า',
                    'เบอร์โทร',
                    'รถที่สนใจ',
                    'เซลล์ที่รับ',
                ];
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${targetSheetName}!A1:G1`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [headers] },
                });
                logger_1.logger.info({ sheetName: targetSheetName }, 'Initialized Google Sheet headers successfully');
            }
        }
        catch (error) {
            logger_1.logger.warn({ error: error.message, targetSheetName }, 'Header check skipped/handled');
        }
    }
    /**
     * Format customer object into the exact 7 columns matching the user's Google Sheet
     */
    static formatCustomerRow(customer) {
        const dateObj = new Date(customer.lastContactAt || customer.firstContactAt);
        const dateStr = customer.receivedDate || `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
        const timeStr = customer.receivedTime || `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
        // Format phone as 081-2345678 or 081-234-5678
        let phoneStr = customer.primaryPhone || '';
        if (phoneStr.length === 10) {
            phoneStr = `${phoneStr.substring(0, 3)}-${phoneStr.substring(3)}`;
        }
        return [
            dateStr, // Col A: วันที่รับ
            timeStr, // Col B: เวลา
            customer.leadSource || 'FB เคพีศรีราชา', // Col C: ที่มา
            customer.name, // Col D: ชื่อลูกค้า
            phoneStr, // Col E: เบอร์โทร
            customer.interestedVehicle || '', // Col F: รถที่สนใจ
            customer.assignedSales || '', // Col G: เซลล์ที่รับ
        ];
    }
    /**
     * Upsert a single customer row into the appropriate Sheet Tab
     */
    static async syncCustomer(customer) {
        const sheets = await this.getClient();
        if (!sheets)
            return false;
        const spreadsheetId = env_1.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        const targetSheetName = customer.leadSource || env_1.env.GOOGLE_SHEETS_SHEET_NAME || 'FB เคพีศรีราชา';
        try {
            await this.ensureHeadersExist(targetSheetName);
            // Read Column D (ชื่อลูกค้า) and Column E (เบอร์โทร) to check for existing row
            const searchResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${targetSheetName}!D:E`,
            });
            const rows = searchResponse.data.values || [];
            let targetRowIndex = -1;
            for (let i = 0; i < rows.length; i++) {
                const rowName = rows[i]?.[0];
                const rowPhone = rows[i]?.[1]?.replace(/[\s-]/g, '');
                const custPhone = (customer.primaryPhone || '').replace(/[\s-]/g, '');
                if ((custPhone && rowPhone && rowPhone === custPhone) || (rowName && rowName === customer.name)) {
                    targetRowIndex = i + 1; // 1-indexed
                    break;
                }
            }
            const rowValues = this.formatCustomerRow(customer);
            if (targetRowIndex > 1) {
                // Update existing row
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${targetSheetName}!A${targetRowIndex}:G${targetRowIndex}`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [rowValues] },
                });
                logger_1.logger.info({ customer: customer.name, row: targetRowIndex, sheet: targetSheetName }, 'Updated row in Google Sheet');
            }
            else {
                // Append new row
                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: `${targetSheetName}!A:G`,
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                    requestBody: { values: [rowValues] },
                });
                logger_1.logger.info({ customer: customer.name, sheet: targetSheetName }, 'Appended new row in Google Sheet');
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error({ error: error.message, customer: customer.name }, 'Failed syncing to Google Sheets');
            return false;
        }
    }
}
exports.GoogleSheetsService = GoogleSheetsService;
//# sourceMappingURL=google-sheets.service.js.map