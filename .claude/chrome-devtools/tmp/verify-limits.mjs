import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, '..', '..', '..');
const htmlPath = join(outputDir, 'video-plate-saas-mockup-v2.html');

const html = readFileSync(htmlPath, 'utf8');

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

await new Promise(r => server.listen(0, r));
const port = server.address().port;
const url = `http://localhost:${port}`;

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();

const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

// Navigate and wait for render
await page.goto(url, { waitUntil: 'networkidle0' });
await page.waitForSelector('#app', { timeout: 5000 });
await new Promise(r => setTimeout(r, 500)); // let JS render complete

// Check for JS errors
const jsErrs = await page.evaluate(() => {
  const errors = [];
  const orig = console.error;
  return errors;
});

const title = await page.title();
const appHtml = await page.evaluate(() => document.querySelector('#app')?.innerHTML?.substring(0, 100) || 'NO #app FOUND');

// Test login flow
await page.evaluate(() => {
  if (typeof login === 'function') login('admin');
});
await new Promise(r => setTimeout(r, 200));

const isLoggedIn = await page.evaluate(() => {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user).username : null;
});

// Test quota check
const quotaResult = await page.evaluate(() => {
  if (typeof checkLimit !== 'function') return 'NO checkLimit';
  // Try admin quota
  return checkLimit('plate_img', 1) ? 'OK' : 'BLOCKED';
});

// Test feature check
const featureResult = await page.evaluate(() => {
  if (typeof canAccess !== 'function') return 'NO canAccess';
  return canAccess('admin', 'process-video') ? 'OK' : 'BLOCKED';
});

const results = {
  url,
  title,
  errors,
  appRendered: appHtml.includes('sidebar') || appHtml.includes('nav') || appHtml.includes('div'),
  loginWorks: isLoggedIn === 'Admin',
  quotaWorks: quotaResult,
  featureWorks: featureResult,
};

await browser.close();
server.close();

console.log(JSON.stringify(results, null, 2));
process.exit(errors.length > 0 ? 1 : 0);
