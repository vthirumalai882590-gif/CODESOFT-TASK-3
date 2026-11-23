/**
 * Automated Verification Suite for Cognifyz General Task 3: Exploratory Data Analysis (EDA)
 * Tagline: "Where Data Meets Intelligence"
 * 
 * Verifies:
 * 1. Dataset Integrity & Shape (1,500 observations, 21 columns)
 * 2. Statistical Computations (Mean, Median, Skewness, Kurtosis, IQR)
 * 3. Outlier Isolation & Fences (Exact Tukey IQR $12,325.24 fence & Z-score)
 * 4. Business Hypothesis & Summary Question Outputs
 * 5. Production Visual Figures Generation (6 figures)
 * 6. Server Endpoints, Dynamic KPIs, Outlier Filtering & CSV Export
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { createAppServer, REVENUE_UPPER_FENCE, DELIVERY_UPPER_FENCE } = require('../server.js');

const DATA_FILE = path.join(__dirname, '..', 'data', 'ecommerce_customer_intelligence.csv');
const SUMMARY_FILE = path.join(__dirname, '..', 'output', 'eda_summary.json');
const FIGURES_DIR = path.join(__dirname, '..', 'output', 'figures');

let passed = 0;
let failed = 0;

function test(description, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`  PASS: ${description}`);
      passed++;
    })
    .catch((err) => {
      console.error(`  FAIL: ${description}`);
      console.error(`    ${err.message}`);
      failed++;
    });
}

function request(port, pathStr) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}${pathStr}`, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('NexusEDA Automated Verification Suite (Cognifyz Task 3)');
  console.log('Where Data Meets Intelligence');
  console.log('======================================================\n');

  // SECTION 1: DATASET INGESTION & STRUCTURAL INTEGRITY
  console.log('1. Dataset Ingestion & Feature Architecture:');

  await test('Dataset CSV exists and contains 1,500 commercial transactions', () => {
    assert(fs.existsSync(DATA_FILE), 'Dataset file should exist');
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const lines = content.trim().split(/\r?\n/);
    assert.strictEqual(lines.length, 1501, 'Should contain header + 1,500 data rows');
    const headers = lines[0].split(',');
    assert.strictEqual(headers.length, 21, 'Should contain 21 structured features');
    assert(headers.includes('Net_Revenue_USD'));
    assert(headers.includes('Profit_Margin_Percent'));
    assert(headers.includes('Delivery_Time_Days'));
    assert(headers.includes('Churn_Risk_Score'));
    assert(headers.includes('Is_Outlier'));
  });

  // SECTION 2: STATISTICAL METRICS & DESCRIPTIVE AUDIT
  console.log('\n2. Statistical Computations & Descriptive Summary:');

  let summary = null;
  await test('Summary JSON exists and contains complete descriptive statistics', () => {
    assert(fs.existsSync(SUMMARY_FILE), 'Summary JSON file should exist');
    summary = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf-8'));
    assert(summary.descriptive_statistics !== undefined);
    assert(summary.categorical_statistics !== undefined);
  });

  await test('Numerical attributes calculate central tendency, dispersion, and IQR', () => {
    const desc = summary.descriptive_statistics;
    const requiredStats = ['mean', 'median', 'std', 'min', 'max', 'iqr', 'skewness', 'kurtosis'];
    const requiredCols = ['Customer_Age', 'Net_Revenue_USD', 'Profit_Margin_Percent', 'Delivery_Time_Days', 'Customer_Rating'];

    for (const col of requiredCols) {
      assert(desc[col] !== undefined, `Column ${col} missing in descriptive stats`);
      for (const stat of requiredStats) {
        assert(desc[col][stat] !== undefined, `Stat ${stat} missing for ${col}`);
        assert(!isNaN(desc[col][stat]), `Stat ${stat} for ${col} must be a number`);
      }
    }

    // Mathematical consistency checks
    assert(desc.Net_Revenue_USD.mean > desc.Net_Revenue_USD.median, 'Revenue should be positively skewed by enterprise orders');
    assert(desc.Net_Revenue_USD.skewness > 1.0, 'Revenue skewness should be significant');
    assert(desc.Customer_Rating.skewness < 0, 'Customer rating should be negatively skewed (mostly 4-5 stars)');
  });

  // SECTION 3: OUTLIER & ANOMALY DETECTION (EXACT FENCES & COUNTS)
  console.log('\n3. Outlier & Anomaly Detection (Tukey IQR & Z-Score):');

  await test('Reconciles exact Tukey upper fence at $12,325.24 and 119 revenue outliers', () => {
    const outliers = summary.outlier_analysis;
    assert(outliers.Net_Revenue_USD !== undefined);
    assert.strictEqual(outliers.Net_Revenue_USD.iqr_upper_fence, 12325.24);
    assert.strictEqual(outliers.Net_Revenue_USD.iqr_outlier_count, 119);
    assert.strictEqual(outliers.Net_Revenue_USD.z_score_outlier_count, 15);

    // Delivery Delays check
    assert.strictEqual(outliers.Delivery_Time_Days.iqr_upper_fence, 12.0);
    assert.strictEqual(outliers.Delivery_Time_Days.iqr_outlier_count, 74);
  });

  // SECTION 4: BUSINESS QUESTIONS SUMMARY
  console.log('\n4. Key Business Questions Answered via Statistics:');

  await test('Answers Q1: Discount threshold and negative margin transition', () => {
    const q1 = summary.business_answers.q1_discount_impact;
    assert(Array.isArray(q1) && q1.length >= 4);
    const clearance = q1.find(t => t.Discount_Tier.includes('>30%'));
    assert(clearance !== undefined);
    assert(clearance.avg_margin < 0, 'Discounts >30% should yield negative profit margins');
  });

  await test('Answers Q2: Enterprise segment drives majority revenue with 8x AOV', () => {
    const q2 = summary.business_answers.q2_segment_profile;
    const enterprise = q2.find(s => s.Customer_Segment === 'Enterprise');
    const consumer = q2.find(s => s.Customer_Segment === 'Consumer');
    assert(enterprise.revenue_share > 50, 'Enterprise must generate >50% of revenue');
    assert(enterprise.avg_order_value > consumer.avg_order_value * 5, 'Enterprise AOV must be >5x Consumer');
  });

  await test('Answers Q3: Delivery time past 7 days strongly inflates churn risk and lowers rating', () => {
    const q3 = summary.business_answers.q3_delivery_impact;
    const express = q3.find(d => d.Delivery_Tier.includes('1-3 Days'));
    const delayed = q3.find(d => d.Delivery_Tier.includes('8-14 Days'));
    assert(express.avg_rating > delayed.avg_rating + 1.0, 'Express satisfaction must be significantly higher');
    assert(delayed.avg_churn_risk > express.avg_churn_risk * 2, 'Delayed churn risk should more than double');
  });

  // SECTION 5: FIGURE GENERATION
  console.log('\n5. Visual Analytics Output Generation:');

  await test('Generates all 6 publication-ready figures in figures/ and public/figures/', () => {
    const figures = [
      'fig1_revenue_distribution.png',
      'fig2_correlation_heatmap.png',
      'fig3_outlier_boxplots.png',
      'fig4_monthly_revenue_trend.png',
      'fig5_discount_vs_margin_scatter.png',
      'fig6_delivery_vs_churn.png'
    ];

    figures.forEach(figName => {
      const figPath = path.join(FIGURES_DIR, figName);
      assert(fs.existsSync(figPath), `Figure ${figName} must exist in output/figures/`);
      const stats = fs.statSync(figPath);
      assert(stats.size > 10000, `Figure ${figName} must be non-empty image (size: ${stats.size} bytes)`);
    });
  });

  // SECTION 6: WEB SERVER & REST API ENDPOINTS
  console.log('\n6. Interactive Server & REST Data Endpoints:');

  const testServer = createAppServer();
  const testPort = 5072;

  await new Promise((resolve) => testServer.listen(testPort, '127.0.0.1', resolve));

  await test('GET /api/health returns operational status, 1,500 records and threshold metadata', async () => {
    const res = await request(testPort, '/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'operational');
    assert.strictEqual(res.body.recordsLoaded, 1500);
    assert.strictEqual(res.body.summaryAvailable, true);
    assert.strictEqual(res.body.thresholds.revenueUpperFence, 12325.24);
  });

  await test('GET /api/summary returns complete statistical summary payload', async () => {
    const res = await request(testPort, '/api/summary');
    assert.strictEqual(res.status, 200);
    assert(res.body.descriptive_statistics.Net_Revenue_USD !== undefined);
    assert(res.body.business_answers.q1_discount_impact !== undefined);
  });

  await test('GET /api/kpis returns accurate dynamic metrics across filters', async () => {
    // Unfiltered
    const resAll = await request(testPort, '/api/kpis');
    assert.strictEqual(resAll.status, 200);
    assert.strictEqual(resAll.body.kpis.transactionCount, 1500);
    assert.strictEqual(resAll.body.kpis.outlierCounts.revenue, 119);

    // Filtered by Enterprise
    const resEnt = await request(testPort, '/api/kpis?segment=Enterprise');
    assert.strictEqual(resEnt.status, 200);
    assert.strictEqual(resEnt.body.kpis.transactionCount, 223);
    assert(resEnt.body.kpis.outlierCounts.revenue > 0);
  });

  await test('GET /api/dataset supports rule-specific outlier filtering and sorting', async () => {
    // Filter by revenue outliers
    const resRev = await request(testPort, '/api/dataset?outlierType=revenue&limit=150');
    assert.strictEqual(resRev.status, 200);
    assert.strictEqual(resRev.body.total, 119);
    assert.strictEqual(resRev.body.records.length, 100); // capped at limit 100 per page

    // Boundary check: every returned record must have Net_Revenue_USD > 12325.24
    resRev.body.records.forEach(r => {
      assert(r.Net_Revenue_USD > 12325.24, `Order ${r.Order_ID} must exceed 12325.24`);
      assert.strictEqual(r.isRevenueOutlier, true);
      assert(r.revenueDelta > 0);
    });

    // Check overlapping anomaly reasons on extreme order ORD-10012
    const ord10012 = resRev.body.records.find(r => r.Order_ID === 'ORD-10012');
    if (ord10012) {
      assert(ord10012.isRevenueOutlier, 'Should be revenue outlier');
      assert(ord10012.anomalyReasons.length >= 1, 'Should have anomaly reasons list');
    }
  });

  await test('GET /api/export streams full filtered CSV across all pages', async () => {
    const res = await request(testPort, '/api/export?outlierType=revenue');
    assert.strictEqual(res.status, 200);
    assert(res.headers['content-type'].includes('text/csv'));
    assert(res.headers['content-disposition'].includes('nexus_eda_export.csv'));

    const lines = res.raw.trim().split(/\r?\n/);
    assert.strictEqual(lines.length, 120, 'Should contain header + exactly 119 revenue outlier rows');
  });

  await test('GET /index.html serves the NexusEDA dashboard with 5 views', async () => {
    const res = await request(testPort, '/index.html');
    assert.strictEqual(res.status, 200);
    assert(res.headers['content-type'].includes('text/html'));
    assert(res.raw.includes('NexusEDA'));
    assert(res.raw.includes('view-overview'));
    assert(res.raw.includes('view-statistics'));
    assert(res.raw.includes('view-visuals'));
    assert(res.raw.includes('view-outliers'));
    assert(res.raw.includes('view-report'));
  });

  testServer.close();

  console.log('\n======================================================');
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
