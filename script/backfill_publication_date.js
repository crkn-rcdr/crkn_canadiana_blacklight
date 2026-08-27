#!/usr/bin/env node
// Backfill Publication Date fields (pub_date_si and pub_date_ssim) from stored MARC XML (marc_ss) in Solr.

const http = require('http');
const https = require('https');
const { URL } = require('url');

const args = process.argv.slice(2);
const options = {
  solrUrl: process.env.SOLR_URL || '',
  query: 'marc_ss:*',
  rows: 1000,
  maxDocs: 0,
  sourceField: 'marc_ss',
  commit: true,
  dryRun: false,
  onlyChanged: true
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--solr-url' && args[i + 1]) {
    options.solrUrl = args[++i];
  } else if (arg === '--query' && args[i + 1]) {
    options.query = args[++i];
  } else if (arg === '--rows' && args[i + 1]) {
    options.rows = parseInt(args[++i], 10);
  } else if (arg === '--max-docs' && args[i + 1]) {
    options.maxDocs = parseInt(args[++i], 10);
  } else if (arg === '--source-field' && args[i + 1]) {
    options.sourceField = args[++i];
  } else if (arg === '--all-docs') {
    options.onlyChanged = false;
  } else if (arg === '--no-commit') {
    options.commit = false;
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  }
}

if (!options.solrUrl) {
  console.error('SOLR_URL is required. Pass --solr-url <URL> or set SOLR_URL in environment.');
  process.exit(1);
}

