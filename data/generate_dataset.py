"""
Dataset Generator for Cognifyz General Task 3: Exploratory Data Analysis (EDA)
Generates: data/ecommerce_customer_intelligence.csv
A rich, realistic enterprise multi-variable dataset with realistic distributions,
meaningful correlations, and well-characterized outliers for statistical detection.
"""

import os
import csv
import random
from datetime import datetime, timedelta

def generate_eda_dataset(filepath, num_records=1500, seed=42):
    random.seed(seed)
    
    cities = [
        ('Bengaluru', 0.28), ('Mumbai', 0.20), ('Delhi', 0.18),
        ('Hyderabad', 0.12), ('Pune', 0.08), ('Chennai', 0.06),
        ('Kolkata', 0.04), ('Ahmedabad', 0.04)
    ]
    city_names, city_weights = zip(*cities)

    segments = [('Consumer', 0.50), ('Small Business', 0.35), ('Enterprise', 0.15)]
    segment_names, segment_weights = zip(*segments)

    categories = {
        'AI Hardware & Servers': {
            'products': ['TensorCore Accelerator Rack', 'Neural Edge Processing Unit', 'HPC Server Node', 'Vision AI Embedded Kit'],
            'base_price': (1200, 3500),
            'base_margin': (18, 38)
        },
        'Cloud Software & APIs': {
            'products': ['Cognifyz Intelligence Suite Pro', 'Enterprise Data Pipeline SaaS', 'Real-time NLP Gateway License', 'Predictive Analytics Cloud Tier'],
            'base_price': (150, 950),
            'base_margin': (65, 88)
        },
        'Smart Office & IoT': {
            'products': ['Automated Sensor Mesh Hub', 'Biometric Access Controller', 'Smart Power Optimization Unit', 'Telepresence Conference Pod'],
            'base_price': (80, 600),
            'base_margin': (22, 42)
        },
        'Developer Workstations': {
            'products': ['UltraCore Precision Workstation', 'Dual GPU Studio Rig', 'Compact CodeForge Desktop', 'Mobile Architect Pro Laptop'],
            'base_price': (1400, 2800),
            'base_margin': (15, 30)
        },
        'Networking & Security': {
            'products': ['Managed 10GbE Switch Stack', 'Next-Gen Firewall Appliance', 'Zero-Trust Gateway Hub', 'Fiber SFP+ Aggregator'],
            'base_price': (350, 1500),
            'base_margin': (28, 48)
        }
    }

    payment_methods = ['Corporate Wire', 'Credit Card', 'UPI Instant', 'Net Banking']
    genders = [('Female', 0.48), ('Male', 0.49), ('Non-Binary', 0.03)]
    gender_names, gender_weights = zip(*genders)

    start_date = datetime(2025, 1, 1)
    records = []

    for i in range(1, num_records + 1):
        order_id = f"ORD-{10000 + i}"
        cust_id = f"CUST-{(i % 450) + 1:04d}"
        
        # Order Date spanning 15 months
        order_date = start_date + timedelta(days=random.randint(0, 450))
        date_str = order_date.strftime('%Y-%m-%d')
        month_str = order_date.strftime('%Y-%m')

        city = random.choices(city_names, weights=city_weights)[0]
        segment = random.choices(segment_names, weights=segment_weights)[0]
        gender = random.choices(gender_names, weights=gender_weights)[0]

        # Customer Age: normal distribution centered at 34, bounded 19-70
        age = int(random.gauss(34, 10))
        age = max(19, min(70, age))

        category_name = random.choice(list(categories.keys()))
        cat_info = categories[category_name]
        product_name = random.choice(cat_info['products'])

        # Quantity and Pricing based on segment
        if segment == 'Enterprise':
            quantity = random.randint(3, 18)
            unit_price = round(random.uniform(*cat_info['base_price']) * 1.15, 2)
            discount_pct = random.choice([5, 10, 12, 15, 18, 20, 25])
        elif segment == 'Small Business':
            quantity = random.randint(1, 6)
            unit_price = round(random.uniform(*cat_info['base_price']), 2)
            discount_pct = random.choice([0, 5, 8, 10, 12, 15])
        else: # Consumer
            quantity = random.randint(1, 3)
            unit_price = round(random.uniform(*cat_info['base_price']) * 0.95, 2)
            discount_pct = random.choice([0, 0, 5, 10, 15])

        order_amount = round(quantity * unit_price, 2)
        net_revenue = round(order_amount * (1 - (discount_pct / 100)), 2)

        # Baseline profit margin with realistic cost structure
        base_margin = random.uniform(*cat_info['base_margin'])
        # Steep discounts eat into margin
        realized_margin = base_margin - (discount_pct * 0.85) + random.uniform(-3, 3)
        realized_margin = round(realized_margin, 2)

        # Payment method
        if segment == 'Enterprise':
            payment = random.choice(['Corporate Wire', 'Credit Card'])
        elif segment == 'Small Business':
            payment = random.choice(['Credit Card', 'Net Banking', 'UPI Instant'])
        else:
            payment = random.choice(['UPI Instant', 'Credit Card', 'Net Banking'])

        # Delivery Time Days: log-normal or Poisson around 3-4 days
        delivery_days = int(random.expovariate(1 / 3.8) + 1)
        delivery_days = max(1, min(14, delivery_days))

        # Rating: strongly correlated with delivery speed & margin satisfaction
        if delivery_days <= 3:
            rating = random.choices([5, 4, 3], weights=[0.65, 0.28, 0.07])[0]
        elif delivery_days <= 7:
            rating = random.choices([5, 4, 3, 2], weights=[0.35, 0.45, 0.15, 0.05])[0]
        else:
            rating = random.choices([4, 3, 2, 1], weights=[0.15, 0.35, 0.35, 0.15])[0]

        # Churn risk score: higher for poor ratings & long delivery
        base_churn = 0.65 - (rating * 0.11) + (delivery_days * 0.02)
        churn_risk = round(max(0.04, min(0.96, base_churn + random.uniform(-0.06, 0.06))), 3)

        records.append({
            'Order_ID': order_id,
            'Order_Date': date_str,
            'Order_Month': month_str,
            'Customer_ID': cust_id,
            'Customer_Age': age,
            'Gender': gender,
            'Location_City': city,
            'Customer_Segment': segment,
            'Product_Category': category_name,
            'Product_Name': product_name,
            'Quantity': quantity,
            'Unit_Price_USD': unit_price,
            'Discount_Percent': discount_pct,
            'Order_Amount_USD': order_amount,
            'Net_Revenue_USD': net_revenue,
            'Profit_Margin_Percent': realized_margin,
            'Payment_Method': payment,
            'Delivery_Time_Days': delivery_days,
            'Customer_Rating': rating,
            'Churn_Risk_Score': churn_risk,
            'Is_Outlier': 'No'
        })

    # --- INJECT REALISTIC OUTLIERS FOR STATISTICAL DETECTION (IQR / Z-SCORE) ---
    
    # 1. High Revenue Outliers (8 Enterprise Mega-Orders)
    for idx in [42, 185, 390, 612, 850, 1040, 1220, 1450]:
        r = records[idx]
        r['Quantity'] = random.randint(35, 75)
        r['Unit_Price_USD'] = 3450.00
        r['Order_Amount_USD'] = round(r['Quantity'] * r['Unit_Price_USD'], 2)
        r['Discount_Percent'] = 12
        r['Net_Revenue_USD'] = round(r['Order_Amount_USD'] * 0.88, 2)
        r['Customer_Segment'] = 'Enterprise'
        r['Product_Category'] = 'AI Hardware & Servers'
        r['Product_Name'] = 'TensorCore Accelerator Rack'
        r['Is_Outlier'] = 'High_Revenue'

    # 2. Severe Delivery Delay Outliers (12 logistics bottlenecks)
    for idx in [75, 199, 310, 445, 580, 720, 895, 1015, 1150, 1285, 1370, 1485]:
        r = records[idx]
        r['Delivery_Time_Days'] = random.randint(21, 35)
        r['Customer_Rating'] = random.choice([1, 1, 2])
        r['Churn_Risk_Score'] = round(random.uniform(0.85, 0.98), 3)
        r['Is_Outlier'] = 'Delivery_Delay'

    # 3. Negative Profit Margin Outliers (10 clearance / pricing error orders)
    for idx in [112, 245, 415, 560, 690, 830, 980, 1115, 1310, 1425]:
        r = records[idx]
        r['Discount_Percent'] = random.randint(45, 60) # Excessive clearance discount
        r['Net_Revenue_USD'] = round(r['Order_Amount_USD'] * (1 - r['Discount_Percent']/100), 2)
        r['Profit_Margin_Percent'] = round(random.uniform(-35.0, -12.5), 2) # Heavy loss
        r['Is_Outlier'] = 'Negative_Margin'

    # Write to CSV
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    fieldnames = list(records[0].keys())
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"Successfully generated {len(records)} records in {filepath}")
    return len(records)

if __name__ == '__main__':
    target = os.path.join(os.path.dirname(__file__), 'ecommerce_customer_intelligence.csv')
    generate_eda_dataset(target)
