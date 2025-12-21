from __future__ import annotations

import asyncio
from typing import Callable, TypeVar

T = TypeVar("T")


async def run_blocking(fn: Callable[[], T]) -> T:
    """
    procyclingstats is primarily synchronous (scrapes HTML).
    Wrap calls with asyncio.to_thread so we can orchestrate concurrency safely.
    """
    return await asyncio.to_thread(fn)


async def gather_limited(coros, limit: int = 8):
    sem = asyncio.Semaphore(limit)

    async def run_one(c):
        async with sem:
            return await c

    return await asyncio.gather(*(run_one(c) for c in coros))


async def to_thread(fn: Callable[[], T]) -> T:
    # Small alias used throughout ingestion for clarity.
    return await asyncio.to_thread(fn)


