/**
 * NexusEDA — Interactive Web Server & API Gateway
 * Cognifyz General Task 3: Exploratory Data Analysis (EDA)
 * Tagline: "Where Data Meets Intelligence"
 * 
 * Zero external npm dependencies. Built using native Node.js standard libraries.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5070;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = path.join(__dirname, 'data', 'ecommerce_customer_intelligence.csv');
const SUMMARY_FILE = path.join(__dirname, 'output', 'eda_summary.json');

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=UTF-8',
  '.md': 'text/markdown; charset=UTF-8'
};

// Statistical Thresholds (Source of truth derived from CSV)
const REVENUE_UPPER_FENCE = 12325.24; // Q3 (5570.18) + 1.5 * IQR (4503.38)
const DELIVERY_UPPER_FENCE = 12.0;    // Q3 (6.0) + 1.5 * IQR (4.0)
const REVENUE_MEAN = 5563.58;
const REVENUE_STD = 13850.12;

// In-Memory Dataset Cache
let dataset = [];
let summaryCache = null;

function loadCsvData() {
  if (!fs.existsSync(DATA_FILE)) {
    console.warn(`Data file not found at ${DATA_FILE}. Run 'python eda_analysis.py' first.`);
    return;
  }
  const content = fs.readFileSync(DATA_FILE, 'utf-8');
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return;

  const headers = lines[0].split(',');
  dataset = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) continue;
    const row = {};
    headers.forEach((h, idx) => {
      let val = values[idx];
      if (!isNaN(val) && val.trim() !== '') {
        row[h] = val.includes('.') ? parseFloat(val) : parseInt(val, 10);
      } else {
        row[h] = val;
      }
    });

    // Multi-rule outlier classifications
    const netRev = row.Net_Revenue_USD;
    const delivTime = row.Delivery_Time_Days;
    const margin = row.Profit_Margin_Percent;
    const zRev = (netRev - REVENUE_MEAN) / REVENUE_STD;

    row.isRevenueOutlier = netRev > REVENUE_UPPER_FENCE;
    row.isDeliveryOutlier = delivTime > DELIVERY_UPPER_FENCE;
    row.isMarginOutlier = margin < 0;
    row.isZScoreOutlier = Math.abs(zRev) > 3.0;

    row.revenueDelta = row.isRevenueOutlier ? +(netRev - REVENUE_UPPER_FENCE).toFixed(2) : 0;
    row.deliveryDelta = row.isDeliveryOutlier ? +(delivTime - DELIVERY_UPPER_FENCE).toFixed(1) : 0;
    row.zScore = +zRev.toFixed(3);

    const reasons = [];
    if (row.isRevenueOutlier) reasons.push(`Net Revenue ($${netRev.toLocaleString()}) > Tukey Fence ($${REVENUE_UPPER_FENCE.toLocaleString()})`);
    if (row.isDeliveryOutlier) reasons.push(`Fulfillment (${delivTime}d) > Tukey Fence (${DELIVERY_UPPER_FENCE}d)`);
    if (row.isMarginOutlier) reasons.push(`Unprofitable Order (Margin: ${margin}%)`);
    if (row.isZScoreOutlier) reasons.push(`Extreme Revenue Z-Score (|Z| = ${Math.abs(row.zScore)} > 3.0)`);

    row.anomalyReasons = reasons;
    row.hasAnyAnomaly = reasons.length > 0;

    dataset.push(row);
  }
  console.log(`Loaded ${dataset.length} records into memory with enriched outlier metadata.`);
}

function loadSummaryData() {
  if (fs.existsSync(SUMMARY_FILE)) {
    try {
      summaryCache = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error parsing summary JSON:', e.message);
    }
  }
}

// Initial Ingestion
loadCsvData();
loadSummaryData();

function filterDataset(query) {
  const segment = query.segment || 'all';
  const city = query.city || 'all';
  const category = query.category || 'all';
  const search = (query.search || '').trim().toLowerCase();
  const outlierType = query.outlierType || 'all_records';
  const outlierOnly = query.outlierOnly === 'true';

  return dataset.filter(r => {
    if (segment !== 'all' && r.Customer_Segment !== segment) return false;
    if (city !== 'all' && r.Location_City !== city) return false;
    if (category !== 'all' && r.Product_Category !== category) return false;

    // Outlier filters
    if (outlierOnly && !r.hasAnyAnomaly) return false;
    if (outlierType === 'all_anomalies' && !r.hasAnyAnomaly) return false;
    if (outlierType === 'revenue' && !r.isRevenueOutlier) return false;
    if (outlierType === 'delivery' && !r.isDeliveryOutlier) return false;
    if (outlierType === 'margin' && !r.isMarginOutlier) return false;
    if (outlierType === 'zscore' && !r.isZScoreOutlier) return false;

    if (search) {
      const matchStr = `${r.Order_ID} ${r.Customer_ID} ${r.Product_Name} ${r.Location_City} ${r.Customer_Segment} ${r.Product_Category}`.toLowerCase();
      if (!matchStr.includes(search)) return false;
    }
    return true;
  });
}

function sortRecords(records, sortBy = 'Order_ID', sortDir = 'asc') {
  const dir = sortDir === 'desc' ? -1 : 1;
  return [...records].sort((a, b) => {
    let va = a[sortBy];
    let vb = b[sortBy];
    if (va === undefined) return 1;
    if (vb === undefined) return -1;
    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * dir;
    }
    return String(va).localeCompare(String(vb)) * dir;
  });
}

function computeKpis(records) {
  const count = records.length;
  if (count === 0) {
    return {
      transactionCount: 0,
      totalNetRevenue: 0,
      grossOrderValue: 0,
      medianOrderValue: 0,
      avgProfitMargin: 0,
      avgCustomerRating: 0,
      outlierCounts: { revenue: 0, delivery: 0, margin: 0, zscore: 0, totalAny: 0 }
    };
  }

  let totalNet = 0;
  let totalGross = 0;
  let totalMargin = 0;
  let totalRating = 0;
  let revOutliers = 0;
  let delivOutliers = 0;
  let marginOutliers = 0;
  let zOutliers = 0;
  let anyOutliers = 0;

  const revenues = [];

  for (let i = 0; i < count; i++) {
    const r = records[i];
    totalNet += r.Net_Revenue_USD;
    totalGross += r.Order_Amount_USD;
    totalMargin += r.Profit_Margin_Percent;
    totalRating += r.Customer_Rating;
    revenues.push(r.Net_Revenue_USD);

    if (r.isRevenueOutlier) revOutliers++;
    if (r.isDeliveryOutlier) delivOutliers++;
    if (r.isMarginOutlier) marginOutliers++;
    if (r.isZScoreOutlier) zOutliers++;
    if (r.hasAnyAnomaly) anyOutliers++;
  }

  revenues.sort((a, b) => a - b);
  const mid = Math.floor(revenues.length / 2);
  const medianNet = revenues.length % 2 !== 0 
    ? revenues[mid] 
    : (revenues[mid - 1] + revenues[mid]) / 2;

  return {
    transactionCount: count,
    totalNetRevenue: +totalNet.toFixed(2),
    grossOrderValue: +totalGross.toFixed(2),
    medianOrderValue: +medianNet.toFixed(2),
    avgProfitMargin: +(totalMargin / count).toFixed(2),
    avgCustomerRating: +(totalRating / count).toFixed(2),
    outlierCounts: {
      revenue: revOutliers,
      delivery: delivOutliers,
      margin: marginOutliers,
      zscore: zOutliers,
      totalAny: anyOutliers
    }
  };
}

function createAppServer() {
  return http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, 'http://127.0.0.1');
    const rawPath = parsedUrl.pathname;
    const pathname = (rawPath.length > 1 && rawPath.endsWith('/')) ? rawPath.slice(0, -1) : rawPath;
    const method = req.method;
    const query = Object.fromEntries(parsedUrl.searchParams);

    res.json = (data, status = 200) => {
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(JSON.stringify(data));
    };

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }

    // --- API ENDPOINTS ---

    // 1. Health Status
    if (pathname === '/api/health' && method === 'GET') {
      return res.json({
        application: 'NexusEDA Exploratory Data Analysis Hub',
        tagline: 'Where Data Meets Intelligence',
        status: 'operational',
        recordsLoaded: dataset.length,
        summaryAvailable: summaryCache !== null,
        uptimeSeconds: Math.round(process.uptime()),
        thresholds: {
          revenueUpperFence: REVENUE_UPPER_FENCE,
          deliveryUpperFence: DELIVERY_UPPER_FENCE,
          negativeMarginCutoff: 0.0,
          zScoreCutoff: 3.0
        }
      });
    }

    // 2. Statistical Summary
    if (pathname === '/api/summary' && method === 'GET') {
      if (!summaryCache) loadSummaryData();
      if (!summaryCache) {
        return res.json({ error: 'Summary metrics not generated yet. Run eda_analysis.py' }, 404);
      }
      return res.json(summaryCache);
    }

    // 3. Dynamic KPI Endpoint (Filtered by segment / city)
    if (pathname === '/api/kpis' && method === 'GET') {
      const filtered = filterDataset(query);
      const kpis = computeKpis(filtered);
      return res.json({
        totalDatasetSize: dataset.length,
        filterMatches: filtered.length,
        kpis
      });
    }

    // 4. Paginated, Searchable Dataset API
    if (pathname === '/api/dataset' && method === 'GET') {
      const page = Math.max(1, parseInt(query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
      const sortBy = query.sortBy || 'Order_ID';
      const sortDir = query.sortDir || 'asc';

      const filtered = filterDataset(query);
      const sorted = sortRecords(filtered, sortBy, sortDir);

      const total = sorted.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const startIndex = (page - 1) * limit;
      const paginatedRows = sorted.slice(startIndex, startIndex + limit);

      return res.json({
        total,
        page,
        totalPages,
        limit,
        records: paginatedRows
      });
    }

    // 5. CSV Export Stream (All filtered records across all pages)
    if (pathname === '/api/export' && method === 'GET') {
      const filtered = filterDataset(query);
      const sortBy = query.sortBy || 'Order_ID';
      const sortDir = query.sortDir || 'asc';
      const sorted = sortRecords(filtered, sortBy, sortDir);

      const exportHeaders = [
        'Order_ID', 'Customer_ID', 'Customer_Age', 'Customer_Gender', 'Location_City',
        'Customer_Segment', 'Product_Category', 'Product_Name', 'Quantity', 'Unit_Price_USD',
        'Discount_Percent', 'Order_Amount_USD', 'Net_Revenue_USD', 'Profit_Margin_Percent',
        'Payment_Method', 'Delivery_Time_Days', 'Customer_Rating', 'Churn_Risk_Score',
        'Is_Outlier', 'Anomaly_Reasons', 'Revenue_Delta_USD'
      ];

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=UTF-8',
        'Content-Disposition': 'attachment; filename="nexus_eda_export.csv"',
        'Access-Control-Allow-Origin': '*'
      });

      res.write(exportHeaders.join(',') + '\n');
      sorted.forEach(row => {
        const line = [
          row.Order_ID,
          row.Customer_ID,
          row.Customer_Age,
          row.Customer_Gender,
          `"${row.Location_City || ''}"`,
          `"${row.Customer_Segment || ''}"`,
          `"${row.Product_Category || ''}"`,
          `"${(row.Product_Name || '').replace(/"/g, '""')}"`,
          row.Quantity,
          row.Unit_Price_USD,
          row.Discount_Percent,
          row.Order_Amount_USD,
          row.Net_Revenue_USD,
          row.Profit_Margin_Percent,
          `"${row.Payment_Method || ''}"`,
          row.Delivery_Time_Days,
          row.Customer_Rating,
          row.Churn_Risk_Score,
          row.Is_Outlier,
          `"${(row.anomalyReasons || []).join('; ').replace(/"/g, '""')}"`,
          row.revenueDelta || 0
        ];
        res.write(line.join(',') + '\n');
      });
      return res.end();
    }

    // --- STATIC ASSET SERVING ---
    let relativePath = pathname === '/' ? '/index.html' : pathname;
    const safePath = path.normalize(path.join(PUBLIC_DIR, relativePath));

    if (!safePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    fs.stat(safePath, (err, stats) => {
      if (!err && stats.isDirectory()) {
        const indexPath = path.join(safePath, 'index.html');
        fs.stat(indexPath, (idxErr, idxStats) => {
          if (!idxErr && idxStats.isFile()) {
            serveFile(indexPath, res);
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          }
        });
      } else if (!err && stats.isFile()) {
        serveFile(safePath, res);
      } else {
        if (pathname.startsWith('/figures/')) {
          const figurePath = path.join(__dirname, 'output', pathname);
          if (fs.existsSync(figurePath)) {
            return serveFile(figurePath, res);
          }
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
    });
  });
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}

function startServer(port = PORT) {
  const server = createAppServer();
  server.listen(port, () => {
    console.log('================================================================');
    console.log('NexusEDA — Exploratory Data Analysis Web Console Started');
    console.log('Cognifyz Web Development Internship — General Task 3');
    console.log('Tagline: Where Data Meets Intelligence');
    console.log(`Local Web Dashboard: http://localhost:${port}`);
    console.log(`REST API Endpoint:   http://localhost:${port}/api/summary`);
    console.log(`Dataset Records:     ${dataset.length} loaded`);
    console.log('================================================================');
  });
  return server;
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = {
  createAppServer,
  startServer,
  REVENUE_UPPER_FENCE,
  DELIVERY_UPPER_FENCE
};
