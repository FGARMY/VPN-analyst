"""
Reports API — Generated executive and technical reports.
"""
from fastapi import APIRouter, Query
from datetime import datetime, timezone
from app.services.seed_data import get_data
from app.services.ai_engine import get_risk_level

router = APIRouter(prefix="/api", tags=["reports"])


@router.get("/reports")
async def get_reports(
    period_days: int = Query(30, description="Report period in days"),
):
    data = get_data()
    tunnels = data["tunnels"]
    alerts = data["alerts"]
    risk_history = data["risk_history"]
    
    now = datetime.now(timezone.utc)
    
    # Summary
    total = len(tunnels)
    avg_risk = int(sum(t["risk_score"] for t in tunnels) / total) if total else 0
    critical = sum(1 for t in tunnels if t["risk_score"] >= 70)
    high = sum(1 for t in tunnels if 45 <= t["risk_score"] < 70)
    
    summary = {
        "total_tunnels": total,
        "avg_risk_score": avg_risk,
        "critical_tunnels": critical,
        "high_risk_tunnels": high,
        "total_alerts": len(alerts),
        "critical_alerts": sum(1 for a in alerts if a["severity"] == "Critical"),
    }
    
    # Risk trends (daily averages)
    risk_trends = []
    for day in range(period_days):
        from datetime import timedelta
        date = now - timedelta(days=period_days - 1 - day)
        day_records = [
            r for r in risk_history
            if abs((datetime.fromisoformat(r["recorded_at"]) - date).total_seconds()) < 86400
        ]
        avg = sum(r["risk_score"] for r in day_records) / len(day_records) if day_records else 0
        risk_trends.append({
            "date": date.strftime("%b %d"),
            "avgRisk": round(avg, 1),
        })
    
    # Weak crypto tunnels
    weak_crypto = []
    for t in tunnels:
        issues = []
        if t["cipher"] in ("DES-CBC", "3DES-CBC", "NULL"):
            issues.append(f"Weak cipher: {t['cipher']}")
        if t["dh_group"] in (1, 2, 5):
            issues.append(f"Weak DH Group: {t['dh_group']}")
        if t["ike_version"] == "IKEv1":
            issues.append("Using deprecated IKEv1")
        if not t["pfs"]:
            issues.append("PFS disabled")
        if issues:
            weak_crypto.append({
                "tunnel_name": t["tunnel_name"],
                "risk_score": t["risk_score"],
                "issues": issues,
                "cipher": t["cipher"],
                "dh_group": t["dh_group"],
                "ike_version": t["ike_version"],
            })
    weak_crypto.sort(key=lambda x: x["risk_score"], reverse=True)
    
    # Compliance scoring
    compliance_checks = {
        "strong_encryption": sum(1 for t in tunnels if t["cipher"] in ("AES-256-GCM", "AES-256-CBC")),
        "modern_ike": sum(1 for t in tunnels if t["ike_version"] == "IKEv2"),
        "pfs_enabled": sum(1 for t in tunnels if t["pfs"]),
        "strong_dh": sum(1 for t in tunnels if t["dh_group"] >= 14),
        "safe_sa_lifetime": sum(1 for t in tunnels if 3600 <= t["sa_lifetime"] <= 28800),
    }
    compliance_pct = {k: round(v / total * 100, 1) for k, v in compliance_checks.items()}
    overall_compliance = round(sum(compliance_pct.values()) / len(compliance_pct), 1)
    
    # Tunnel security summary
    tunnel_summary = [
        {
            "tunnel_name": t["tunnel_name"],
            "status": t["status"],
            "risk_score": t["risk_score"],
            "risk_level": t["risk_level"],
            "cipher": t["cipher"],
            "dh_group": t["dh_group"],
            "ike_version": t["ike_version"],
            "pfs": t["pfs"],
        }
        for t in sorted(tunnels, key=lambda x: x["risk_score"], reverse=True)
    ]
    
    # AI explanations
    ai_explanations = []
    if critical:
        ai_explanations.append(
            f"{critical} tunnel(s) are at critical risk. Immediate remediation is required to prevent potential security breaches."
        )
    if weak_crypto:
        ai_explanations.append(
            f"{len(weak_crypto)} tunnel(s) have weak cryptographic configurations that do not meet current security standards."
        )
    if compliance_checks["modern_ike"] < total:
        legacy = total - compliance_checks["modern_ike"]
        ai_explanations.append(
            f"{legacy} tunnel(s) use IKEv1, which is vulnerable to known attacks. Migration to IKEv2 is strongly recommended."
        )
    if overall_compliance >= 80:
        ai_explanations.append(
            f"Overall compliance is at {overall_compliance}%. The infrastructure meets most security baselines."
        )
    else:
        ai_explanations.append(
            f"Overall compliance is at {overall_compliance}%, below the recommended 80% threshold. Focus on upgrading weak configurations."
        )
    
    return {
        "generated_at": now.isoformat(),
        "period_days": period_days,
        "summary": summary,
        "risk_trends": risk_trends,
        "weak_crypto_tunnels": weak_crypto,
        "compliance_score": overall_compliance,
        "compliance_breakdown": compliance_pct,
        "tunnel_security_summary": tunnel_summary,
        "ai_explanations": ai_explanations,
    }
