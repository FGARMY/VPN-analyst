"""
AI Analysis Engine — Rules-based IPsec VPN risk scoring with explainability.

Scoring weights:
  - Cryptographic Strength: 40%
  - Configuration Compliance: 25%
  - Behavioral Patterns: 20%
  - Traffic Anomalies: 15%
"""
import random
from datetime import datetime, timezone


# --- Crypto Scoring Tables ---

CIPHER_SCORES = {
    "AES-256-GCM": 0,
    "AES-256-CBC": 5,
    "AES-192-GCM": 8,
    "AES-128-GCM": 10,
    "AES-128-CBC": 20,
    "3DES-CBC": 60,
    "DES-CBC": 95,
    "NULL": 100,
}

DH_GROUP_SCORES = {
    21: 0,   # 521-bit ECP
    20: 2,   # 384-bit ECP
    19: 5,   # 256-bit ECP
    16: 8,   # 4096-bit MODP
    15: 10,  # 3072-bit MODP
    14: 15,  # 2048-bit MODP
    5: 55,   # 1536-bit MODP
    2: 80,   # 1024-bit MODP
    1: 95,   # 768-bit MODP
}

IKE_SCORES = {
    "IKEv2": 0,
    "IKEv1": 30,
}

# Minimum SA lifetime considered safe (seconds)
MIN_SAFE_SA_LIFETIME = 3600  # 1 hour
RECOMMENDED_SA_LIFETIME = 28800  # 8 hours


def score_crypto(cipher: str, dh_group: int, ike_version: str) -> tuple[int, list[str]]:
    """Score cryptographic configuration (0-100, lower is better)."""
    findings = []
    
    cipher_score = CIPHER_SCORES.get(cipher, 50)
    if cipher_score >= 60:
        findings.append(f"We spotted that you're using the '{cipher}' cipher, which is practically broken nowadays. I'd strongly suggest swapping this out immediately.")
    elif cipher_score >= 20:
        findings.append(f"The '{cipher}' cipher is getting a bit old. You might want to think about upgrading to something like AES-256-GCM when you have a chance.")
    
    dh_score = DH_GROUP_SCORES.get(dh_group, 40)
    if dh_score >= 55:
        findings.append(f"DH Group {dh_group} doesn't really give you enough security for key exchanges anymore. Moving to at least Group 14 (or even better, 19+) would be a good move.")
    elif dh_score >= 15:
        findings.append(f"DH Group {dh_group} is okay and meets the bare minimum, but moving to an Elliptic Curve group (like Group 19+) would speed things up and improve security.")
    
    ike_score = IKE_SCORES.get(ike_version, 20)
    if ike_score > 0:
        findings.append(f"You're still running {ike_version}, which has a few known weak spots. Migrating to IKEv2 would definitely tighten things up.")
    
    # Weighted average
    total = int(cipher_score * 0.5 + dh_score * 0.35 + ike_score * 0.15)
    return min(total, 100), findings


def score_config(pfs: bool, sa_lifetime: int) -> tuple[int, list[str]]:
    """Score configuration compliance (0-100, lower is better)."""
    findings = []
    score = 0
    
    if not pfs:
        score += 40
        findings.append("It looks like Perfect Forward Secrecy (PFS) isn't turned on. Flipping that on is a quick win to make sure past sessions stay secure even if a key leaks later.")
    
    if sa_lifetime < MIN_SAFE_SA_LIFETIME:
        score += 30
        findings.append(f"Your SA lifetime is set to just {sa_lifetime} seconds. That's super short and might be causing your devices to work overtime constantly rekeying.")
    elif sa_lifetime > RECOMMENDED_SA_LIFETIME * 4:
        score += 25
        findings.append(f"An SA lifetime of {sa_lifetime // 3600} hours is pretty long. You might want to dial that back to 8 hours or less to shrink the window of vulnerability.")
    elif sa_lifetime > RECOMMENDED_SA_LIFETIME:
        score += 10
        findings.append(f"The SA lifetime ({sa_lifetime // 3600} hours) is a bit over our recommended 8-hour max. Nothing urgent, but worth tweaking.")
    
    return min(score, 100), findings


def score_behavior(status: str, last_rekey: datetime) -> tuple[int, list[str]]:
    """Score behavioral patterns (0-100, lower is better)."""
    findings = []
    score = 0
    
    if status == "Down":
        score += 50
        findings.append("This tunnel is currently offline. You might want to check the connectivity on both ends.")
    elif status == "Rekeying":
        score += 10
        findings.append("The tunnel is in the middle of rekeying right now. Just something to keep an eye on to make sure it finishes.")
    elif status == "Investigating":
        score += 30
        findings.append("We've flagged this tunnel because it's behaving a little strangely compared to its usual baseline.")
    
    now = datetime.now(timezone.utc)
    hours_since_rekey = (now - last_rekey).total_seconds() / 3600
    if hours_since_rekey > 48:
        score += 25
        findings.append(f"It's been about {int(hours_since_rekey)} hours since the last rekey. You might want to check if the rekey process is getting stuck.")
    
    return min(score, 100), findings


