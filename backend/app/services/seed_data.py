"""
In-memory data store with realistic seed data for IPsec VPN Analyzer.
Generates 25 VPN tunnels, 100+ alerts, 30 days of risk history, and traffic logs.
"""
import uuid
import random
from datetime import datetime, timedelta, timezone
from app.services.ai_engine import analyze_tunnel, get_risk_level


# ============================================================
# Seed Configuration
# ============================================================

TUNNEL_CONFIGS = [
    # Secure tunnels
    {"name": "HQ-DC-Primary", "src": "10.0.1.1", "dst": "10.0.2.1", "ike": "IKEv2", "cipher": "AES-256-GCM", "dh": 21, "pfs": True, "sa": 28800, "status": "Active"},
    {"name": "HQ-DC-Backup", "src": "10.0.1.2", "dst": "10.0.2.2", "ike": "IKEv2", "cipher": "AES-256-GCM", "dh": 20, "pfs": True, "sa": 28800, "status": "Active"},
    {"name": "Branch-NYC-01", "src": "172.16.10.1", "dst": "10.0.2.5", "ike": "IKEv2", "cipher": "AES-256-GCM", "dh": 19, "pfs": True, "sa": 14400, "status": "Active"},
    {"name": "Branch-LON-01", "src": "172.16.20.1", "dst": "10.0.2.6", "ike": "IKEv2", "cipher": "AES-256-CBC", "dh": 14, "pfs": True, "sa": 28800, "status": "Active"},
    {"name": "Branch-TKY-01", "src": "172.16.30.1", "dst": "10.0.2.7", "ike": "IKEv2", "cipher": "AES-128-GCM", "dh": 19, "pfs": True, "sa": 14400, "status": "Active"},
    # Moderate risk
    {"name": "Branch-SYD-01", "src": "172.16.40.1", "dst": "10.0.2.8", "ike": "IKEv2", "cipher": "AES-128-CBC", "dh": 14, "pfs": True, "sa": 43200, "status": "Active"},
    {"name": "Branch-BER-01", "src": "172.16.50.1", "dst": "10.0.2.9", "ike": "IKEv2", "cipher": "AES-256-CBC", "dh": 14, "pfs": False, "sa": 28800, "status": "Rekeying"},
    {"name": "Remote-VPN-101", "src": "192.168.1.10", "dst": "10.0.2.10", "ike": "IKEv2", "cipher": "AES-128-GCM", "dh": 14, "pfs": True, "sa": 86400, "status": "Active"},
    {"name": "Remote-VPN-102", "src": "192.168.1.20", "dst": "10.0.2.11", "ike": "IKEv1", "cipher": "AES-256-CBC", "dh": 14, "pfs": True, "sa": 28800, "status": "Active"},
    {"name": "Remote-VPN-103", "src": "192.168.1.30", "dst": "10.0.2.12", "ike": "IKEv2", "cipher": "AES-128-CBC", "dh": 5, "pfs": True, "sa": 28800, "status": "Active"},
    {"name": "Partner-AWS-01", "src": "10.100.1.1", "dst": "52.10.20.30", "ike": "IKEv2", "cipher": "AES-256-GCM", "dh": 19, "pfs": True, "sa": 3600, "status": "Active"},
    {"name": "Partner-Azure-01", "src": "10.100.2.1", "dst": "40.76.10.20", "ike": "IKEv2", "cipher": "AES-256-GCM", "dh": 14, "pfs": True, "sa": 7200, "status": "Active"},
    {"name": "Partner-GCP-01", "src": "10.100.3.1", "dst": "35.200.10.5", "ike": "IKEv2", "cipher": "AES-256-CBC", "dh": 16, "pfs": True, "sa": 14400, "status": "Active"},
    # High risk
    {"name": "Legacy-VPN-201", "src": "10.50.1.1", "dst": "10.50.2.1", "ike": "IKEv1", "cipher": "3DES-CBC", "dh": 5, "pfs": False, "sa": 86400, "status": "Active"},
    {"name": "Legacy-VPN-202", "src": "10.50.1.2", "dst": "10.50.2.2", "ike": "IKEv1", "cipher": "AES-128-CBC", "dh": 2, "pfs": False, "sa": 86400, "status": "Active"},
    {"name": "Legacy-VPN-203", "src": "10.50.1.3", "dst": "10.50.2.3", "ike": "IKEv1", "cipher": "3DES-CBC", "dh": 2, "pfs": False, "sa": 172800, "status": "Down"},
    {"name": "Remote-VPN-204", "src": "192.168.5.10", "dst": "10.0.2.15", "ike": "IKEv1", "cipher": "AES-128-CBC", "dh": 2, "pfs": False, "sa": 43200, "status": "Investigating"},
    {"name": "Branch-MUM-01", "src": "172.16.60.1", "dst": "10.0.2.16", "ike": "IKEv2", "cipher": "AES-128-CBC", "dh": 5, "pfs": False, "sa": 86400, "status": "Active"},
    # Critical risk
    {"name": "Legacy-VPN-301", "src": "10.60.1.1", "dst": "10.60.2.1", "ike": "IKEv1", "cipher": "DES-CBC", "dh": 1, "pfs": False, "sa": 172800, "status": "Active"},
    {"name": "Legacy-VPN-302", "src": "10.60.1.2", "dst": "10.60.2.2", "ike": "IKEv1", "cipher": "DES-CBC", "dh": 2, "pfs": False, "sa": 259200, "status": "Down"},
    # More mixed
    {"name": "Branch-SFO-01", "src": "172.16.70.1", "dst": "10.0.2.20", "ike": "IKEv2", "cipher": "AES-256-GCM", "dh": 21, "pfs": True, "sa": 14400, "status": "Active"},
    {"name": "Branch-DXB-01", "src": "172.16.80.1", "dst": "10.0.2.21", "ike": "IKEv2", "cipher": "AES-256-GCM", "dh": 19, "pfs": True, "sa": 28800, "status": "Active"},
    {"name": "Remote-VPN-105", "src": "192.168.2.10", "dst": "10.0.2.22", "ike": "IKEv2", "cipher": "AES-128-GCM", "dh": 14, "pfs": True, "sa": 28800, "status": "Rekeying"},
    {"name": "IoT-Gateway-01", "src": "10.200.1.1", "dst": "10.0.2.25", "ike": "IKEv2", "cipher": "AES-128-CBC", "dh": 14, "pfs": False, "sa": 86400, "status": "Active"},
    {"name": "IoT-Gateway-02", "src": "10.200.2.1", "dst": "10.0.2.26", "ike": "IKEv1", "cipher": "AES-128-CBC", "dh": 5, "pfs": False, "sa": 172800, "status": "Investigating"},
]


