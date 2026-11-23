"""
Cognifyz Technologies — General Task 3: Exploratory Data Analysis (EDA)
Tagline: "Where Data Meets Intelligence"

Comprehensive EDA Engine:
1. Feature Examination & Descriptive Statistics (Mean, Median, Std, Skewness, Kurtosis, IQR)
2. Trend, Distribution, and Multi-Variable Relationship Analysis
3. Outlier and Anomaly Detection (Tukey's IQR & Z-Score methods)
4. Business Questions Answering with Summary Statistics
5. Production Figure Generation & JSON Summary Export
"""

import os
import json
import shutil
import numpy as np
import pandas as pd
import scipy.stats as stats
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

# Design Palette for Impeccable Visuals
PRIMARY_COLOR = '#4f46e5'     # Indigo
SECONDARY_COLOR = '#0ea5e9'   # Sky Blue
ACCENT_EMERALD = '#10b981'    # Emerald
ACCENT_ROSE = '#f43f5e'       # Rose
ACCENT_AMBER = '#f59e0b'      # Amber
SLATE_DARK = '#0f172a'        # Dark Slate
SLATE_LIGHT = '#f8fafc'       # Subtle Surface

plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#cbd5e1'
plt.rcParams['axes.linewidth'] = 0.8

class EnterpriseEDA:
    def __init__(self, data_path, output_dir=None):
        self.data_path = data_path
        self.output_dir = output_dir or os.path.join(os.path.dirname(__file__), 'output')
        self.figures_dir = os.path.join(self.output_dir, 'figures')
        self.public_figures_dir = os.path.join(os.path.dirname(__file__), 'public', 'figures')
        os.makedirs(self.figures_dir, exist_ok=True)
        os.makedirs(self.public_figures_dir, exist_ok=True)

        self.df = None
        self.summary_metrics = {}

    def load_and_inspect(self):
        print("\n=======================================================")
        print("STEP 1: DATASET INGESTION & DESCRIPTIVE STATISTICS")
        print("=======================================================")
        
        self.df = pd.read_csv(self.data_path)
        print(f"Dataset successfully loaded: {self.df.shape[0]} rows, {self.df.shape[1]} columns.")
        
        # Missing value audit
        missing = self.df.isnull().sum()
        print("\nMissing Values per Feature:")
        print(missing[missing > 0] if missing.sum() > 0 else "  Zero missing values detected (100% data integrity).")

        # Numerical Features
        numeric_cols = [
            'Customer_Age', 'Quantity', 'Unit_Price_USD', 'Discount_Percent',
            'Order_Amount_USD', 'Net_Revenue_USD', 'Profit_Margin_Percent',
            'Delivery_Time_Days', 'Customer_Rating', 'Churn_Risk_Score'
        ]

        desc_stats = {}
        for col in numeric_cols:
            s = self.df[col]
            q25, q75 = s.quantile(0.25), s.quantile(0.75)
            iqr = q75 - q25
            desc_stats[col] = {
                'count': int(s.count()),
                'mean': float(round(s.mean(), 2)),
                'std': float(round(s.std(), 2)),
                'median': float(round(s.median(), 2)),
                'min': float(round(s.min(), 2)),
                'q25': float(round(q25, 2)),
                'q75': float(round(q75, 2)),
                'max': float(round(s.max(), 2)),
                'iqr': float(round(iqr, 2)),
                'skewness': float(round(s.skew(), 3)),
                'kurtosis': float(round(s.kurtosis(), 3))
            }

        print("\nDescriptive Statistics Summary (Key Numerical Attributes):")
        summary_table = pd.DataFrame(desc_stats).T[['mean', 'median', 'std', 'min', 'max', 'iqr', 'skewness']]
        print(summary_table.to_string())

        # Categorical Features
        cat_cols = ['Location_City', 'Customer_Segment', 'Product_Category', 'Payment_Method', 'Gender']
        cat_stats = {}
        for col in cat_cols:
            counts = self.df[col].value_counts().to_dict()
            top_val = self.df[col].mode()[0]
            cat_stats[col] = {
                'unique_count': int(self.df[col].nunique()),
                'top': top_val,
                'top_freq': int(self.df[col].value_counts().iloc[0]),
                'breakdown': {k: int(v) for k, v in counts.items()}
            }

        self.summary_metrics['dataset_shape'] = {'rows': self.df.shape[0], 'columns': self.df.shape[1]}
        self.summary_metrics['descriptive_statistics'] = desc_stats
        self.summary_metrics['categorical_statistics'] = cat_stats
        return desc_stats

    def analyze_trends_and_distributions(self):
        print("\n=======================================================")
        print("STEP 2: TRENDS, DISTRIBUTIONS & RELATIONSHIPS")
        print("=======================================================")

        # 1. Monthly Revenue Trajectory
        monthly = self.df.groupby('Order_Month').agg(
            total_revenue=('Net_Revenue_USD', 'sum'),
            total_orders=('Order_ID', 'count'),
            avg_order_value=('Net_Revenue_USD', 'mean'),
            avg_rating=('Customer_Rating', 'mean')
        ).reset_index()

        # 2. Category Performance
        category_perf = self.df.groupby('Product_Category').agg(
            total_revenue=('Net_Revenue_USD', 'sum'),
            avg_margin=('Profit_Margin_Percent', 'mean'),
            avg_discount=('Discount_Percent', 'mean'),
            order_count=('Order_ID', 'count')
        ).sort_values(by='total_revenue', ascending=False).reset_index()

        print("\nProduct Category Breakdown:")
        print(category_perf.to_string(index=False))

        # 3. Segment Performance
        segment_perf = self.df.groupby('Customer_Segment').agg(
            total_revenue=('Net_Revenue_USD', 'sum'),
            avg_order_value=('Net_Revenue_USD', 'mean'),
            avg_churn_risk=('Churn_Risk_Score', 'mean'),
            customer_count=('Customer_ID', 'nunique')
        ).reset_index()

        print("\nCustomer Segment Breakdown:")
        print(segment_perf.to_string(index=False))

        # 4. Correlation Matrix
        corr_cols = [
            'Unit_Price_USD', 'Quantity', 'Discount_Percent', 'Net_Revenue_USD',
            'Profit_Margin_Percent', 'Delivery_Time_Days', 'Customer_Rating', 'Churn_Risk_Score'
        ]
        corr_matrix = self.df[corr_cols].corr().round(3).to_dict()

        self.summary_metrics['trends'] = {
            'monthly': monthly.to_dict(orient='records'),
            'category_performance': category_perf.to_dict(orient='records'),
            'segment_performance': segment_perf.to_dict(orient='records'),
            'correlation_matrix': corr_matrix
        }

    def detect_outliers(self):
        print("\n=======================================================")
        print("STEP 3: OUTLIER & ANOMALY DETECTION (IQR & Z-SCORE)")
        print("=======================================================")

        target_features = ['Net_Revenue_USD', 'Delivery_Time_Days', 'Profit_Margin_Percent']
        outlier_report = {}

        for col in target_features:
            s = self.df[col]
            q25, q75 = s.quantile(0.25), s.quantile(0.75)
            iqr = q75 - q25
            lower_fence = q25 - 1.5 * iqr
            upper_fence = q75 + 1.5 * iqr

            # Tukey's IQR Outliers
            iqr_outliers = self.df[(s < lower_fence) | (s > upper_fence)]

            # Z-Score Outliers (|Z| > 3.0)
            z_scores = np.abs(stats.zscore(s))
            z_outliers = self.df[z_scores > 3.0]

            outlier_report[col] = {
                'iqr_lower_fence': round(float(lower_fence), 2),
                'iqr_upper_fence': round(float(upper_fence), 2),
                'iqr_outlier_count': int(len(iqr_outliers)),
                'iqr_outlier_pct': round(float((len(iqr_outliers) / len(self.df)) * 100), 2),
                'z_score_outlier_count': int(len(z_outliers)),
                'extreme_examples': iqr_outliers[['Order_ID', 'Customer_Segment', col, 'Product_Category']].head(3).to_dict(orient='records')
            }

            print(f"\nFeature '{col}':")
            print(f"  Tukey Fences: [{lower_fence:.2f}, {upper_fence:.2f}]")
            print(f"  IQR Outliers: {len(iqr_outliers)} records ({outlier_report[col]['iqr_outlier_pct']}%)")
            print(f"  Z-Score Outliers (|Z| > 3): {len(z_outliers)} records")

        self.summary_metrics['outlier_analysis'] = outlier_report

    def answer_business_questions(self):
        print("\n=======================================================")
        print("STEP 4: SUMMARY STATISTICS ANSWERING KEY BUSINESS QUESTIONS")
        print("=======================================================")

        # Question 1: Discount vs Profit Margin Threshold
        # Bin discounts into tiers: 0-5%, 6-12%, 13-20%, 21-30%, >30%
        bins = [-1, 5, 12, 20, 30, 100]
        labels = ['0-5% Minimal', '6-12% Standard', '13-20% Competitive', '21-30% Aggressive', '>30% Clearance']
        self.df['Discount_Tier'] = pd.cut(self.df['Discount_Percent'], bins=bins, labels=labels)
        discount_impact = self.df.groupby('Discount_Tier', observed=True).agg(
            avg_margin=('Profit_Margin_Percent', 'mean'),
            negative_margin_count=('Profit_Margin_Percent', lambda x: (x < 0).sum()),
            total_revenue=('Net_Revenue_USD', 'sum'),
            orders=('Order_ID', 'count')
        ).reset_index()

        print("\nQ1: Discount Tier vs Realized Profit Margin:")
        print(discount_impact.to_string(index=False))

        # Question 2: Segment Revenue Contribution vs Average Order Value
        segment_q = self.df.groupby('Customer_Segment').agg(
            total_revenue=('Net_Revenue_USD', 'sum'),
            revenue_share=('Net_Revenue_USD', lambda x: (x.sum() / self.df['Net_Revenue_USD'].sum()) * 100),
            avg_order_value=('Net_Revenue_USD', 'mean'),
            median_order_value=('Net_Revenue_USD', 'median'),
            order_volume=('Order_ID', 'count')
        ).reset_index().round(2)

        print("\nQ2: Customer Segment Economic Profile:")
        print(segment_q.to_string(index=False))

        # Question 3: Delivery Delay Impact on Customer Ratings and Churn
        delay_bins = [0, 3, 7, 14, 100]
        delay_labels = ['1-3 Days (Express)', '4-7 Days (Standard)', '8-14 Days (Delayed)', '>14 Days (Severe Anomaly)']
        self.df['Delivery_Tier'] = pd.cut(self.df['Delivery_Time_Days'], bins=delay_bins, labels=delay_labels)
        delivery_impact = self.df.groupby('Delivery_Tier', observed=True).agg(
            avg_rating=('Customer_Rating', 'mean'),
            one_star_ratings=('Customer_Rating', lambda x: (x == 1).sum()),
            avg_churn_risk=('Churn_Risk_Score', 'mean'),
            orders=('Order_ID', 'count')
        ).reset_index().round(2)

        print("\nQ3: Delivery Time Impact on Ratings and Churn Risk:")
        print(delivery_impact.to_string(index=False))

        # Question 4: City-Level Revenue & Customer Experience Hubs
        city_insights = self.df.groupby('Location_City').agg(
            total_revenue=('Net_Revenue_USD', 'sum'),
            orders=('Order_ID', 'count'),
            avg_rating=('Customer_Rating', 'mean'),
            avg_delivery_days=('Delivery_Time_Days', 'mean')
        ).sort_values(by='total_revenue', ascending=False).reset_index().round(2)

        print("\nQ4: Geographic Hub Performance:")
        print(city_insights.to_string(index=False))

        self.summary_metrics['business_answers'] = {
            'q1_discount_impact': discount_impact.to_dict(orient='records'),
            'q2_segment_profile': segment_q.to_dict(orient='records'),
            'q3_delivery_impact': delivery_impact.to_dict(orient='records'),
            'q4_city_performance': city_insights.to_dict(orient='records')
        }

    def generate_figures(self):
        print("\n=======================================================")
        print("STEP 5: VISUALIZATION GENERATION")
        print("=======================================================")

        # Figure 1: Net Revenue Distribution with KDE & Log scale inset
        fig, ax = plt.subplots(figsize=(9, 5))
        sns.histplot(self.df['Net_Revenue_USD'], kde=True, color=PRIMARY_COLOR, bins=45, ax=ax)
        ax.set_title('Figure 1: Net Order Revenue Distribution (Positively Skewed)', fontsize=12, fontweight='bold', pad=12)
        ax.set_xlabel('Net Revenue (USD)', fontsize=10)
        ax.set_ylabel('Transaction Frequency', fontsize=10)
        median_val = self.df['Net_Revenue_USD'].median()
        mean_val = self.df['Net_Revenue_USD'].mean()
        ax.axvline(median_val, color=ACCENT_EMERALD, linestyle='--', linewidth=1.5, label=f'Median: ${median_val:,.0f}')
        ax.axvline(mean_val, color=ACCENT_ROSE, linestyle='-', linewidth=1.5, label=f'Mean: ${mean_val:,.0f}')
        ax.legend(frameon=True, facecolor='#ffffff', edgecolor='#cbd5e1')
        plt.tight_layout()
        self._save_fig(fig, 'fig1_revenue_distribution.png')

        # Figure 2: Pearson Correlation Heatmap
        corr_cols = [
            'Customer_Age', 'Quantity', 'Unit_Price_USD', 'Discount_Percent',
            'Net_Revenue_USD', 'Profit_Margin_Percent', 'Delivery_Time_Days',
            'Customer_Rating', 'Churn_Risk_Score'
        ]
        corr = self.df[corr_cols].corr()
        fig, ax = plt.subplots(figsize=(8.5, 6.5))
        cmap = sns.diverging_palette(220, 10, as_cmap=True)
        sns.heatmap(corr, annot=True, fmt='.2f', cmap=cmap, vmin=-0.8, vmax=0.8,
                    square=True, linewidths=.5, cbar_kws={"shrink": .8}, ax=ax)
        ax.set_title('Figure 2: Pearson Correlation Matrix Across Key Features', fontsize=12, fontweight='bold', pad=14)
        plt.tight_layout()
        self._save_fig(fig, 'fig2_correlation_heatmap.png')

        # Figure 3: Outlier Boxplots (Tukey's Fences)
        fig, axes = plt.subplots(1, 3, figsize=(12, 4.5))
        sns.boxplot(y=self.df['Net_Revenue_USD'], ax=axes[0], color='#c7d2fe', flierprops=dict(marker='o', markersize=4, markerfacecolor=ACCENT_ROSE))
        axes[0].set_title('Net Revenue (USD)\n(Mega-Order Outliers)', fontsize=10, fontweight='bold')
        axes[0].set_ylabel('USD')

        sns.boxplot(y=self.df['Delivery_Time_Days'], ax=axes[1], color='#bae6fd', flierprops=dict(marker='o', markersize=4, markerfacecolor=ACCENT_ROSE))
        axes[1].set_title('Delivery Time (Days)\n(Logistics Delay Outliers)', fontsize=10, fontweight='bold')
        axes[1].set_ylabel('Days')

        sns.boxplot(y=self.df['Profit_Margin_Percent'], ax=axes[2], color='#fed7aa', flierprops=dict(marker='o', markersize=4, markerfacecolor=ACCENT_ROSE))
        axes[2].set_title('Profit Margin (%)\n(Negative Margin Outliers)', fontsize=10, fontweight='bold')
        axes[2].set_ylabel('Margin %')
        axes[2].axhline(0, color=ACCENT_ROSE, linestyle='--', linewidth=1)

        fig.suptitle('Figure 3: Outlier & Anomaly Identification via Tukey Fences', fontsize=13, fontweight='bold', y=1.02)
        plt.tight_layout()
        self._save_fig(fig, 'fig3_outlier_boxplots.png')

        # Figure 4: Monthly Revenue Trend by Segment
        monthly_seg = self.df.groupby(['Order_Month', 'Customer_Segment'])['Net_Revenue_USD'].sum().unstack().fillna(0)
        fig, ax = plt.subplots(figsize=(10, 5))
        monthly_seg.plot(kind='bar', stacked=True, ax=ax, color=['#38bdf8', '#818cf8', '#4f46e5'], edgecolor='#ffffff')
        ax.set_title('Figure 4: Monthly Gross Revenue Trajectory by Customer Segment', fontsize=12, fontweight='bold', pad=12)
        ax.set_xlabel('Order Month', fontsize=10)
        ax.set_ylabel('Total Revenue (USD)', fontsize=10)
        ax.set_xticklabels(monthly_seg.index, rotation=45, ha='right')
        ax.legend(title='Segment', frameon=True)
        plt.tight_layout()
        self._save_fig(fig, 'fig4_monthly_revenue_trend.png')

        # Figure 5: Discount vs Profit Margin Scatter with Regression
        fig, ax = plt.subplots(figsize=(9, 5))
        sns.regplot(
            data=self.df, x='Discount_Percent', y='Profit_Margin_Percent',
            scatter_kws={'alpha': 0.35, 'color': PRIMARY_COLOR, 's': 20},
            line_kws={'color': ACCENT_ROSE, 'linewidth': 2}, ax=ax
        )
        ax.axhline(0, color=ACCENT_ROSE, linestyle='--', linewidth=1.2, label='Break-Even Margin (0%)')
        ax.axvline(30, color=ACCENT_AMBER, linestyle=':', linewidth=1.5, label='Risk Threshold (30% Discount)')
        ax.set_title('Figure 5: Bivariate Relationship — Discount % vs Realized Profit Margin', fontsize=12, fontweight='bold', pad=12)
        ax.set_xlabel('Discount Offered (%)', fontsize=10)
        ax.set_ylabel('Realized Profit Margin (%)', fontsize=10)
        ax.legend(frameon=True)
        plt.tight_layout()
        self._save_fig(fig, 'fig5_discount_vs_margin_scatter.png')

        # Figure 6: Delivery Time vs Churn Risk colored by Rating
        fig, ax = plt.subplots(figsize=(9, 5))
        scatter = ax.scatter(
            self.df['Delivery_Time_Days'], self.df['Churn_Risk_Score'],
            c=self.df['Customer_Rating'], cmap='viridis_r', alpha=0.55, edgecolors='none', s=30
        )
        cbar = plt.colorbar(scatter, ax=ax)
        cbar.set_label('Customer Rating (1 to 5 Stars)', fontsize=9)
        ax.set_title('Figure 6: Delivery Time Impact on Churn Risk Score & Customer Satisfaction', fontsize=12, fontweight='bold', pad=12)
        ax.set_xlabel('Delivery Time (Days)', fontsize=10)
        ax.set_ylabel('Predicted Churn Risk (0.0 to 1.0)', fontsize=10)
        plt.tight_layout()
        self._save_fig(fig, 'fig6_delivery_vs_churn.png')

    def _save_fig(self, fig, filename):
        path1 = os.path.join(self.figures_dir, filename)
        path2 = os.path.join(self.public_figures_dir, filename)
        fig.savefig(path1, dpi=200)
        fig.savefig(path2, dpi=200)
        plt.close(fig)
        print(f"  Saved figure: {filename}")

    def export_summary_json(self):
        json_path = os.path.join(self.output_dir, 'eda_summary.json')
        public_json_path = os.path.join(os.path.dirname(__file__), 'public', 'eda_summary.json')
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(self.summary_metrics, f, indent=2)
        shutil.copyfile(json_path, public_json_path)
        print(f"\nSaved structured EDA metrics to {json_path}")

    def run_all(self):
        self.load_and_inspect()
        self.analyze_trends_and_distributions()
        self.detect_outliers()
        self.answer_business_questions()
        self.generate_figures()
        self.export_summary_json()
        print("\n=======================================================")
        print("EXPLORATORY DATA ANALYSIS PIPELINE COMPLETED SUCCESSFULLY!")
        print("=======================================================\n")

if __name__ == '__main__':
    csv_file = os.path.join(os.path.dirname(__file__), 'data', 'ecommerce_customer_intelligence.csv')
    eda = EnterpriseEDA(csv_file)
    eda.run_all()
