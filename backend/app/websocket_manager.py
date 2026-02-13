"""
websocket_manager.py — Manages WebSocket connections and broadcasts
price/stock updates to all connected clients in real time.
"""

import json
import asyncio
from fastapi import WebSocket


class ConnectionManager:
    """Handles WebSocket lifecycle and fan-out broadcasting."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Send a JSON payload to every connected client.
        Silently removes dead connections."""
        payload = json.dumps(message)
        async with self._lock:
            stale = []
            for ws in self.active_connections:
                try:
                    await ws.send_text(payload)
                except Exception:
                    stale.append(ws)
            for ws in stale:
                self.active_connections.remove(ws)

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send a JSON payload to a single client."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception:
            await self.disconnect(websocket)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


# Singleton instance used across the app
manager = ConnectionManager()
