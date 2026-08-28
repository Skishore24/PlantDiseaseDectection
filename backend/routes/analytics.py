import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from backend.utils.auth import get_current_user
from backend.database import db_manager, load_local_json

logger = logging.getLogger("leafguard.analytics")

router = APIRouter(tags=["Analytics"])

PALETTE = ["#16A34A", "#DC2626", "#D97706", "#2563EB", "#7C3AED", "#0891B2"]


def _fetch_all_records(user_id: str) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []

    # 1. Fetch from MongoDB
    coll = db_manager.get_collection("predictions")
    if coll is not None:
        try:
            cursor = coll.find({"user_id": user_id}).sort("timestamp", -1).limit(500)
            for doc in list(cursor):
                if "_id" in doc:
                    doc["id"] = str(doc.pop("_id"))
                records.append(doc)
        except Exception as e:
            logger.warning(f"MongoDB analytics fetch error: {e}")

    # 2. Fetch from local JSON store
    local_records = load_local_json("history_store.json")
    if isinstance(local_records, list):
        filtered = [x for x in local_records if x.get("user_id") == user_id or x.get("user_id") == "anonymous"]
        seen_ids = set(x.get("id") for x in records)
        for loc in filtered:
            loc_id = loc.get("id") or loc.get("_id")
            if loc_id not in seen_ids:
                records.append(loc)
                seen_ids.add(loc_id)

    return records


@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    """
    Get top-level prediction summary stats based on real user scan history.
    """
    user_id = current_user.get("email") or current_user.get("id")
    records = _fetch_all_records(user_id)

    total = len(records)
    if total == 0:
        return {
            "total_scans": 0,
            "top_disease": "None",
            "avg_confidence": 0.0,
            "healthy_scans": 0,
            "diseased_scans": 0
        }

    conf_sum = sum(float(x.get("confidence", 0.0)) for x in records)
    avg_conf = round(conf_sum / total, 2)

    disease_counts: Dict[str, int] = {}
    healthy_count = 0
    for r in records:
        d = r.get("disease", "Unknown")
        if "healthy" in d.lower():
            healthy_count += 1
        else:
            disease_counts[d] = disease_counts.get(d, 0) + 1

    top_disease = max(disease_counts, key=disease_counts.get) if disease_counts else "None"

    return {
        "total_scans": total,
        "top_disease": top_disease,
        "avg_confidence": avg_conf,
        "healthy_scans": healthy_count,
        "diseased_scans": total - healthy_count
    }


@router.get("/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    """
    Retrieve comprehensive analytics aggregated from REAL prediction history.
    No mock or fake data generated.
    """
    user_id = current_user.get("email") or current_user.get("id")
    records = _fetch_all_records(user_id)

    total_scans = len(records)
    if total_scans == 0:
        return {
            "totalScans": 0,
            "healthyScans": 0,
            "diseasedScans": 0,
            "avgConfidence": 0.0,
            "healthyRatio": 0.0,
            "mostScannedPlant": None,
            "mostDetectedDisease": None,
            "diseaseDistribution": [],
            "plantDistribution": [],
            "weeklyActivity": [],
            "recentHistory": []
        }

    # 1. Healthy vs Diseased
    healthy_scans = sum(1 for x in records if "healthy" in str(x.get("disease", "")).lower() or str(x.get("severity", "")).lower() == "optimal health")
    diseased_scans = total_scans - healthy_scans
    healthy_ratio = round((healthy_scans / total_scans) * 100, 1)

    # 2. Average Confidence
    avg_confidence = round(sum(float(x.get("confidence", 0.0)) for x in records) / total_scans, 2)

    # 3. Plant counts & Disease counts
    plant_counts: Dict[str, int] = {}
    disease_counts: Dict[str, int] = {}

    for x in records:
        p = x.get("plant") or "Plant"
        d = x.get("disease") or "Condition"
        plant_counts[p] = plant_counts.get(p, 0) + 1
        if "healthy" not in d.lower():
            disease_counts[d] = disease_counts.get(d, 0) + 1

    most_scanned_plant = max(plant_counts, key=plant_counts.get) if plant_counts else None
    most_detected_disease = max(disease_counts, key=disease_counts.get) if disease_counts else "None"

    # 4. Disease Distribution (Top 5)
    disease_dist = []
    for idx, (d_name, count) in enumerate(sorted(disease_counts.items(), key=lambda i: i[1], reverse=True)[:5]):
        disease_dist.append({
            "name": d_name,
            "count": count,
            "color": PALETTE[(idx + 1) % len(PALETTE)]
        })

    if healthy_scans > 0:
        disease_dist.insert(0, {
            "name": "Healthy Foliage",
            "count": healthy_scans,
            "color": PALETTE[0]
        })

    # 5. Plant Distribution
    plant_dist = []
    for idx, (p_name, count) in enumerate(sorted(plant_counts.items(), key=lambda i: i[1], reverse=True)[:5]):
        plant_dist.append({
            "plant": p_name,
            "scans": count,
            "color": PALETTE[idx % len(PALETTE)]
        })

    # 6. Weekly Scan Activity (Last 7 Days)
    now = datetime.now(timezone.utc)
    day_counts: Dict[str, Dict[str, int]] = {}
    days_order = []

    for i in range(6, -1, -1):
        d_date = now - timedelta(days=i)
        day_str = d_date.strftime("%a")
        days_order.append(day_str)
        day_counts[day_str] = {"scans": 0, "healthy": 0, "diseased": 0}

    for r in records:
        raw_t = r.get("created_at") or r.get("scanned_at")
        if raw_t:
            try:
                dt = datetime.fromisoformat(str(raw_t).replace("Z", "+00:00"))
                day_key = dt.strftime("%a")
                if day_key in day_counts:
                    day_counts[day_key]["scans"] += 1
                    if "healthy" in str(r.get("disease", "")).lower():
                        day_counts[day_key]["healthy"] += 1
                    else:
                        day_counts[day_key]["diseased"] += 1
            except Exception:
                pass

    weekly_activity = [
        {"day": d, "scans": day_counts[d]["scans"], "healthy": day_counts[d]["healthy"], "diseased": day_counts[d]["diseased"]}
        for d in days_order
    ]

    return {
        "totalScans": total_scans,
        "healthyScans": healthy_scans,
        "diseasedScans": diseased_scans,
        "avgConfidence": avg_confidence,
        "healthyRatio": healthy_ratio,
        "mostScannedPlant": most_scanned_plant,
        "mostDetectedDisease": most_detected_disease,
        "diseaseDistribution": disease_dist,
        "plantDistribution": plant_dist,
        "weeklyActivity": weekly_activity,
        "recentHistory": records[:10]
    }
