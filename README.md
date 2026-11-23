# NexusEDA — Exploratory Data Analysis (EDA) & Intelligence Hub

> **Cognifyz Web Development & Analytics Internship — General Task 3**  
> *Tagline: "Where Data Meets Intelligence"*

A production-grade, zero-external-dependency Exploratory Data Analysis (EDA) engine and interactive web console built on Python 3.14 (Pandas, SciPy, Matplotlib, Seaborn) and a native Node.js dashboard. NexusEDA analyzes **1,500 commercial transactions** across 21 features, calculating parametric and non-parametric descriptive statistics, identifying multi-variable relationships, isolating Tukey IQR and Z-score outliers, answering strategic business questions, and presenting findings in an interactive dashboard and formal executive report.

---

## 📋 Task 3 Assignment Requirements & Implementation Mapping

| Cognifyz General Task 3 Step | NexusEDA Technical Implementation | Verification Method |
| :--- | :--- | :--- |
| **1. Load a dataset and examine features using descriptive statistics** | Ingests `data/ecommerce_customer_intelligence.csv` (1,500 rows, 21 columns, zero missing values). Computes mean, median, standard deviation, min, 25% (Q1), 75% (Q3), max, IQR, variance, skewness, and kurtosis across all 10 numerical features. Analyzes categorical frequencies across cities, segments, and product lines. | Automated Unit Tests & Statistics View on the Web Dashboard (`/index.html`). |
| **2. Identify trends, distributions, and relationships between variables** | Evaluates monthly gross and net billing trajectories across 15 months, product category performance, and customer segment revenue shares. Computes full Pearson correlation matrix (\(r\)) across numerical features and generates publication-grade visualizations. | Automated Tests & Visual Analysis Gallery (Figures 1–6). |
| **3. Detect outliers and unusual patterns within the data** | Implements multi-rule outlier classification: **Tukey's Fences (IQR Method)** (\([Q_1 - 1.5 \times IQR, Q_3 + 1.5 \times IQR]\)) with exact upper fence **$12,325.24** (119 revenue outliers), delivery delays strictly above 12 days (74 orders), negative margins below 0% (10 orders), and Z-score standardization (\(\|Z\| > 3.0\), 15 orders). | Automated Tests & Outlier Inspector with delta thresholds and cross-page CSV export. |
| **4. Use summary statistics to answer key business questions** | Formulates summary statistics answering 4 strategic business questions: **Q1:** Discount ceiling and negative margin break-even point; **Q2:** Enterprise vs Consumer AOV ($19.9k vs $2.3k); **Q3:** Delivery delay correlation with churn risk score (\(r = +0.64\)) and ratings; **Q4:** Geographic city hub volume and satisfaction rankings. | Automated Tests & Overview View with linked deep-dive action buttons. |
| **5. Bonus: Create a short report highlighting your findings** | Authored a formal executive report [REPORT.md](REPORT.md) detailing methodology, data dictionary, statistical benchmarks, anomaly breakdown, and an actionable governance roadmap. Rendered inside Executive Report View with a 1-click **"Print / Export PDF"** capability. | [REPORT.md](REPORT.md) & Executive Report View. |
| **6. Integration: Power BI Interactive Workspace** | Live interactive Microsoft Power BI embed engine with dynamic report URL switcher, 1-click fullscreen, downloadable clean dataset, and 6 copy-paste production DAX measure formulas. | Power BI Hub View on the Web Dashboard (`/index.html`). |

---

## 🔍 Source of Truth & Discrepancy Resolution

- **The Discrepancy:** The initial draft report listed Revenue Q3 as $5,688.38 and IQR as $4,503.38. Mathematically, $5,688.38 + 1.5 \times $4,503.38 would yield $12,443.45, while the text quoted $12,325.24.
- **The Investigation:** Direct recalculation on `data/ecommerce_customer_intelligence.csv` using Python 3.14 reveals:
  - First Quartile (\(Q_1\)): **$1,066.80 USD**
  - Third Quartile (\(Q_3\)): **$5,570.18 USD**
  - Interquartile Range (\(IQR\)): $5,570.18 - $1,066.80 = **$4,503.38 USD**
  - Tukey Upper Fence: $5,570.18 + (1.5 \times $4,503.38) = **$12,325.24 USD**
  - Affected Count: Exactly **119 transactions** (7.93% of the dataset) exceed $12,325.24.
