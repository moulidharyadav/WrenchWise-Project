import asyncio
import uuid
from typing import Dict, Any, Callable, List, Optional
from datetime import datetime

class EventBus:
    """
    Event-driven background event processing engine.
    Supports in-memory streaming fallback, subscriber dispatch, retries, dead-letter queue (DLQ),
    and WebSocket broadcasting.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EventBus, cls).__new__(cls)
            cls._instance.subscribers: Dict[str, List[Callable]] = {}
            cls._instance.event_log: List[Dict[str, Any]] = []
            cls._instance.dead_letter_queue: List[Dict[str, Any]] = []
            cls._instance.ws_broadcast_callback: Optional[Callable] = None
        return cls._instance

    def set_websocket_broadcaster(self, broadcaster: Callable):
        self.ws_broadcast_callback = broadcaster

    def subscribe(self, event_type: str, handler: Callable):
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(handler)

    async def publish(
        self,
        event_type: str,
        payload: Dict[str, Any],
        correlation_id: Optional[str] = None,
        max_retries: int = 3
    ):
        event_id = f"evt-{uuid.uuid4().hex[:10]}"
        corr_id = correlation_id or f"corr-{uuid.uuid4().hex[:10]}"

        event = {
            "event_id": event_id,
            "event_type": event_type,
            "correlation_id": corr_id,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat(),
            "retry_count": 0,
            "status": "PUBLISHED"
        }

        self.event_log.append(event)
        if len(self.event_log) > 500:
            self.event_log.pop(0)

        # 1. Live WebSocket Dashboard Broadcast
        if self.ws_broadcast_callback:
            try:
                await self.ws_broadcast_callback({
                    "type": "BANKING_EVENT",
                    "event": event
                })
            except Exception as e:
                print(f"[EventBus WS Broadcast Warning]: {e}")

        # 2. Dispatch to Background Subscribers with Retry & DLQ
        handlers = self.subscribers.get(event_type, [])
        for handler in handlers:
            asyncio.create_task(self._execute_with_retry(handler, event, max_retries))

    async def _execute_with_retry(self, handler: Callable, event: Dict[str, Any], max_retries: int):
        retries = 0
        while retries <= max_retries:
            try:
                # Timeout of 5 seconds per consumer
                if asyncio.iscoroutinefunction(handler):
                    await asyncio.wait_for(handler(event), timeout=5.0)
                else:
                    handler(event)
                event["status"] = "PROCESSED"
                return
            except Exception as e:
                retries += 1
                event["retry_count"] = retries
                print(f"[EventBus Retry {retries}/{max_retries}] Handler failed for '{event['event_type']}': {e}")
                if retries > max_retries:
                    # Move to Dead-Letter Queue (DLQ)
                    event["status"] = "DEAD_LETTER"
                    event["dlq_reason"] = str(e)
                    event["dlq_timestamp"] = datetime.utcnow().isoformat()
                    self.dead_letter_queue.append(event)
                    print(f"[EventBus DLQ] Event '{event['event_id']}' moved to Dead-Letter Queue.")
                    return
                await asyncio.sleep(0.5 * retries)

    def get_event_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        return list(reversed(self.event_log[-limit:]))

    def get_dlq_events(self) -> List[Dict[str, Any]]:
        return list(reversed(self.dead_letter_queue[-50:]))

event_bus = EventBus()
