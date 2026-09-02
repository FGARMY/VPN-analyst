from fastapi import APIRouter
from pydantic import BaseModel
import asyncio
import random

router = APIRouter(prefix="/api/cli", tags=["cli"])

class CLICommand(BaseModel):
    command: str

@router.post("/execute")
async def execute_cli_command(req: CLICommand):
    cmd = req.command.strip().lower()
    args = cmd.split()
    
    if not args:
        return {"output": ""}
        
    base_cmd = args[0]
    
    # Simulate network delay for realism
    await asyncio.sleep(0.5)
    
    if base_cmd == "help":
        output = (
            "AVAILABLE COMMANDS:\n"
            "  help          - Show this message\n"
            "  ping <ip>     - Send ICMP ECHO_REQUEST to network hosts\n"
            "  analyze <ip>  - Run deep AI threat analysis on a target IP\n"
            "  block <ip>    - Instantly add IP to SOC Remediation blocklist\n"
            "  clear         - Clear terminal output"
        )
        return {"output": output}
        
    elif base_cmd == "ping":
        if len(args) < 2:
            return {"output": "USAGE: ping <ip_address>"}
        target = args[1]
        
        # Simulate ping output
        output = f"PING {target} (56 data bytes)\n"
        for i in range(1, 5):
            ms = round(random.uniform(10.5, 45.2), 1)
            output += f"64 bytes from {target}: icmp_seq={i} ttl=64 time={ms} ms\n"
            # Optional: await asyncio.sleep(0.2) if we were streaming, but we return all at once
        
        output += f"\n--- {target} ping statistics ---\n"
        output += "4 packets transmitted, 4 received, 0% packet loss"
        return {"output": output}
        
    elif base_cmd == "analyze":
        if len(args) < 2:
            return {"output": "USAGE: analyze <ip_address>"}
        target = args[1]
        
        output = (
            f"[+] INITIATING DEEP SCAN ON {target}...\n"
            f"[+] QUERYING THREAT INTELLIGENCE DATABASES...\n"
            f"[-] RESULTS:\n"
            f"    - GEOLOCATION   : UNKNOWN (PROXY SUSPECTED)\n"
            f"    - REPUTATION    : {random.choice(['CLEAN', 'SUSPICIOUS', 'MALICIOUS'])}\n"
            f"    - ANOMALY SCORE : {random.randint(10, 99)}/100\n"
            f"    - OPEN PORTS    : 22(SSH), 80(HTTP), 443(HTTPS)\n"
            f"[!] SCAN COMPLETE."
        )
        return {"output": output}
        
    elif base_cmd == "block":
        if len(args) < 2:
            return {"output": "USAGE: block <ip_address>"}
        target = args[1]
        
        output = (
            f"-> INJECTING FIREWALL RULE: DROP src {target} dst ANY\n"
            f"-> PROPAGATING TO EDGE ROUTERS...\n"
            f"-> RULE ACKNOWLEDGED BY HQ_GATEWAY.\n"
            f"SUCCESS: {target} HAS BEEN BLOCKED."
        )
        return {"output": output}
        
    elif base_cmd == "clear":
        return {"output": "CLEAR"}
        
    else:
        return {"output": f"COMMAND NOT FOUND: {base_cmd}\nType 'help' for a list of commands."}
