from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import io
import random
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/api/dataset", tags=["dataset"])

@router.get("/download")
async def download_dataset():
    """Generates a mock CSV dataset for the SIH submission."""
    
    # Generate 500 rows of mock training data
    output = io.StringIO()
    # CSV Header
    output.write("timestamp,src_ip,dst_ip,protocol,tunnel_mode,cipher,dh_group,pfs_enabled,sa_lifetime,packet_size,entropy,inferred_payload,ai_risk_score,replay_protection_score,metadata_exposure_score\n")
    
    protocols = ["ESP", "AH", "IKEv2", "IKEv1", "TCP", "UDP"]
    modes = ["Tunnel", "Transport"]
    ciphers = ["AES-256-GCM", "AES-128-CBC", "3DES-CBC", "DES-CBC", "NULL"]
    payloads = ["VoIP", "WhatsApp", "E-mail", "Web-browsing", "Video Streaming", "ICMP", "Unknown"]
    
    now = datetime.now(timezone.utc)
    
    for i in range(500):
        ts = (now - timedelta(minutes=i*5)).isoformat()
        src = f"10.0.{random.randint(1, 255)}.{random.randint(1, 255)}"
        dst = f"172.16.{random.randint(1, 255)}.{random.randint(1, 255)}"
        proto = random.choice(protocols)
        mode = random.choice(modes) if proto in ["ESP", "AH"] else "N/A"
        cipher = random.choice(ciphers)
        dh = random.choice([2, 5, 14, 19, 21])
        pfs = random.choice(["True", "False"])
        sa = random.choice([3600, 14400, 28800, 86400])
        size = random.randint(64, 1500)
        entropy = round(random.uniform(0.1, 0.99), 2)
        payload = random.choice(payloads)
        
        # Correlate weak crypto with higher risk scores
        risk = random.randint(10, 40)
        if cipher in ["3DES-CBC", "DES-CBC", "NULL"]:
            risk += 50
        if pfs == "False":
            risk += 20
        risk = min(risk, 100)
        
        replay = random.randint(10, 40) if risk < 50 else random.randint(60, 100)
        metadata = random.randint(10, 40) if risk < 50 else random.randint(60, 100)
        
        output.write(f"{ts},{src},{dst},{proto},{mode},{cipher},{dh},{pfs},{sa},{size},{entropy},{payload},{risk},{replay},{metadata}\n")
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vpn_analysis_dataset.csv"}
    )