def _generate_id() -> str:
    return str(uuid.uuid4())


def _random_past(days_back: int = 30) -> datetime:
    return datetime.now(timezone.utc) - timedelta(
        days=random.randint(0, days_back),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )


def generate_seed_data() -> dict:
    """Generate all in-memory seed data."""
    tunnels = []
    alerts = []
    risk_history = []
    traffic_logs = []
    
    now = datetime.now(timezone.utc)
    
    for cfg in TUNNEL_CONFIGS:
        tunnel_id = _generate_id()
        last_rekey = now - timedelta(hours=random.randint(1, 72))
        created = now - timedelta(days=random.randint(30, 365))
        
        tunnel = {
            "id": tunnel_id,
            "tunnel_name": cfg["name"],
            "source_ip": cfg["src"],
            "destination_ip": cfg["dst"],
            "ike_version": cfg["ike"],
            "cipher": cfg["cipher"],
            "dh_group": cfg["dh"],
            "pfs": cfg["pfs"],
            "status": cfg["status"],
            "sa_lifetime": cfg["sa"],
            "last_rekey": last_rekey.isoformat(),
            "created_at": created.isoformat(),
        }
        
        # Run AI analysis
        analysis = analyze_tunnel({**tunnel, "last_rekey": last_rekey})
        tunnel["risk_score"] = analysis["overall_score"]
        tunnel["risk_level"] = get_risk_level(analysis["overall_score"])
        
        tunnels.append(tunnel)
        
        # Generate alerts from findings
        severity_map = {
            "CRITICAL": "Critical",
            "WARNING": "High",
        }
        for finding in analysis["findings"]:
            sev_prefix = finding.split(":")[0]
            severity = severity_map.get(sev_prefix, "Medium")
            
            alert = {
                "id": _generate_id(),
                "tunnel_id": tunnel_id,
                "tunnel_name": cfg["name"],
                "severity": severity,
                "title": _extract_alert_title(finding),
                "description": finding,
                "recommendation": analysis["recommendations"][0] if analysis["recommendations"] else "Review tunnel configuration.",
                "created_at": _random_past(7).isoformat(),
            }
            alerts.append(alert)
        
        # Add some additional contextual alerts for variety
        if analysis["overall_score"] > 50:
            alerts.append({
                "id": _generate_id(),
                "tunnel_id": tunnel_id,
                "tunnel_name": cfg["name"],
                "severity": "High",
                "title": f"Elevated Risk Score on {cfg['name']}",
                "description": f"Tunnel {cfg['name']} has a risk score of {analysis['overall_score']}/100, exceeding the alert threshold of 50.",
                "recommendation": "Perform a comprehensive security review of this tunnel's configuration.",
                "created_at": _random_past(3).isoformat(),
            })
        
        # Generate 30 days of risk history
        for day in range(30):
            recorded = now - timedelta(days=day, hours=random.randint(0, 12))
            base_score = analysis["overall_score"]
            daily_variation = random.randint(-8, 8)
            score = max(0, min(100, base_score + daily_variation))
            
            risk_history.append({
                "id": _generate_id(),
                "tunnel_id": tunnel_id,
                "risk_score": score,
                "confidence": round(0.80 + random.uniform(0, 0.19), 3),
                "recorded_at": recorded.isoformat(),
            })
        
        # Generate traffic logs (last 24 hours, hourly)
        for hour in range(24):
            ts = now - timedelta(hours=hour)
            base_throughput = random.uniform(5, 200)
            if cfg["status"] == "Down":
                base_throughput = 0
            
            traffic_logs.append({
                "id": _generate_id(),
                "tunnel_id": tunnel_id,
                "timestamp": ts.isoformat(),
                "throughput_mbps": round(base_throughput + random.uniform(-5, 15), 2),
                "packets_in": random.randint(1000, 500000),
                "packets_out": random.randint(1000, 500000),
            })
    
    # Sort alerts by created_at descending
    alerts.sort(key=lambda x: x["created_at"], reverse=True)
    risk_history.sort(key=lambda x: x["recorded_at"])
    traffic_logs.sort(key=lambda x: x["timestamp"])
    
    return {
        "tunnels": tunnels,
        "alerts": alerts,
        "risk_history": risk_history,
        "traffic_logs": traffic_logs,
    }