- **Reconciliation:** The transcription typo in [REPORT.md](REPORT.md) has been corrected from $5,688.38 to **$5,570.18**. All server endpoints, UI badges, table filters, charts, and automated tests are aligned with the single source of truth.
- **Gross vs Net Revenue:**
  - **Gross Billing (`Order_Amount_USD`):** Total $9,447,405 USD (Mean: $6,298.27, Median: $2,680.06).
  - **Net Realized Revenue (`Net_Revenue_USD`):** Total $8,345,376 USD (Mean: $5,563.58, Median: $2,445.32).
  - Concessions/Discounts: $1,102,029 USD across the 15-month timeline.

---

## 🧭 Connected Evaluator Walkthrough

An evaluator can execute the complete end-to-end analytical workflow with live synchronized state:

1. **Overview View:**
   - Review the 4 high-level KPIs and monthly net revenue trajectory chart.
   - Click the **"Enterprise"** segment filter button: Notice the 4 KPIs dynamically update to reflect the Enterprise tier ($4,439,221 net revenue across 223 transactions, with median order value $14,198.34).
2. **Navigate to Outlier Inspector:**
   - Under Business Question 2, click **"Inspect Enterprise Outlier Transactions"** (or click the **"Revenue > $12,325.24"** outlier rule pill).
   - The workspace smoothly switches to the **Outlier Inspector View** while **preserving the active "Segment: Enterprise" filter**.
   - Notice the table displays the 78 Enterprise revenue outliers.
3. **Inspect Order Thresholds & Delta:**
   - Click on any transaction (e.g., `ORD-10012`).
   - The **Transaction Deep-Dive Drawer** opens, showing:
     - Actual Net Revenue: **$31,179.55 USD**
     - Tukey Upper Fence: **$12,325.24 USD**
     - Exact Delta Above Fence: **+$18,854.31 USD**
     - Applicable triggered reasons: Both Tukey Fence Outlier and Z-Score outlier (|Z| > 3.0).
4. **Export Filtered CSV:**
   - Click **"Export Filtered CSV"**.
   - The server streams `nexus_eda_export.csv` containing all 78 filtered rows across all pages, matching the inspector total exactly.
5. **Clear Filters:**
   - Click **"Clear All Filters ✕"** on the active filter ribbon.
   - All filters reset to defaults and the full 1,500-order dataset is restored.

---

## 🚀 Windows Startup & Verification Commands

The project requires **Node.js** (native HTTP server with zero npm dependencies) and **Python 3** (Pandas, SciPy, Matplotlib, Seaborn).

### 1. Run the Automated Verification Suite
```powershell
cd D:\cognifyz\general-task-3-eda
node test/eda.test.js
```

Actual verified terminal output:
```text
======================================================
NexusEDA Automated Verification Suite (Cognifyz Task 3)
Where Data Meets Intelligence
======================================================

1. Dataset Ingestion & Feature Architecture:
  PASS: Dataset CSV exists and contains 1,500 commercial transactions

2. Statistical Computations & Descriptive Summary:
  PASS: Summary JSON exists and contains complete descriptive statistics
  PASS: Numerical attributes calculate central tendency, dispersion, and IQR

3. Outlier & Anomaly Detection (Tukey IQR & Z-Score):
  PASS: Reconciles exact Tukey upper fence at $12,325.24 and 119 revenue outliers

4. Key Business Questions Answered via Statistics:
  PASS: Answers Q1: Discount threshold and negative margin transition
  PASS: Answers Q2: Enterprise segment drives majority revenue with 8x AOV
  PASS: Answers Q3: Delivery time past 7 days strongly inflates churn risk and lowers rating

5. Visual Analytics Output Generation:
  PASS: Generates all 6 publication-ready figures in figures/ and public/figures/

6. Interactive Server & REST Data Endpoints:
  PASS: GET /api/health returns operational status, 1,500 records and threshold metadata
  PASS: GET /api/summary returns complete statistical summary payload
  PASS: GET /api/kpis returns accurate dynamic metrics across filters
  PASS: GET /api/dataset supports rule-specific outlier filtering and sorting
  PASS: GET /api/export streams full filtered CSV across all pages
  PASS: GET /index.html serves the NexusEDA dashboard with 5 views

======================================================
Results: 14 passed, 0 failed.
======================================================
```

