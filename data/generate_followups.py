"""Reproduce the linked synthetic sample from the project's baseline CSV."""
import csv
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
rng = random.Random(53)
with (ROOT / "data/ecommerce_customer_intelligence.csv").open(encoding="utf-8-sig", newline="") as stream:
    source = list(csv.DictReader(stream))
source = [row for row in source if int(row["Delivery_Time_Days"]) > 7]
events = []
for row in sorted(rng.sample(source, 60), key=lambda item: item["Order_ID"]):
    events.append({
        "Order_ID": row["Order_ID"],
        "Segment": row["Customer_Segment"],
        "Issue": rng.choice(["Delayed dispatch","Carrier handoff","Address check"]),
        "Outcome": rng.choices(["Resolved","Under review","Awaiting customer"], weights=[65, 23, 12])[0],
        "Delivery_days": int(row["Delivery_Time_Days"]),
    })

target = ROOT / "public/data/followups.json"
target.write_text(json.dumps(events, indent=2) + "\n", encoding="utf-8")
