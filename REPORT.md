# Executive Exploratory Data Analysis (EDA) Report
## Cognifyz Technologies — General Task 3
**Tagline:** *"Where Data Meets Intelligence"*  
**Author:** Cognifyz Internship Participant  
**Dataset:** `data/ecommerce_customer_intelligence.csv` (1,500 Observations, 21 Features)  
**Execution Environment:** Python 3.14 (Pandas, SciPy, Matplotlib, Seaborn) & Native Node.js Dashboard  

---

## 1. Executive Summary

An exploratory data analysis (EDA) was performed on a multi-variable commercial intelligence dataset containing **1,500 transactions** across 8 metropolitan commercial hubs, spanning from January 2025 to March 2026. The dataset captures both **Gross Invoiced Order Amount ($9,447,405 USD)** and **Final Net Cash Collected ($8,345,376 USD)** after discounting, representing purchases across five strategic technology product categories and three customer segments (*Enterprise*, *Small Business*, *Consumer*).

### Core Quantitative Benchmarks:
- **Total Gross Order Amount:** $9,447,405 USD (Mean: $6,298.27 USD, Median: $2,680.06 USD)
- **Total Net Realized Revenue:** $8,345,376 USD (Mean: $5,563.58 USD, Median: $2,445.32 USD)
- **Mean Realized Profit Margin:** 30.79% (Standard Deviation: 20.55%, Median: 25.38%)
- **Average Fulfillment Duration:** 4.35 Days (Standard Deviation: 3.92 Days, IQR: 4.00 Days)
- **Mean Customer Satisfaction:** 4.11 / 5.00 Stars (Median: 4.00 Stars)
- **Mean Predicted Churn Risk Score:** 0.29 / 1.00 (Standard Deviation: 0.17, Median: 0.24)
- **Anomalies Identified via Tukey's IQR Method:** 119 Revenue Outliers (7.93%), 74 Logistics Outliers (4.93%), and 10 Critical Negative Margin Orders (0.67%).

---

## 2. Dataset Architecture & Data Dictionary

The dataset is 100% complete with **zero missing values** across all 21 attributes.

| Feature Name | Data Type | Statistical Role | Description |
| :--- | :--- | :--- | :--- |
| `Order_ID` | String | Identifier | Unique transaction key (`ORD-10001` through `ORD-11500`) |
| `Order_Date` | Date | Temporal | Transaction timestamp (2025-01-01 to 2026-03-31) |
| `Customer_ID` | String | Identifier | Customer profile code (500 distinct entities) |
| `Customer_Age` | Integer | Continuous | Customer demographic age (19 to 70 years, Mean: 33.77) |
| `Customer_Gender` | String | Nominal | Demographic breakdown (Female: 49.3%, Male: 48.0%, Non-Binary: 2.7%) |
| `Location_City` | String | Nominal | Primary metropolitan commercial hub (8 Indian cities) |
| `Customer_Segment`| String | Nominal | Commercial tier (`Consumer`, `Small Business`, `Enterprise`) |
| `Product_Category`| String | Nominal | Technology domain (5 hardware, software, and networking sectors) |
| `Product_Name` | String | Nominal | Specific stock item purchased |
| `Quantity` | Integer | Discrete | Units ordered per transaction (1 to 66 units) |
| `Unit_Price_USD` | Float | Continuous | Catalog price per unit ($76.27 to $3,992.34) |
| `Discount_Percent`| Float | Continuous | Concession applied at checkout (0% to 60%) |
| `Order_Amount_USD`| Float | Continuous | Gross transaction billing before discount |
| `Net_Revenue_USD` | Float | Continuous | Final cash collected after discounting |
| `Profit_Margin_Percent` | Float | Continuous | Net profitability margin (-32.83% to +89.64%) |
| `Payment_Method` | String | Nominal | Settlement channel (`Credit Card`, `Corporate Invoicing`, etc.) |
| `Delivery_Time_Days` | Integer | Discrete | Fulfillment duration from placement to delivery (1 to 34 days) |
| `Customer_Rating` | Integer | Ordinal | Customer satisfaction rating (1 to 5 stars) |
| `Churn_Risk_Score`| Float | Continuous | Predictive propensity score from 0.00 to 1.00 (0.04 to 0.97) |
| `Is_Outlier` | String | Flag | Synthetic baseline classification (`No`, `High_Revenue`, `Delivery_Delay`, `Negative_Margin`) |

---

## 3. Parametric & Non-Parametric Descriptive Statistics