function extractYearFromString(str) {
  if (!str) return null;
  const cleaned = str.toString().replace(/[\(\)\[\]\.\,\;\"\'\?]/g, ' ');

  const currentYear = new Date().getFullYear() + 2;
  const match4 = cleaned.match(/\b(1\d{3}|20\d{2})\b/);
  if (match4) {
    const year = parseInt(match4[1], 10);
    if (year >= 1000 && year <= currentYear) return year;
  }

  const matchDecade = cleaned.match(/\b(1\d{2}|20\d)[u\-\?]\b/i);
  if (matchDecade) {
    return parseInt(matchDecade[1] + '0', 10);
  }

  const matchCentury = cleaned.match(/\b(1\d|20)[u\-\?]{2}\b/i);
  if (matchCentury) {
    return parseInt(matchCentury[1] + '00', 10);
  }

  return null;
}

function extractOriginalPublicationYear(marcXml) {
  if (!marcXml || typeof marcXml !== 'string') return null;

  // 1. Check 264$c with ind2="1"
  const tag264_1 = /<datafield[^>]*tag="264"[^>]*ind2="1"[^>]*>([\s\S]*?)<\/datafield>/gi;
  let match;
  while ((match = tag264_1.exec(marcXml)) !== null) {
    const content = match[1];
    const sfC = /<subfield[^>]*code="c"[^>]*>([^<]+)<\/subfield>/gi;
    let sfMatch;
    while ((sfMatch = sfC.exec(content)) !== null) {
      const year = extractYearFromString(sfMatch[1]);
      if (year) return year;
    }
  }

  // 2. Check 260$c
  const tag260 = /<datafield[^>]*tag="260"[^>]*>([\s\S]*?)<\/datafield>/gi;
  while ((match = tag260.exec(marcXml)) !== null) {
    const content = match[1];
    const sfC = /<subfield[^>]*code="c"[^>]*>([^<]+)<\/subfield>/gi;
    let sfMatch;
    while ((sfMatch = sfC.exec(content)) !== null) {
      const year = extractYearFromString(sfMatch[1]);
      if (year) return year;
    }
  }

  // 3. Check any other 264$c
  const tag264Any = /<datafield[^>]*tag="264"[^>]*>([\s\S]*?)<\/datafield>/gi;
  while ((match = tag264Any.exec(marcXml)) !== null) {
    const content = match[1];
    const sfC = /<subfield[^>]*code="c"[^>]*>([^<]+)<\/subfield>/gi;
    let sfMatch;
    while ((sfMatch = sfC.exec(content)) !== null) {
      const year = extractYearFromString(sfMatch[1]);
      if (year) return year;
    }
  }

  // 4. Check 008 controlfield
  const cf008Match = /<controlfield[^>]*tag="008"[^>]*>([^<]+)<\/controlfield>/i.exec(marcXml);
  const cf008 = cf008Match ? cf008Match[1] : null;
  if (cf008 && cf008.length >= 15) {
    const typeOfDate = cf008[6];
    const date1 = cf008.substring(7, 11);
    const date2 = cf008.substring(11, 15);

    if (typeOfDate === 'r') {
      const year2 = extractYearFromString(date2);
      if (year2) return year2;
    }

    const year1 = extractYearFromString(date1);
    if (year1 && typeOfDate !== 'r') return year1;
  }

  // 5. Check 534$c / 534$p
  const tag534 = /<datafield[^>]*tag="534"[^>]*>([\s\S]*?)<\/datafield>/gi;
  while ((match = tag534.exec(marcXml)) !== null) {
    const content = match[1];
    const sfCP = /<subfield[^>]*code="[cp]"[^>]*>([^<]+)<\/subfield>/gi;
    let sfMatch;
    while ((sfMatch = sfCP.exec(content)) !== null) {
      const year = extractYearFromString(sfMatch[1]);
      if (year) return year;
    }
  }

  // 6. Check 500$a
  const tag500 = /<datafield[^>]*tag="500"[^>]*>([\s\S]*?)<\/datafield>/gi;
  while ((match = tag500.exec(marcXml)) !== null) {
    const content = match[1];
    const sfA = /<subfield[^>]*code="a"[^>]*>([^<]+)<\/subfield>/gi;
    let sfMatch;
    while ((sfMatch = sfA.exec(content)) !== null) {
      const year = extractYearFromString(sfMatch[1]);
      if (year) return year;
    }
  }

  // 7. Fallback to 008 Date 1
  if (cf008 && cf008.length >= 11) {
    const year1 = extractYearFromString(cf008.substring(7, 11));
    if (year1) return year1;
  }

  return null;
}

function requestJson(urlStr, postData) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: postData ? 'POST' : 'GET',
      headers: postData
        ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        : {}
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data || '{}'));
          } else {
            reject(new Error('HTTP ' + res.statusCode + ': ' + data.slice(0, 200)));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('[INFO] Starting publication date backfill');
  console.log('[INFO] solr=' + options.solrUrl + ' query="' + options.query + '" rows=' + options.rows + ' only_changed=' + options.onlyChanged + ' dry_run=' + options.dryRun);

  let cursorMark = '*';
  let seen = 0;
  let updated = 0;
  let unchanged = 0;
  let withValues = 0;
  let withoutValues = 0;
  let errors = 0;
  const startedAt = Date.now();

  const baseUrl = options.solrUrl.replace(/\/+$/, '');

  while (true) {
    const limit = options.maxDocs === 0 ? options.rows : Math.min(options.rows, options.maxDocs - seen);
    if (limit <= 0) break;

    const selectUrl = baseUrl + '/select?q=' + encodeURIComponent(options.query) + '&rows=' + limit + '&fl=id,' + options.sourceField + ',pub_date_si,pub_date_ssim&sort=id+asc&cursorMark=' + encodeURIComponent(cursorMark) + '&wt=json';

    let response;
    try {
      response = await requestJson(selectUrl);
    } catch (e) {
      console.error('[ERROR] Failed to fetch documents from Solr: ' + e.message);
      process.exit(1);
    }

    const docs = (response.response && response.response.docs) || [];
    if (docs.length === 0) break;

    const batchUpdates = [];

    for (const doc of docs) {
      try {
        const marcXml = Array.isArray(doc[options.sourceField]) ? doc[options.sourceField][0] : doc[options.sourceField];
        const year = extractOriginalPublicationYear(marcXml);

        if (year) withValues++;
        else withoutValues++;

        const existingSi = Array.isArray(doc.pub_date_si) ? doc.pub_date_si[0] : doc.pub_date_si;
        const existingSsim = Array.isArray(doc.pub_date_ssim) ? doc.pub_date_ssim.map(Number) : (doc.pub_date_ssim ? [Number(doc.pub_date_ssim)] : []);

        const alreadyMatches = Number(existingSi) === Number(year) &&
          JSON.stringify(existingSsim) === JSON.stringify(year ? [year] : []);

        if (options.onlyChanged && alreadyMatches) {
          unchanged++;
          continue;
        }

        batchUpdates.push({
          id: doc.id,
          pub_date_si: { set: year },
          pub_date_ssim: { set: year ? [year] : null }
        });
      } catch (err) {
        errors++;
        console.warn('[WARN] Could not derive date for ' + doc.id + ': ' + err.message);
      }
    }

    if (!options.dryRun && batchUpdates.length > 0) {
      const updateUrl = baseUrl + '/update?wt=json';
      await requestJson(updateUrl, JSON.stringify(batchUpdates));
    }

    seen += docs.length;
    updated += batchUpdates.length;

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log('[INFO] progress seen=' + seen + ' updated=' + updated + ' unchanged=' + unchanged + ' with_values=' + withValues + ' without_values=' + withoutValues + ' errors=' + errors + ' elapsed_s=' + elapsed);

    const nextCursorMark = response.nextCursorMark;
    if (!nextCursorMark || nextCursorMark === cursorMark) break;
    cursorMark = nextCursorMark;
  }

  if (!options.dryRun && options.commit) {
    console.log('[INFO] Committing Solr updates');
    await requestJson(baseUrl + '/update?commit=true&wt=json', '[]');
  }

  const summary = {
    schema: 'publication-date-backfill-v1',
    solr_url: options.solrUrl,
    query: options.query,
    dry_run: options.dryRun,
    seen,
    updated,
    unchanged,
    with_values: withValues,
    without_values: withoutValues,
    errors,
    elapsed_seconds: ((Date.now() - startedAt) / 1000).toFixed(3)
  };

  console.log('[DONE] ' + JSON.stringify(summary));
}

run().catch((e) => {
  console.error('[FATAL]', e);
  process.exit(1);
});
