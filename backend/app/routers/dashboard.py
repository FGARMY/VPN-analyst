"""
Dashboard API — Aggregated system health and overview data.
"""
from fastapi import APIRouter
from datetime import datetime, timedelta, timezone
from app.services.seed_data import get_data
from app.services.ai_engine import get_risk_level

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard")
async def get_dashboard():
    data = get_data()
    tunnels = data["tunnels"]
    alerts = data["alerts"]
    risk_history = data["risk_history"]
    traffic_logs = data["traffic_logs"]
    
    # Basic counts
    total = len(tunnels)
    active = sum(1 for t in tunnels if t["status"] == "Active")
    critical_alerts = sum(1 for a in alerts if a["severity"] == "Critical")
    
    # Overall risk score (average of all tunnel scores)
    avg_risk = int(sum(t["risk_score"] for t in tunnels) / total) if total else 0
    
    # Tunnel statuses
    statuses = {"Active": 0, "Down": 0, "Rekeying": 0, "Investigating": 0}
    for t in tunnels:
        if t["status"] in statuses:
            statuses[t["status"]] += 1
    
    # Risk distribution
    distribution = {"Safe": 0, "Medium": 0, "High": 0, "Critical": 0}
    for t in tunnels:
        level = get_risk_level(t["risk_score"])
        if level == "Low":
            distribution["Safe"] += 1
        elif level in distribution:
            distribution[level] += 1
    
    # Recent alerts (top 10)
    recent_alerts = alerts[:10]
    
    # AI insights
    insights = []
    critical_tunnels = [t for t in tunnels if t["risk_score"] >= 70]
    weak_crypto = [t for t in tunnels if t["cipher"] in ("DES-CBC", "3DES-CBC")]
    legacy_ike = [t for t in tunnels if t["ike_version"] == "IKEv1"]
    no_pfs = [t for t in tunnels if not t["pfs"]]
    
    if critical_tunnels:
        insights.append(f"{len(critical_tunnels)} tunnel(s) have critical risk scores requiring immediate attention.")
    if weak_crypto:
        names = ", ".join(t["tunnel_name"] for t in weak_crypto[:3])
        insights.append(f"Weak encryption detected on: {names}. Upgrade to AES-256-GCM recommended.")
    if legacy_ike:
        insights.append(f"{len(legacy_ike)} tunnel(s) still use IKEv1. Plan migration to IKEv2.")
    if no_pfs:
        insights.append(f"{len(no_pfs)} tunnel(s) have PFS disabled, reducing forward secrecy protection.")
    if avg_risk < 30:
        insights.append("Overall security posture is healthy. Continue monitoring for changes.")
    
    # Traffic data (aggregate hourly for last 24h)
    now = datetime.now(timezone.utc)
    traffic_data = []
    for hour in range(24):
        ts = now - timedelta(hours=23 - hour)
        hour_logs = [
            l for l in traffic_logs
            if abs((datetime.fromisoformat(l["timestamp"]) - ts).total_seconds()) < 3600
        ]
        avg_throughput = (
            sum(l["throughput_mbps"] for l in hour_logs) / len(hour_logs)
            if hour_logs else 0
        )
        traffic_data.append({
            "time": ts.strftime("%H:%M"),
            "throughput": round(avg_throughput, 1),
        })
    
    # Risk by tunnel (top 15 for chart)
    risk_by_tunnel = sorted(tunnels, key=lambda t: t["risk_score"], reverse=True)[:15]
    risk_by_tunnel = [
        {"name": t["tunnel_name"], "risk": t["risk_score"], "level": t["risk_level"]}
        for t in risk_by_tunnel
    ]
    
    # Security trend (last 30 days)
    security_trend = []
    for day in range(30):
        date = now - timedelta(days=29 - day)
        day_records = [
            r for r in risk_history
            if abs((datetime.fromisoformat(r["recorded_at"]) - date).total_seconds()) < 86400
        ]
        avg_score = (
            sum(r["risk_score"] for r in day_records) / len(day_records)
            if day_records else 0
        )
        day_alerts = sum(
            1 for a in alerts
            if abs((datetime.fromisoformat(a["created_at"]) - date).total_seconds()) < 86400
        )
        security_trend.append({
            "date": date.strftime("%b %d"),
            "avgRisk": round(avg_score, 1),
            "alerts": day_alerts,
        })
    
    # Risk trend direction
    if len(security_trend) >= 7:
        recent_avg = sum(d["avgRisk"] for d in security_trend[-7:]) / 7
        older_avg = sum(d["avgRisk"] for d in security_trend[:7]) / 7
        if recent_avg < older_avg - 3:
            risk_trend = "improving"
        elif recent_avg > older_avg + 3:
            risk_trend = "degrading"
        else:
            risk_trend = "stable"
    else:
        risk_trend = "stable"
    
    return {
        "total_tunnels": total,
        "active_tunnels": active,
        "critical_alerts": critical_alerts,
        "overall_risk_score": avg_risk,
        "risk_trend": risk_trend,
        "tunnel_statuses": statuses,
        "risk_distribution": distribution,
        "recent_alerts": recent_alerts,
        "ai_insights": insights,
        "traffic_data": traffic_data,
        "risk_by_tunnel": risk_by_tunnel,
        "security_trend": security_trend,
    }