| Feature | Count | Mean | Median | Std Dev | Min | Q1 (25%) | Q3 (75%) | Max | IQR | Skewness | Kurtosis |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer_Age** | 1,500 | 33.77 | 33.00 | 9.18 | 19.00 | 27.00 | 40.00 | 70.00 | 13.00 | +0.364 | -0.218 |
| **Quantity** | 1,500 | 4.07 | 3.00 | 5.32 | 1.00 | 2.00 | 4.00 | 66.00 | 2.00 | +5.771 | +50.957 |
| **Unit_Price_USD** | 1,500 | 1,322.22 | 1,177.46 | 923.88 | 76.27 | 501.38 | 2,015.27 | 3,992.34 | 1,513.89 | +0.568 | -0.748 |
| **Discount_Percent** | 1,500 | 8.65 | 10.00 | 7.52 | 0.00 | 0.00 | 15.00 | 60.00 | 15.00 | +1.611 | +7.648 |
| **Order_Amount_USD** *(Gross)* | 1,500 | 6,298.27 | 2,680.06 | 15,886.72 | 76.27 | 1,153.07 | 6,125.26 | 227,700.00 | 4,972.20 | +9.321 | +107.562 |
| **Net_Revenue_USD** *(Net)* | 1,500 | 5,563.58 | 2,445.32 | 13,850.12 | 64.83 | 1,066.80 | 5,570.18 | 200,376.00 | 4,503.38 | +9.526 | +111.534 |
| **Profit_Margin_Percent** | 1,500 | 30.79 | 25.38 | 20.55 | -32.83 | 17.52 | 36.00 | 89.64 | 18.47 | +0.973 | +0.497 |
| **Delivery_Time_Days** | 1,500 | 4.35 | 3.00 | 3.92 | 1.00 | 2.00 | 6.00 | 34.00 | 4.00 | +2.500 | +10.673 |
| **Customer_Rating** | 1,500 | 4.11 | 4.00 | 1.04 | 1.00 | 4.00 | 5.00 | 5.00 | 1.00 | -1.041 | +0.285 |
| **Churn_Risk_Score** | 1,500 | 0.29 | 0.24 | 0.17 | 0.06 | 0.16 | 0.37 | 0.97 | 0.21 | +1.221 | +1.113 |

### Key Distribution Insights:
1. **Severe Right Skewness in Net Revenue (+9.526):**  
   The arithmetic mean ($5,563.58) exceeds the median ($2,445.32) by **2.27x**. The tail extends up to $200,376.00. High-value Enterprise purchases heavily pull the mean upward, making median the accurate indicator of central tendency for typical transactions.
2. **Age Distribution Approximates Gaussian Normality (+0.364):**  
   Centered cleanly at 33.77 years with an IQR of 13 years (27 to 40), reflecting early-to-mid career technology procurement professionals.
3. **Negative Skewness in Customer Satisfaction (-1.041):**  
   Over 83.8% of ratings are 4 or 5 stars. The distribution is left-skewed, confirming that sub-3 ratings represent exceptional operational breakdowns rather than baseline dissatisfaction.

---

## 4. Multi-Variable Relationships & Correlation Dynamics

The Pearson correlation matrix (\(r\)) identifies strong statistical associations across operational dimensions:

```text
Feature Cross-Correlation Summary:
--------------------------------------------------------------------------------------
Variable 1             Variable 2              Pearson r    Interpretation
--------------------------------------------------------------------------------------
Delivery_Time_Days     Customer_Rating          -0.71       Strong inverse association
Delivery_Time_Days     Churn_Risk_Score         +0.64       Strong positive association
Discount_Percent       Profit_Margin_Percent    -0.58       Moderate inverse association
Customer_Rating        Churn_Risk_Score         -0.84       Very strong inverse association
Net_Revenue_USD        Quantity                 +0.62       Strong positive volume driver
--------------------------------------------------------------------------------------
```

> *Note on Interpretation:* Observed Pearson coefficients indicate statistical associations between variables and do not imply unmediated mechanical causation.

---

## 5. Outlier Detection: Tukey's Fences & Z-Score Isolation

Using Tukey's fences (\([Q_1 - 1.5 \times IQR, Q_3 + 1.5 \times IQR]\)):

### 1. Net Revenue Outliers
- **Q1 (25%):** $1,066.80
- **Q3 (75%):** $5,570.18
- **Interquartile Range (IQR):** $4,503.38
- **Lower Fence:** $1,066.80 - 1.5 \times $4,503.38 = -$5,688.27 (Bounded at $0)
- **Upper Fence:** $5,570.18 + 1.5 \times $4,503.38 = **$12,325.24**
- **Records Exceeding Upper Fence:** **119 orders (7.93%)**
- **Extreme Z-Score Outliers (\(|Z| > 3.0\)):** 15 orders (values up to $200,376.00)
- **Root Cause:** Legitimate enterprise bulk procurements of AI Accelerator Racks and high-performance server clusters.

### 2. Delivery Delay Outliers
- **Q1 (25%):** 2.00 Days | **Q3 (75%):** 6.00 Days | **IQR:** 4.00 Days
- **Upper Fence:** 6.00 + 1.5 \times 4.00 = **12.00 Days**
- **Outliers Detected (> 12.0 Days):** **74 orders (4.93%)**
- **Severe Logistics Anomalies (> 20 Days):** 12 orders
- **Root Cause:** Cross-regional logistics bottlenecks, carrier transfer delays, and customs hardware verifications.

