const https = require('https');

const apiKey = '000f5b693a51437695f8e552afec5066';
const workspaceId = '2671';

const testPaths = [
  // POS & CRM public API
  { host: 'pos.pages.fm', path: `/api/v1/shops?api_key=${apiKey}` },
  { host: 'pos.pages.fm', path: `/api/v1/orders?api_key=${apiKey}` },
  { host: 'pos.pages.fm', path: `/api/v1/customers?api_key=${apiKey}` },
  { host: 'pos.pancake.vn', path: `/api/v1/customers?api_key=${apiKey}` },
  { host: 'crm.pancake.vn', path: `/api/public/v1/customers?api_key=${apiKey}` },
  { host: 'crm.pancake.vn', path: `/api/public/v1/leads?api_key=${apiKey}` },
  { host: 'crm.pancake.vn', path: `/api/public/v1/workspaces/${workspaceId}/leads?api_key=${apiKey}` },
  { host: 'pages.fm', path: `/api/public_api/v1/shops?api_key=${apiKey}` },
  { host: 'pages.fm', path: `/api/public_api/v1/pages/1000/customers?api_key=${apiKey}` },
  { host: 'pages.fm', path: `/api/v1/pages?api_key=${apiKey}` },
];

function testEndpoint(ep) {
  return new Promise((resolve) => {
    const req = https.request(
      {
        host: ep.host,
        path: ep.path,
        method: 'GET',
        headers: {
          'User-Agent': 'PancakeClient/1.0',
          'api-key': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        timeout: 5000,
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          resolve({
            endpoint: `https://${ep.host}${ep.path}`,
            statusCode: res.statusCode,
            body: body.substring(0, 300),
          });
        });
      }
    );
    req.on('error', (e) => resolve({ endpoint: `https://${ep.host}${ep.path}`, error: e.message }));
    req.end();
  });
}

async function run() {
  for (const ep of testPaths) {
    const res = await testEndpoint(ep);
    console.log(`[${res.statusCode || 'ERR'}] ${res.endpoint}`);
    if (res.body) console.log(`   Body: ${res.body}`);
    if (res.error) console.log(`   Error: ${res.error}`);
  }
}

run();
