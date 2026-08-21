"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertThaiDigitsToArabic = convertThaiDigitsToArabic;
exports.detectCarrier = detectCarrier;
exports.normalizeThaiPhoneNumber = normalizeThaiPhoneNumber;
exports.extractThaiPhoneNumbers = extractThaiPhoneNumbers;
/**
 * Thai numeral to Arabic numeral mapping
 */
const THAI_TO_ARABIC_DIGITS = {
    '๐': '0',
    '๑': '1',
    '๒': '2',
    '๓': '3',
    '๔': '4',
    '๕': '5',
    '๖': '6',
    '๗': '7',
    '๘': '8',
    '๙': '9',
};
/**
 * Convert any Thai numeral digits (๐-๙) to Arabic digits (0-9)
 */
function convertThaiDigitsToArabic(text) {
    return text.replace(/[๐-๙]/g, (match) => THAI_TO_ARABIC_DIGITS[match] || match);
}
/**
 * Detect carrier based on Thai NBTC standard mobile prefixes
 */
function detectCarrier(normalizedPhone) {
    if (normalizedPhone.length !== 10)
        return 'UNKNOWN';
    const prefix3 = normalizedPhone.substring(0, 3);
    // AIS Common Prefixes
    const aisPrefixes = ['080', '081', '082', '084', '087', '089', '092', '093', '097', '098', '061', '062', '063', '065'];
    if (aisPrefixes.includes(prefix3))
        return 'AIS';
    // TRUE & DTAC Common Prefixes
    const trueDtacPrefixes = ['083', '085', '086', '088', '090', '091', '094', '095', '096', '099', '064'];
    if (trueDtacPrefixes.includes(prefix3))
        return 'TRUE_DTAC';
    // NT (National Telecom / TOT / My by CAT)
    const ntPrefixes = ['066', '088'];
    if (ntPrefixes.includes(prefix3))
        return 'NT';
    return 'UNKNOWN';
}
/**
 * Normalize raw phone string to uniform Thai local (0812345678) and E.164 (+66812345678)
 */
function normalizeThaiPhoneNumber(rawPhone) {
    // Strip all whitespace, hyphens, dots, parentheses, brackets, slashes
    let cleaned = rawPhone.replace(/[\s\-\.\(\)\[\]\/\\_]/g, '');
    // Handle +66 or 0066 or 66 country code
    if (cleaned.startsWith('+66')) {
        cleaned = '0' + cleaned.substring(3);
    }
    else if (cleaned.startsWith('0066')) {
        cleaned = '0' + cleaned.substring(4);
    }
    else if (cleaned.startsWith('66') && (cleaned.length === 11 || cleaned.length === 10)) {
        cleaned = '0' + cleaned.substring(2);
    }
    // Validate Thai Mobile (10 digits starting with 06, 08, 09)
    if (/^0[689]\d{8}$/.test(cleaned)) {
        const e164 = `+66${cleaned.substring(1)}`;
        return {
            normalized: cleaned,
            e164,
            isMobile: true,
        };
    }
    // Validate Thai Landline (9 digits starting with 02, 03x, 04x, 05x, 07x)
    if (/^0[23457]\d{7}$/.test(cleaned)) {
        const e164 = `+66${cleaned.substring(1)}`;
        return {
            normalized: cleaned,
            e164,
            isMobile: false,
        };
    }
    return null;
}
/**
 * Extract all valid Thai phone numbers from raw text, messages, or notes
 */
function extractThaiPhoneNumbers(rawText) {
    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
        return [];
    }
    // 1. Convert Thai numerals to standard Arabic digits
    const text = convertThaiDigitsToArabic(rawText);
    // 2. Comprehensive Regex patterns for Thai numbers:
    // - International: (+66|66)[ -]?[689]\d[ -]?\d{3}[ -]?\d{4}
    // - Standard mobile: 0[689]\d([ -.]?\d{3}[ -.]?\d{4}|[ -.]?\d{4}[ -.]?\d{4}|\d{7})
    // - Spaced individual digits: 0\s*[689](\s*\d){8}
    // - Landlines: 0[23457]\d[ -.]?\d{3}[ -.]?\d{3,4}
    const patterns = [
        // International prefix +66 or 66
        /(?:\+66|0066|66)[ -]?[689]\d{1}[ -.]?\d{3}[ -.]?\d{4}/g,
        // Spaced out mobile digits e.g. 0 8 1 2 3 4 5 6 7 8
        /0\s*[689]\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d/g,
        // Standard formats: 081-234-5678, 081 234 5678, 0812345678, 091-2345678
        /0[689]\d[ -.]?\d{3}[ -.]?\d{4}/g,
        /0[689]\d[ -.]?\d{4}[ -.]?\d{3,4}/g,
        /0[689]\d{8}/g,
        // Landline: 02-123-4567, 053-123-456, 02 123 4567
        /02[ -.]?\d{3}[ -.]?\d{4}/g,
        /0[3457]\d[ -.]?\d{3}[ -.]?\d{3}/g,
    ];
    const foundCandidates = new Set();
    for (const regex of patterns) {
        const matches = text.match(regex);
        if (matches) {
            for (const match of matches) {
                foundCandidates.add(match.trim());
            }
        }
    }
    const results = [];
    const seenNormalized = new Set();
    for (const rawCandidate of foundCandidates) {
        const normalizedData = normalizeThaiPhoneNumber(rawCandidate);
        if (normalizedData) {
            if (!seenNormalized.has(normalizedData.normalized)) {
                seenNormalized.add(normalizedData.normalized);
                const carrier = normalizedData.isMobile
                    ? detectCarrier(normalizedData.normalized)
                    : undefined;
                results.push({
                    raw: rawCandidate,
                    normalized: normalizedData.normalized,
                    e164: normalizedData.e164,
                    isMobile: normalizedData.isMobile,
                    carrier,
                });
            }
        }
    }
    return results;
}
//# sourceMappingURL=phone-extractor.util.js.map