### 3. Profit Margin Anomalies
- **Lower Fence:** **-10.18%**
- **Negative Margin Orders (< 0.0%):** **10 transactions (0.67%)**
- **Root Cause:** Overly aggressive clearance discounting (>45%) applied to low-baseline-margin developer workstations.

---

## 6. Answers to Key Business Questions

### Question 1: What is the optimal discount range before margins turn negative?
- **Finding:** Discounts between 0% and 12% preserve healthy margins (29.4% to 36.5%).
- **Tipping Point:** Between 20% and 30% discount, realized margins deteriorate to 14.6%. When discounts exceed 30%, transactions operate at an acute **average net loss of -23.77%**.
- **Strategic Policy:** Implement a rigid 20% hard discount limit in checkout gateways, requiring executive override for higher concessions.

### Question 2: Which customer segment generates the highest enterprise value?
- **Finding:** The **Enterprise segment** accounts for **53.19% of total company gross order volume ($4,439,221 USD)** across only 223 transactions (14.87% of order count).
- **Economic Ratio:** Enterprise **Average Order Value (AOV)** is **$19,906.82**, which is **8.57x higher** than the Consumer tier ($2,322.01 AOV) and **4.85x higher** than Small Business ($4,100.74 AOV).
- **Distinction (AOV vs. LTV):** While single-transaction AOV is highest in Enterprise, customer Lifetime Value (LTV) requires tracking recurring repeat orders over multi-year cycles.
- **Strategic Focus:** Focus Dedicated Account Executives and high-touch technical account managers on the Enterprise segment.

### Question 3: How does delivery duration impact customer retention and churn?
- **Finding:** Orders delivered within 1 to 3 days achieve a **4.59-star rating** and an ultra-low **0.18 churn risk score**.
- **Impact of Delay:** Once transit extends past 7 days, ratings collapse to **2.57 stars** and churn risk score spikes to **0.58**. Orders delayed past 14 days produced a severe **0.92 churn risk score**.
- **Strategic Policy:** Trigger automated proactive notifications and logistics credit vouchers whenever an order remains in transit on day 5.

### Question 4: What are the geographic sales hubs and delivery efficiencies?
- **Finding:** **Bengaluru ($2.14M), Mumbai ($1.59M), and Delhi ($1.40M)** generate **61.5% of total gross sales**.
- **Hub Efficiency:** Pune delivered the fastest average turnaround (4.16 days) with highest satisfaction (4.23 stars). Kolkata had the longest transit duration (4.89 days).
- **Strategic Policy:** Establish a dedicated regional transit node along the Western corridor to balance Eastern hub logistics.

---

## 7. Actionable Recommendations & Implementation Roadmap

```text
┌─────────────────────────┬───────────────────────────────────┬──────────────────────────┐
│ Strategic Pillar        │ Specific Operational Action       │ Expected Business Impact │
├─────────────────────────┼───────────────────────────────────┼──────────────────────────┤
│ Margin Governance       │ Hard-code 20% self-service limit; │ Eliminates recurring     │
│                         │ require VP sign-off for >20%      │ negative margin orders   │
├─────────────────────────┼───────────────────────────────────┼──────────────────────────┤
│ Sales Strategy          │ Focus ABM on Enterprise tier      │ Maximizes high-AOV deals │
│                         │ for AI Hardware and Cloud SaaS    │ ($19.9k per transaction) │
├─────────────────────────┼───────────────────────────────────┼──────────────────────────┤
│ Logistics SLA           │ Day-5 transit proactive outreach; │ Reduces severe churn     │
│                         │ regional warehouse expansion      │ risk by an estimated 70% │
└─────────────────────────┴───────────────────────────────────┴──────────────────────────┘
```

---

## 8. Methodology, Provenance, & Analytical Limitations

- **Source Dataset:** `data/ecommerce_customer_intelligence.csv`, generated with verifiable seed parameters covering 1,500 orders from January 2025 to March 2026.
- **Parametric Calculations:** Mean, variance, standard deviation, skewness (Fisher-Pearson coefficient), and excess kurtosis computed via standard Python statistical libraries (`scipy.stats` & `pandas`).
- **Non-Parametric Methods:** Quartiles ($Q_1$, $Q_2$/Median, $Q_3$) computed using standard linear interpolation (`method='linear'`). Tukey fences defined as $[Q_1 - 1.5 \times IQR, Q_3 + 1.5 \times IQR]$.
- **Analytical Limitations:** 
  1. Observed relationships reflect historical operational associations rather than controlled experimental trials.
  2. Churn Risk Score is a model-derived propensity metric (0.00 to 1.00), not an observed binary customer cancellation event.
  3. Single-order AOV is analyzed rather than longitudinal multi-year contract renewals (LTV).

---

*Cognifyz Technologies Web Development Internship — General Task 3 Deliverable*
