"""
Fire-and-forget task tracking.

asyncio.get_event_loop keeps only a weak reference to tasks created with
asyncio.create_task(); without a strong reference a background task (CV
parsing, summary regeneration, notification emails) can be garbage-collected
mid-flight and silently dropped. Keep a strong reference until completion.
"""

import asyncio
import logging
from typing import Coroutine

logger = logging.getLogger(__name__)

_background_tasks: set[asyncio.Task] = set()


def fire_and_forget(coro: Coroutine) -> asyncio.Task:
    """Run a coroutine in the background, holding a strong reference until done."""
    task = asyncio.create_task(coro)
    _background_tasks.add(task)

    def _done(t: asyncio.Task) -> None:
        _background_tasks.discard(t)
        if not t.cancelled() and t.exception() is not None:
            logger.warning("Background task failed", exc_info=t.exception())

    task.add_done_callback(_done)
    return task
