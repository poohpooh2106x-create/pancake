const https = require('https');

const data = JSON.stringify({
  event: 'new_message',
  page_name: 'FB เคพีศรีราชา',
  platform: 'facebook',
  customer: {
    id: 'cust_real_test_001',
    name: 'คุณสมชาย ขนส่งศรีราชา',
  },
  message: {
    id: 'msg_real_001',
    text: 'สวัสดีครับแอดมิน สนใจรถหัวลากครับ สภาพพร้อมใช้งานมั้ย ติดต่อเบอร์ 081-999-8888 ครับ',
    inserted_at: new Date().toISOString(),
  },
});

const req = https.request(
  'https://pancake-sales.netlify.app/api/webhooks/pancake',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  },
  (res) => {
    let body = '';
    res.on('data', (d) => (body += d));
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      console.log('RESPONSE:', body);
    });
  }
);

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
