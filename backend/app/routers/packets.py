from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
import random
import time
from typing import List
import uuid
import subprocess

router = APIRouter(prefix="/api/packets", tags=["packets"])

PROTOCOLS = ["TCP", "UDP", "IKEv2", "ESP", "AH", "ICMP", "HTTP"]
LOCATIONS = ["US-EAST-1", "EU-CENTRAL-1", "AP-SOUTH-1", "US-WEST-2", "SA-EAST-1", "UNKNOWN"]
THREAT_PATTERNS = [
    "None", "None", "None", "None", "None", 
    "Anomalous Payload Entropy", 
    "Port Scan Signature", 
    "DDoS Amplification Vector",
    "Known Malicious IP (Threat Intel)",
    "Brute Force Attempt"
]

def generate_packet(src_ip: str, dst_ip: str):
    # Reduced threat probability to 2% to prevent UI spam
    is_threat = random.random() > 0.98
    risk_score = random.randint(70, 100) if is_threat else random.randint(0, 30)
    
    return {
        "id": str(uuid.uuid4())[:8],
        "timestamp": time.time(),
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "src_loc": random.choice(LOCATIONS),
        "dst_loc": "LOCAL_MACHINE", 
        "protocol": random.choice(PROTOCOLS),
        "size": random.randint(64, 1500),
        "entropy": round(random.uniform(0.1, 0.99), 2),
        "inferred_payload": random.choice(["VoIP", "WhatsApp", "E-mail", "Web-browsing", "Video Streaming", "ICMP", "Unknown"]),
        "ai_risk_score": risk_score,
        "ai_confidence": random.randint(60, 99) if is_threat else random.randint(80, 100),
        "threat_pattern": random.choice(THREAT_PATTERNS[5:]) if is_threat else "None",
        "action_taken": "ALLOW" if not is_threat else random.choice(["ALLOW", "FLAGGED", "DROPPED"])
    }

def get_real_connections():
    try:
        output = subprocess.check_output("netstat -n | findstr ESTABLISHED", shell=True, text=True)
        conns = []
        for line in output.strip().split("\n"):
            parts = line.split()
            if len(parts) >= 4:
                local_ip = parts[1].rsplit(':', 1)[0].strip('[]')
                remote_ip = parts[2].rsplit(':', 1)[0].strip('[]')
                # Optional: exclude loopback if we only want external traffic, 
                # but including it ensures we see traffic even without active external conns.
                conns.append((remote_ip, local_ip)) # (src, dst)
        return list(set(conns))
    except Exception as e:
        print(f"Error reading netstat: {e}")
        return []

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
                
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

# Background task to generate packets and broadcast them to all connected clients
async def packet_generator():
    live_connections = []
    last_poll = 0
    
    while True:
        if manager.active_connections:
            # Poll netstat every 2 seconds to not freeze the thread
            now = time.time()
            if now - last_poll > 2:
                # Use to_thread to avoid blocking async event loop
                live_connections = await asyncio.to_thread(get_real_connections)
                last_poll = now
                
            if not live_connections:
                # Fallback if netstat fails or returns nothing
                live_connections = [("192.168.1.100", "127.0.0.1")]

            # Sample some active connections randomly to stream (e.g. 1-5 packets per tick)
            num_packets = random.randint(1, min(5, len(live_connections) or 1))
            sampled_conns = random.choices(live_connections, k=num_packets)
            
            packets = [generate_packet(src, dst) for src, dst in sampled_conns]
            await manager.broadcast(json.dumps(packets))
            
        await asyncio.sleep(0.5)  # Tick every 500ms

# Removed module-level task creation; handled in main.py lifespan

@router.websocket("/ws")
async def packet_stream(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, wait for client disconnect
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