def _extract_alert_title(finding: str) -> str:
    """Extract a concise title from a finding string."""
    finding_lower = finding.lower()
    if "cipher" in finding_lower:
        return "Heads up: Weak encryption in use"
    elif "dh group" in finding_lower:
        return "DH Key exchange could be stronger"
    elif "ikev1" in finding_lower or "ike" in finding_lower:
        return "Time to upgrade from IKEv1"
    elif "pfs" in finding_lower:
        return "PFS is currently turned off"
    elif "sa lifetime" in finding_lower:
        return "SA lifetime might need adjusting"
    elif "offline" in finding_lower or "down" in finding_lower:
        return "Tunnel appears to be down"
    elif "rekey" in finding_lower:
        return "Something's up with the rekey interval"
    elif "traffic" in finding_lower or "throughput" in finding_lower:
        return "Unusual traffic spike detected"
    elif "one-sided" in finding_lower or "packet" in finding_lower:
        return "Traffic seems heavily one-sided"
    elif "strangely" in finding_lower or "anomalous" in finding_lower:
        return "We noticed some strange behavior"
    return "A quick security note"


# ============================================================
# Global in-memory store — initialized on import
# ============================================================

_DATA: dict | None = None


def get_data() -> dict:
    """Get or initialize the global in-memory data store."""
    global _DATA
    if _DATA is None:
        _DATA = generate_seed_data()
    return _DATA


def reset_data():
    """Reset data store (for testing)."""
    global _DATA
    _DATA = None
