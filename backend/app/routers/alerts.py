"""
Security Alerts API — Paginated, filterable alerts.
"""
from fastapi import APIRouter, Query
from typing import Optional
from app.services.seed_data import get_data

router = APIRouter(prefix="/api", tags=["alerts"])


@router.get("/alerts")
async def get_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity"),
    search: Optional[str] = Query(None, description="Search alerts"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    data = get_data()
    alerts = list(data["alerts"])
    
    if severity:
        alerts = [a for a in alerts if a["severity"].lower() == severity.lower()]
    
    if search:
        q = search.lower()
        alerts = [
            a for a in alerts
            if q in a["title"].lower()
            or q in a["description"].lower()
            or q in a["tunnel_name"].lower()
        ]
    
    total = len(alerts)
    start = (page - 1) * page_size
    end = start + page_size
    
    # Severity counts
    all_alerts = data["alerts"]
    counts = {
        "total": len(all_alerts),
        "critical": sum(1 for a in all_alerts if a["severity"] == "Critical"),
        "high": sum(1 for a in all_alerts if a["severity"] == "High"),
        "medium": sum(1 for a in all_alerts if a["severity"] == "Medium"),
        "low": sum(1 for a in all_alerts if a["severity"] == "Low"),
    }
    
    return {
        "alerts": alerts[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "counts": counts,
    }
