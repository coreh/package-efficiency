import asyncio
from typing import Any


async def operation(value: Any) -> Any:
    process = await asyncio.create_subprocess_exec(value["command"], *value["args"], stdout=asyncio.subprocess.PIPE)
    stdout, _ = await process.communicate()
    return {"stdout": stdout.decode("utf-8"), "status": process.returncode}