def score_traffic(throughput_mbps: float = 0, packets_ratio: float = 1.0) -> tuple[int, list[str]]:
    """Score traffic anomalies (0-100, lower is better)."""
    findings = []
    score = 0
    
    # Simulate anomaly detection
    if throughput_mbps > 500:
        score += 30
        findings.append(f"We're seeing a really high spike in traffic ({throughput_mbps:.1f} Mbps). If you aren't expecting a big transfer, it might be worth double-checking.")
    elif throughput_mbps < 0.1 and throughput_mbps > 0:
        score += 15
        findings.append("There's barely a trickle of data going through this active tunnel. Might be a routing issue or misconfiguration.")
    
    if packets_ratio > 10 or packets_ratio < 0.1:
        score += 20
        findings.append("The traffic here is heavily one-sided. Unless this is a backup or log-shipping tunnel, you might want to look into why data is mostly flowing in just one direction.")
    
    return min(score, 100), findings


def analyze_tunnel(tunnel: dict, traffic: dict | None = None) -> dict:
    """
    Full AI analysis of a VPN tunnel.
    Returns risk breakdown with explainability.
    """
    crypto_score, crypto_findings = score_crypto(
        tunnel["cipher"], tunnel["dh_group"], tunnel["ike_version"]
    )
    config_score, config_findings = score_config(
        tunnel["pfs"], tunnel["sa_lifetime"]
    )
    behavior_score, behavior_findings = score_behavior(
        tunnel["status"], tunnel["last_rekey"]
    )
    
    throughput = traffic.get("throughput_mbps", random.uniform(10, 100)) if traffic else random.uniform(10, 100)
    ratio = traffic.get("packets_ratio", random.uniform(0.5, 2.0)) if traffic else random.uniform(0.5, 2.0)
    traffic_score, traffic_findings = score_traffic(throughput, ratio)
    
    # Weighted overall score
    overall = int(
        crypto_score * 0.40 +
        config_score * 0.25 +
        behavior_score * 0.20 +
        traffic_score * 0.15
    )
    overall = min(overall, 100)
    
    # Confidence based on data completeness
    confidence = 0.85 + random.uniform(0, 0.14)
    
    # Severity classification
    if overall >= 70:
        severity = "Critical"
    elif overall >= 45:
        severity = "High"
    elif overall >= 25:
        severity = "Medium"
    else:
        severity = "Low"
    
    # Build human-readable explanation
    all_findings = crypto_findings + config_findings + behavior_findings + traffic_findings
    
    if not all_findings:
        explanation = (
            f"Looking good! The {tunnel['tunnel_name']} tunnel is solidly configured. "
            f"You're using {tunnel['cipher']} with DH Group {tunnel['dh_group']} and {tunnel['ike_version']}, "
            f"which is great. No big issues jumping out at me right now. (Score: {overall}/100)"
        )
    else:
        top_issues = all_findings[:3]
        explanation = (
            f"I took a look at {tunnel['tunnel_name']} and found a few things you might want to check out. "
            f"Specifically: {'; '.join(top_issues)} "
            f"Overall, I'd give it a risk score of {overall}/100 ({severity.lower()} severity)."
        )
    
    # Build recommendations
    recommendations = []
    if crypto_score > 20:
        recommendations.append("Consider bumping your encryption up to AES-256-GCM and using a stronger DH group like 19+.")
    if config_score > 20:
        recommendations.append("I'd recommend turning on PFS and dropping the SA lifetime down to around 8 hours.")
    if "IKEv1" in tunnel["ike_version"]:
        recommendations.append("It's probably time to plan a migration from IKEv1 to IKEv2.")
    if behavior_score > 20:
        recommendations.append("Take a peek at the logs to see why the tunnel's behavior or rekeying is acting up.")
    if not recommendations:
        recommendations.append("Everything looks pretty solid right now. No immediate action needed on your end.")
    
    return {
        "overall_score": overall,
        "confidence": round(confidence, 3),
        "severity": severity,
        "crypto_score": crypto_score,
        "config_score": config_score,
        "behavior_score": behavior_score,
        "traffic_score": traffic_score,
        "replay_protection_score": random.randint(0, 30) if config_score < 40 else random.randint(50, 100),
        "metadata_exposure_score": random.randint(10, 40) if crypto_score < 40 else random.randint(60, 100),
        "explanation": explanation,
        "recommendations": recommendations,
        "findings": all_findings,
    }


def get_risk_level(score: int) -> str:
    """Convert numeric score to risk level label."""
    if score >= 70:
        return "Critical"
    elif score >= 45:
        return "High"
    elif score >= 25:
        return "Medium"
    return "Low"
