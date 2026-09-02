"""
Live Logs API — WebSocket endpoint for streaming local network tool logs.

On Windows, `ping` buffers stdout when piped to an asyncio subprocess,
so we run it in a thread using subprocess.Popen which handles line-buffered
output correctly through the C runtime.
"""
import asyncio
import subprocess
import sys
import threading
from collections import deque

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/api", tags=["live-logs"])


def _run_ping(output_queue: deque, stop_event: threading.Event):
    """Run ping in a background thread and push lines to a deque."""
    is_windows = sys.platform.startswith("win")
    cmd = ["ping", "-t", "8.8.8.8"] if is_windows else ["ping", "8.8.8.8"]

    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,  # line-buffered
        )

        for line in iter(process.stdout.readline, ""):
            if stop_event.is_set():
                break
            stripped = line.strip()
            if stripped:
                output_queue.append(stripped)

        process.stdout.close()
        process.terminate()
        process.wait()
    except Exception as e:
        output_queue.append(f"Error: {e}")
    finally:
        stop_event.set()


@router.websocket("/live-logs/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    output_queue: deque = deque()
    stop_event = threading.Event()

    # Start the ping process in a background thread
    thread = threading.Thread(
        target=_run_ping, args=(output_queue, stop_event), daemon=True
    )
    thread.start()

    try:
        while not stop_event.is_set() or len(output_queue) > 0:
            # Drain all available lines from the queue
            while len(output_queue) > 0:
                line = output_queue.popleft()
                await websocket.send_text(line)

            # Small sleep to avoid busy-waiting
            await asyncio.sleep(0.15)

    except WebSocketDisconnect:
        print("[Live Logs] Client disconnected.")
    except Exception as e:
        print(f"[Live Logs] Error: {e}")
    finally:
        stop_event.set()
        thread.join(timeout=3)
