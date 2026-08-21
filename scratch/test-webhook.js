const https = require('https');

const data = JSON.stringify({
  fields: {
    id: 'lead_pancake_crm_999',
    NAME: 'Wichaphat Chomphu',
    PHONE: [
      {
        VALUE: '0820876792',
        VALUE_TYPE: 'WORK',
      },
    ],
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
