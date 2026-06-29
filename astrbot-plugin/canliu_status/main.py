import httpx
from astrbot.api.event import filter, AstrMessageEvent
from astrbot.api.star import Context, Star
from astrbot.api import logger

class CanliuStatusPlugin(Star):
    def __init__(self, context: Context, config: dict):
        super().__init__(context)
        self.api_url = config.get("api_url", "")
        self.api_key = config.get("api_key", "")

    @filter.command("webstatus")
    async def cmd_status(self, event: AstrMessageEvent):
        """查询网站状态"""
        text = await self._fetch_status()
        yield event.plain_result(text)

    @filter.command("webcheck")
    async def cmd_site_status(self, event: AstrMessageEvent):
        """查询网站状态（别名）"""
        text = await self._fetch_status()
        yield event.plain_result(text)

    async def _fetch_status(self):
        if not self.api_url or not self.api_key:
            return "[错误] 插件未配置 API 地址或密钥"

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    self.api_url,
                    params={"key": self.api_key, "format": "text"}
                )
                if resp.status_code == 401:
                    return "[错误] API Key 验证失败"
                resp.raise_for_status()
                return resp.text
        except httpx.TimeoutException:
            return "[错误] 查询超时"
        except Exception as e:
            return f"[错误] 查询失败: {str(e)}"
