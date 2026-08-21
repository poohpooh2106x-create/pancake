import {
  extractThaiPhoneNumbers,
  normalizeThaiPhoneNumber,
  convertThaiDigitsToArabic,
  detectCarrier,
} from '../src/utils/phone-extractor.util';

describe('Thai Phone Number Extractor & Normalizer', () => {
  describe('convertThaiDigitsToArabic', () => {
    it('should convert Thai numerals to Arabic numerals correctly', () => {
      expect(convertThaiDigitsToArabic('๐๘๑-๒๓๔-๕๖๗๘')).toBe('081-234-5678');
      expect(convertThaiDigitsToArabic('โทร ๐๙๕๑๒๓๔๕๖๗')).toBe('โทร 0951234567');
    });
  });

  describe('normalizeThaiPhoneNumber', () => {
    it('should normalize standard 10-digit mobile numbers', () => {
      const result = normalizeThaiPhoneNumber('081-234-5678');
      expect(result).toEqual({
        normalized: '0812345678',
        e164: '+66812345678',
        isMobile: true,
      });
    });

    it('should normalize international +66 numbers', () => {
      const result = normalizeThaiPhoneNumber('+66 81 234 5678');
      expect(result).toEqual({
        normalized: '0812345678',
        e164: '+66812345678',
        isMobile: true,
      });
    });

    it('should normalize 9-digit Bangkok landline numbers', () => {
      const result = normalizeThaiPhoneNumber('02-123-4567');
      expect(result).toEqual({
        normalized: '021234567',
        e164: '+6621234567',
        isMobile: false,
      });
    });
  });

  describe('extractThaiPhoneNumbers', () => {
    it('should extract multiple mobile numbers with different formats from chat text', () => {
      const chat = `
        สวัสดีครับ สนใจสั่งซื้อสินค้า 2 ชิ้นครับ
        ส่งที่อยู่เดิม เบอร์โทร 081-234-5678
        ถ้าติดต่อไม่ได้ให้โทรเบอร์แฟน 092 987 6543 หรือ +66891112222 นะครับ
      `;

      const extracted = extractThaiPhoneNumbers(chat);
      expect(extracted).toHaveLength(3);

      const normalizedList = extracted.map((e) => e.normalized);
      expect(normalizedList).toContain('0812345678');
      expect(normalizedList).toContain('0929876543');
      expect(normalizedList).toContain('0891112222');
    });

    it('should extract spaced-out phone digits', () => {
      const chat = 'เบอร์ผม 0 8 1 2 3 4 5 6 7 8 ครับ';
      const extracted = extractThaiPhoneNumbers(chat);
      expect(extracted).toHaveLength(1);
      expect(extracted[0].normalized).toBe('0812345678');
    });

    it('should extract Thai numeral phone numbers', () => {
      const chat = 'เบอร์ ๐๘๑-๒๓๔-๕๖๗๘ จ้า';
      const extracted = extractThaiPhoneNumbers(chat);
      expect(extracted).toHaveLength(1);
      expect(extracted[0].normalized).toBe('0812345678');
    });

    it('should deduplicate identical numbers in the same message', () => {
      const chat = 'เบอร์ 081-234-5678 หรือ 0812345678 หรือ +66812345678';
      const extracted = extractThaiPhoneNumbers(chat);
      expect(extracted).toHaveLength(1);
      expect(extracted[0].normalized).toBe('0812345678');
    });

    it('should correctly identify major telecom carriers', () => {
      expect(detectCarrier('0812345678')).toBe('AIS');
      expect(detectCarrier('0861234567')).toBe('TRUE_DTAC');
      expect(detectCarrier('0661234567')).toBe('NT');
    });
  });
});
