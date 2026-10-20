import json
import queue
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

class AlertManager:
    """
    In-memory Server-Sent Events (SSE) dispatcher for live streaming overlays.
    Routes events to specific browser source connections using overlay_token.
    """
    # Map of overlay_token -> List of Queue objects for active SSE listeners
    _subscribers: Dict[str, List[queue.Queue]] = {}

    @classmethod
    def subscribe(cls, overlay_token: str) -> queue.Queue:
        q = queue.Queue(maxsize=50)
        token_str = str(overlay_token)
        if token_str not in cls._subscribers:
            cls._subscribers[token_str] = []
        cls._subscribers[token_str].append(q)
        logger.info(f"Subscribed new listener for overlay {token_str[:8]}... (total: {len(cls._subscribers[token_str])})")
        return q

    @classmethod
    def unsubscribe(cls, overlay_token: str, q: queue.Queue):
        token_str = str(overlay_token)
        if token_str in cls._subscribers and q in cls._subscribers[token_str]:
            cls._subscribers[token_str].remove(q)
            if not cls._subscribers[token_str]:
                del cls._subscribers[token_str]
        logger.info(f"Unsubscribed listener for overlay {token_str[:8]}...")

    @classmethod
    def publish_tip(cls, tip):
        """
        Publishes confirmed on-chain tip event to overlay subscribers.
        """
        if not hasattr(tip.creator, 'widget_config'):
            return

        token_str = str(tip.creator.widget_config.overlay_token)
        payload = {
            'event': 'tip',
            'is_test': False,
            'reference_id': tip.reference_id,
            'supporter_name': tip.supporter_name or 'Anonymous',
            'amount': str(tip.amount),
            'asset_code': tip.asset_code,
            'message': tip.message,
            'stellar_tx_hash': tip.stellar_tx_hash,
            'duration_seconds': tip.creator.widget_config.alert_duration_seconds,
            'sound_enabled': tip.creator.widget_config.alert_sound_enabled,
        }
        cls._broadcast(token_str, payload)

    @classmethod
    def publish_test(cls, overlay_token: str, amount: str = '5', asset_code: str = 'USDC', supporter_name: str = 'Stellar Supporter', message: str = 'Keep building amazing things on Stellar!'):
        """
        Publishes simulated test alert to verify OBS/Streamlabs overlay.
        """
        token_str = str(overlay_token)
        payload = {
            'event': 'tip',
            'is_test': True,
            'reference_id': 'TEST-ALERT',
            'supporter_name': supporter_name,
            'amount': amount,
            'asset_code': asset_code,
            'message': message,
            'stellar_tx_hash': '0000000000000000000000000000000000000000000000000000000000000000',
            'duration_seconds': 6,
            'sound_enabled': True,
        }
        cls._broadcast(token_str, payload)

    @classmethod
    def _broadcast(cls, token_str: str, payload: dict):
        listeners = cls._subscribers.get(token_str, [])
        logger.info(f"Broadcasting live alert to {len(listeners)} listeners for overlay {token_str[:8]}...")
        dead_queues = []
        for q in listeners:
            try:
                q.put_nowait(payload)
            except queue.Full:
                dead_queues.append(q)

        for q in dead_queues:
            cls.unsubscribe(token_str, q)
