const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const EVO_URL = process.env.EVO_URL || '';
const API_KEY = process.env.API_KEY || '';

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, apikey');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.url.startsWith('/api/')) {
    const target = EVO_URL + req.url.replace('/api', '');
    const parsed = url.parse(target);
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      const options = {
        hostname: parsed.hostname,
        path: parsed.path,
        method: req.method,
        headers: { 'Content-Type': 'application/json', 'apikey': API_KEY }
      };
      const proxy = https.request(options, r => {
        let data = '';
        r.on('data', d => data += d);
        r.on('end', () => {
          res.writeHead(r.statusCode, { 'Content-Type': 'application/json' });
          res.end(data);
        });
      });
      proxy.on('error', e => { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); });
      if (body) proxy.write(body);
      proxy.end();
    });
    return;
  }

  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}).listen(PORT, () => console.log('Rodando na porta ' + PORT));
