// 不缓存原图、题目请求、身份信息或 AI 响应。此版不宣称支持离线 AI。
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
