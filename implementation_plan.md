# Implementation Plan: Live Network Logs

This plan details adding a new "Live Logs" feature that connects to a local network tool (like `ping 8.8.8.8 -t`) and streams the output live to the web UI using WebSockets.

## User Review Required
> [!NOTE]
> Since this is for a presentation, we will use `ping 8.8.8.8 -t` as the underlying local network tool. This runs indefinitely and creates a steady stream of network latency logs, which looks great for demonstrations. If you prefer a different tool like `netstat` or `tracert`, please let me know.

## Proposed Changes

### Backend Changes

#### [NEW] `backend/app/routers/live_logs.py`
- Create a new FastAPI router with a WebSocket endpoint `/api/live-logs/stream`.
- Use `asyncio.create_subprocess_exec` to spawn the `ping` command.
- Read `stdout` asynchronously line-by-line and send it directly over the WebSocket to connected clients.
- Ensure the subprocess is correctly terminated when the WebSocket disconnects to avoid orphaned processes.

#### [MODIFY] `backend/app/main.py`
- Import and register the new `live_logs` router.

---

### Frontend Changes

#### [NEW] `frontend/app/live-logs/page.tsx`
- Create a new "Live Logs" page.
- Implement a terminal-like UI with a black background, monospace font, and a glowing green/cyan text style to look like a hacker/SOC dashboard.
- Use `useEffect` and the native `WebSocket` API to connect to the backend WebSocket stream.
- Manage log state, keeping a rolling buffer of logs.
- Add an auto-scroll feature so the newest logs are always visible.

#### [MODIFY] `frontend/components/sidebar.tsx`
- Add a new navigation item for "Live Logs" using the `Activity` icon from `lucide-react`.
- Ensure it perfectly matches the existing sidebar layout and hover effects.

## Verification Plan

### Manual Verification
1. I will navigate to the newly created `/live-logs` page.
2. I will verify that the terminal UI successfully connects to the backend and starts displaying live `ping` logs.
3. I will test navigating away to ensure the WebSocket closes and the backend process is cleaned up.
