"use strict";
/**
 * Thai Commercial Vehicle & Truck Keyword Extractor
 * Automatically extracts vehicle types from customer chat messages
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEAD_SOURCES = exports.SALES_TEAM = exports.VEHICLE_PRESETS = void 0;
exports.extractInterestedVehicle = extractInterestedVehicle;
exports.VEHICLE_PRESETS = [
    'หัวลาก',
    'ตู้10',
    'หาง',
    'หางพ่วง',
    'หางก้าง',
    'หางเรียบ',
    'ดั้ม',
    '6ล้อ',
    '10ล้อ',
    'รถตัด',
    'กระบะคอก',
    'ตู้แห้ง',
    'ตู้เย็น',
    'เทรลเลอร์',
];
exports.SALES_TEAM = [
    { name: 'วุธ', color: 'bg-cyan-950 text-cyan-400 border-cyan-700' },
    { name: 'อั๋น', color: 'bg-orange-950 text-orange-400 border-orange-700' },
    { name: 'ท้อป', color: 'bg-stone-800 text-stone-300 border-stone-600' },
    { name: 'จิ๊บ', color: 'bg-emerald-950 text-emerald-400 border-emerald-700' },
    { name: 'เกด', color: 'bg-amber-950 text-amber-500 border-amber-700' },
    { name: 'ม่า', color: 'bg-purple-950 text-purple-400 border-purple-700' },
    { name: 'ปุ๊ก', color: 'bg-rose-950 text-rose-400 border-rose-700' },
    { name: 'เฟิร์น', color: 'bg-teal-950 text-teal-400 border-teal-700' },
];
exports.LEAD_SOURCES = [
    'FB เคพีศรีราชา',
    'TikTokเคพีศรีราชา',
    'LOA เคพี',
    'FB เฮียตั้มรถตัด',
    'นายหน้าห้องรถตัด',
    'เฮียส่งให้',
];
/**
 * Scan raw text for vehicle interest keywords
 */
function extractInterestedVehicle(text) {
    if (!text || typeof text !== 'string')
        return null;
    const normalized = text.toLowerCase().replace(/\s+/g, '');
    if (normalized.includes('ตู้10') || normalized.includes('ตู้สิบ') || normalized.includes('10ตู้')) {
        return 'ตู้10';
    }
    if (normalized.includes('หัวลาก') || normalized.includes('รถหัวลาก')) {
        return 'หัวลาก';
    }
    if (normalized.includes('หางก้าง') || normalized.includes('ก้างปลา')) {
        return 'หางก้าง';
    }
    if (normalized.includes('หางเรียบ')) {
        return 'หางเรียบ';
    }
    if (normalized.includes('หางพ่วง') || normalized.includes('หางดั้ม') || normalized.includes('หาง')) {
        return 'หาง';
    }
    if (normalized.includes('ดั้ม') || normalized.includes('รถดั้ม')) {
        return 'ดั้ม';
    }
    if (normalized.includes('6ล้อ') || normalized.includes('หกล้อ')) {
        return '6ล้อ';
    }
    if (normalized.includes('10ล้อ') || normalized.includes('สิบล้อ')) {
        return '10ล้อ';
    }
    if (normalized.includes('รถตัด') || normalized.includes('หัวตัด')) {
        return 'รถตัด';
    }
    if (normalized.includes('ตู้เย็น')) {
        return 'ตู้เย็น';
    }
    if (normalized.includes('ตู้แห้ง')) {
        return 'ตู้แห้ง';
    }
    if (normalized.includes('เทรลเลอร์')) {
        return 'เทรลเลอร์';
    }
    return null;
}
//# sourceMappingURL=vehicle-extractor.util.js.map