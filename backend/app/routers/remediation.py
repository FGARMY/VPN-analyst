from fastapi import APIRouter
from pydantic import BaseModel
import time

router = APIRouter(prefix="/api/remediation", tags=["remediation"])

# Mock state
state = {
    "quarantined_ips": [
        {"ip": "104.28.23.11", "reason": "DDoS Amplification Vector", "timestamp": time.time() - 3600},
        {"ip": "89.248.165.23", "reason": "Port Scan Signature", "timestamp": time.time() - 86400},
        {"ip": "185.220.101.4", "reason": "Anomalous Payload Entropy", "timestamp": time.time() - 7200},
    ],
    "pending_rules": [
        {"id": "rule-01", "action": "BLOCK", "target": "185.15.2.0/24", "confidence": 95, "status": "pending"},
        {"id": "rule-02", "action": "LIMIT", "target": "PROTOCOL:ICMP", "confidence": 88, "status": "pending"},
        {"id": "rule-03", "action": "FLAG", "target": "GEO:UNKNOWN", "confidence": 75, "status": "pending"},
    ],
    "strictness_level": 50, # 0 to 100
}

@router.get("/state")
async def get_state():
    return state

class RuleAction(BaseModel):
    id: str
    action: str # "approve" or "reject"

@router.post("/rules/action")
async def take_action(action: RuleAction):
    for r in state["pending_rules"]:
        if r["id"] == action.id:
            r["status"] = action.action
            return {"success": True, "rule": r}
    return {"success": False, "error": "Rule not found"}

class StrictnessUpdate(BaseModel):
    level: int

@router.post("/strictness")
async def update_strictness(update: StrictnessUpdate):
    state["strictness_level"] = max(0, min(100, update.level))
    return {"success": True, "strictness_level": state["strictness_level"]}