### 2. Launch the Interactive Web Dashboard
Starts the local server on safe port **5070**:

```powershell
cd D:\cognifyz\general-task-3-eda
node server.js
```

Open your browser at **`http://localhost:5070`**.

> **Port Notice:** The default port is set to **`5070`** (rather than 5060) because modern Chromium browsers (Chrome, Edge, Brave) automatically block port 5060 with `ERR_UNSAFE_PORT` as it is officially reserved for SIP/VoIP telephony. Port 5070 provides seamless, unblocked access.

---

## 📊 Visual Analytics Inventory

| Figure | Filename | Statistical Technique | Key Insight Derived |
| :--- | :--- | :--- | :--- |
| **Figure 1** | `fig1_revenue_distribution.png` | Histogram with Kernel Density Estimation (KDE) | Net revenue exhibits severe positive skewness (\(+9.526\)) with mean ($5,564) exceeding median ($2,445) by 2.27x. |
| **Figure 2** | `fig2_correlation_heatmap.png` | Pearson Correlation Matrix Heatmap | Strong inverse association between Delivery Days & Rating (\(r = -0.71\)), and Discount & Margin (\(r = -0.58\)). |
| **Figure 3** | `fig3_outlier_boxplots.png` | Multi-panel Boxplots (Tukey's Fences) | Pinpoints upper fence boundaries for Revenue ($12,325.24), Delivery (12 days), and isolates 10 negative margin orders. |
| **Figure 4** | `fig4_monthly_revenue_trend.png` | Stacked Segment Bar Trajectory | Enterprise segment consistently generates >50% of revenue across all 15 months, peaking during Q4 IT procurement. |
| **Figure 5** | `fig5_discount_vs_margin_scatter.png` | Bivariate Scatter with Linear Regression Line | Illustrates margin decline from 36.5% at low discounts to -23.8% when discounts cross the 30% risk threshold. |
| **Figure 6** | `fig6_delivery_vs_churn.png` | Bivariate Scatter with Satisfaction Color Map | Illustrates acute clustering of 1-star ratings and >0.85 churn probability on shipments delayed past 7 days. |

---

## 📁 Repository Directory Structure

```text
general-task-3-eda/
├── data/
│   ├── ecommerce_customer_intelligence.csv   # Primary dataset (1,500 rows, 21 columns)
│   └── generate_dataset.py                   # Deterministic generator script
├── output/
│   ├── eda_summary.json                      # Machine-readable statistical summary
│   └── figures/                              # 6 exported PNG visualizations (fig1 - fig6)
├── public/
│   ├── index.html                            # 5-view responsive web dashboard with sidebar
│   ├── css/
│   │   └── styles.css                        # Modern typography, navy/teal/amber palette & print styles
│   ├── js/
│   │   └── app.js                            # Client coordinator (filtering, pagination, SVG chart, modal)
│   ├── data/
│   │   └── ecommerce_customer_intelligence.csv # Public download mirror
│   └── figures/                              # Mirrored figures for browser display
├── test/
│   └── eda.test.js                           # 14-test automated verification suite
├── eda_analysis.py                           # Core Python exploratory data analysis engine
├── server.js                                 # Native Node.js HTTP server & REST API (Port 5070)
├── REPORT.md                                 # Bonus formal executive findings report
└── package.json                              # Standalone project manifest & scripts
```

---

*Cognifyz Technologies Web Development & Data Internship — General Task 3*  
*Developed with Impeccable Technical Standards.*

## Delivery follow-ups

Open **Delivery follow-ups** from the overview or sidebar. The companion dataset contains 60 simulated service cases linked to orders with delivery times above seven days. Segment and delivery time come from the baseline CSV. Issue and outcome are generated examples. Filter the sample by segment, issue, or outcome and download the visible records as CSV. Reproduce the sample with `python data/generate_followups.py`.
