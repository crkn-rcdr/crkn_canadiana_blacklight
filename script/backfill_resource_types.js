#!/usr/bin/env node

/**
 * script/backfill_resource_types.js
 *
 * Simultaneously populates:
 *   1. resource_type_ssim_str ('Book', 'Journal', 'Newspaper', 'Musical Score', 'Map')
 *   2. rights_statement_ssim_str ('No Known Copyright', 'In Copyright', 'Public Domain Mark 1.0', etc.)
 *   3. cleans serial_title for standalone monographs/books
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

function loadEnvDefaults() {
  const rootDir = path.resolve(__dirname, '..');
  ['.env.dev', '.env'].forEach(filename => {
    const filePath = path.join(rootDir, filename);
    if (!fs.existsSync(filePath)) return;
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const idx = line.indexOf('=');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    });
  });
}
loadEnvDefaults();

const SOLR_URL = process.env.SOLR_URL || 'http://10.202.1.33:8983/solr/blacklight_marc';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5000', 10);
const COMMIT_EVERY = parseInt(process.env.COMMIT_EVERY || '25000', 10);

function getJson(urlStr) {
  return new Promise((resolve, reject) => {
    http.get(urlStr, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage} from ${urlStr}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function determineResourceType(doc) {
  const formats = Array.isArray(doc.format) ? doc.format : [];
  const isSerial = Array.isArray(doc.is_serial) && doc.is_serial[0] === 'Yes';
  const isIssue = Array.isArray(doc.is_issue) && doc.is_issue[0] === 'Yes';
  const docId = doc.id || '';

  const isNewspaper = formats.some(f => /newspaper/i.test(f)) || (docId.includes('N') && (isSerial || isIssue || formats.some(f => /serial/i.test(f))));

  if (isNewspaper) return 'Newspaper';
  if (isSerial || isIssue || formats.some(f => /serial|journal/i.test(f))) return 'Journal';
  if (formats.some(f => /score|musical/i.test(f))) return 'Musical Score';
  if (formats.some(f => /map/i.test(f))) return 'Map';

  return 'Book';
}

function labelForRights(text) {
  if (!text) return null;
  if (/NKC|no known copyright/i.test(text)) return 'No Known Copyright';
  if (/InC|in copyright|all rights reserved|tous droits/i.test(text)) return 'In Copyright';
  if (/publicdomain|public domain/i.test(text)) return 'Public Domain Mark 1.0';
  if (/open-government|open government/i.test(text)) return 'Open Government Licence - Canada';
  if (/CNE|not evaluated/i.test(text)) return 'Copyright Not Evaluated';
  return text.trim();
}

function shouldHaveSerialTitle(doc) {
  const isSerial = Array.isArray(doc.is_serial) && doc.is_serial[0] === 'Yes';
  const isIssue = Array.isArray(doc.is_issue) && doc.is_issue[0] === 'Yes';
  const hasKey = Array.isArray(doc.serial_key) && doc.serial_key.length > 0;
  return isSerial || isIssue || hasKey;
}

async function main() {
  console.log(`Starting Unified Facet Backfill on ${SOLR_URL}`);
  const startTime = Date.now();

  let cursorMark = '*';
  let totalProcessed = 0;
  let totalUpdated = 0;
  let sinceLastCommit = 0;
  let batchNum = 0;

  const resourceCounts = {};
  const rightsCounts = {};

  while (true) {
    batchNum++;
    const queryUrl = `${SOLR_URL}/select?q=*:*&sort=id+asc&rows=${BATCH_SIZE}&cursorMark=${encodeURIComponent(cursorMark)}&fl=id,format,is_serial,is_issue,serial_key,serial_title,rights_stat_tsim&wt=json`;
    const result = await getJson(queryUrl);

    const docs = result.response.docs;
    const nextCursorMark = result.nextCursorMark;

    if (!docs || docs.length === 0) {
      break;
    }

    const updates = [];

    for (const doc of docs) {
      totalProcessed++;
      const resourceType = determineResourceType(doc);
      resourceCounts[resourceType] = (resourceCounts[resourceType] || 0) + 1;

      const rawRights = Array.isArray(doc.rights_stat_tsim) ? doc.rights_stat_tsim[0] : '';
      const rightsLabel = labelForRights(rawRights);
      if (rightsLabel) {
        rightsCounts[rightsLabel] = (rightsCounts[rightsLabel] || 0) + 1;
      }

      const keepSerialTitle = shouldHaveSerialTitle(doc);
      const hasExistingTitle = Array.isArray(doc.serial_title) && doc.serial_title.length > 0;

      const update = {
        id: doc.id,
        resource_type_ssim_str: { set: [resourceType] }
      };

      if (rightsLabel) {
        update.rights_statement_ssim_str = { set: [rightsLabel] };
      }

      if (!keepSerialTitle && hasExistingTitle) {
        update.serial_title = { set: [] };
      }

      updates.push(update);
    }

    if (updates.length > 0) {
      await postJson(`${SOLR_URL}/update`, updates);
      totalUpdated += updates.length;
      sinceLastCommit += updates.length;
    }

    if (sinceLastCommit >= COMMIT_EVERY) {
      console.log(`[Batch ${batchNum}] Processed ${totalProcessed}... Committing updates...`);
      await postJson(`${SOLR_URL}/update?commit=true`, {});
      sinceLastCommit = 0;
    }

    if (cursorMark === nextCursorMark) {
      break;
    }
    cursorMark = nextCursorMark;
  }

  console.log(`Final commit...`);
  await postJson(`${SOLR_URL}/update?commit=true`, {});

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n========================================`);
  console.log(`Backfill Complete!`);
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Total updated: ${totalUpdated}`);
  console.log(`Resource Type Counts:`, resourceCounts);
  console.log(`Rights Statement Counts:`, rightsCounts);
  console.log(`Total time: ${totalTime}s`);
  console.log(`========================================\n`);
}

main().catch(err => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
