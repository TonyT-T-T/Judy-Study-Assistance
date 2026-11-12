# 独立家庭密码登录版：交付与部署

状态：代码与部署包已准备并测试，尚未部署到新的外部托管。
现有 Sites 私人地址及其 ChatGPT 登录入口不变。本文件不是“原网址已经免登录”的完成声明。

## 家长使用体验

- 独立网址打开后显示家庭登录页，不需要 ChatGPT 账号。
- Judy 使用学习密码；家长使用另一组管理密码。
- 勾选“记住我”后保持30天；不勾选时使用会话Cookie，服务器最长12小时。
- 退出、会话到期、密码变更或家长撤销设备后需重新登录。
- 家长管理操作需要最近5分钟内的密码验证；超过后在网页再次输入家长密码。
- 修改某个身份的密码会让该身份在全部设备上的旧登录失效。
- 原有照片不自动上传或保存；模型默认仍关闭，不能把登录完成等同于AI功能完成。

## 当前缺少什么

家长确认尚无服务器或云平台账号；当前执行环境也没有可用的独立托管凭据。
需要一个支持Docker/Node24、持久磁盘和HTTPS的托管位置，以及可配置到该服务器的域名。
现有chatgpt.site域名由Sites管理，不能由本代码接管为独立密码站点。
建议选一个家庭能长期管理的轻量服务器，完成账号开通、地区和费用确认后再部署。
本轮没有购买服务器、开通付费服务、注册域名或产生模型调用费用。

## 推荐部署形态

单台轻量服务器，建议至少512MB可用内存（较宽裕配置更适合密码哈希与后续AI代理），
Docker Compose运行Node应用和Caddy。只有Caddy开放80/443，应用3000端口仅在容器内部可见。
使用持久卷保存家庭账号哈希和登录会话。AI继续使用家长确认的服务端API。

源代码已备份到GitHub的codex/judy-math-ai分支。
构建入口：standalone/Dockerfile；部署文件：standalone/deploy/compose.yaml。

### 在自己服务器上的首次操作

1. 获取该分支代码；配置域名DNS与服务器防火墙80/443。
2. 在standalone/deploy目录，将.env.example复制为.env并填写JUDY_DOMAIN。
3. 在该服务器的私人终端生成首次设置码：

   `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`

   将结果仅填入.env的FAMILY_SETUP_TOKEN，不要发到聊天、写进Git或放进URL。
4. 在该目录执行：`docker compose up -d --build`。
5. 打开自己的HTTPS域名。首次进入需要设置码，在页面设置家长密码与Judy学习密码。
   两组密码不同，长度12至128字符；支持密码管理器与长口令。
6. 设置完成后可将.env中的设置码改为新的随机值并重启应用。
   Compose要求变量非空；账号已建立后设置接口关闭，新值不会改变密码。
   非Compose部署可移除设置码，已有账号和会话仍由持久数据库保存。
7. 验证两种身份、退出、记住设备、改密及导出后，才考虑启用真实学习数据。

不要把示例域名或测试密码用于生产。上线需要实际域名证书和家庭账号验收。

### 不使用Docker

安装Node24，执行`npm ci`和`npm run build`。在未提交的.env中配置：
PUBLIC_ORIGIN（最终HTTPS域名）、FAMILY_SETUP_TOKEN、JUDY_DATA_DIR（持久目录）、
HOST=127.0.0.1和PORT=3000。运行`npm run start:family`。
使用自己的HTTPS反向代理。应用不根据外部转发头推断身份或可信Origin。

仅本机开发时可以显式设置PUBLIC_ORIGIN=http://localhost:3000和ALLOW_INSECURE_LOCALHOST=1。
该例外不接受公网HTTP地址，不能用于上线。

## 密码、会话与保护

- Node自带scrypt，N=131072、r=8、p=1，随机盐。没有密码明文或可逆加密密码。
- 服务端SQLite只保存账号哈希、会话令牌哈希与限速计数；会话原始令牌仅发给浏览器Cookie。
- 生产Cookie为__Host-judy_session，Secure、HttpOnly、SameSite=Lax、Path=/。
  Lax允许从聊天链接等外站顶层进入时携带已有登录，所有变更请求另做完整Origin校验。
- 记住设备不使用localStorage保存密码或登录令牌。
- 首次设置需服务端设置码，数据库事务防止重复创建；没有公开注册入口。
- 登录与管理请求校验完整Origin，并有限速；并行密码哈希受限制。
- 用户传来的Sites身份头会被移除，服务端根据已验证家庭会话注入内部身份。
- 学生不能调用家长配置、改密、设备管理和家长重验证接口。
- SQLite文件仅服务账号可读写；部署为非root用户，应用容器可用只读文件系统。
- 学习记录当前仍在浏览器中，只供合成试用；客户端界面限制不能等同于服务器学习数据库的权限隔离。
  真实学生数据、多设备学习同步与服务端记录授权需要后续单独验证和实现。

设计参考：
[OWASP密码存储](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)、
[OWASP会话管理](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)。
本次测试不是第三方安全审计。

## 找回密码

由拥有服务器管理权限的家长，在私人终端运行：

`node standalone/reset-password.mjs parent` 或 `node standalone/reset-password.mjs student`。

部署在容器时，可进入应用容器的交互终端运行该命令。输入不回显、不放在命令参数中；
重设会撤销该身份的所有旧会话。不要通过聊天发送密码。

## 旧网址的数据迁移

旧网址和新域名的浏览器存储彼此独立，修改域名不能自动带走旧错题。
原网站先导出合成记录JSON；在新站以家长身份登录、验证后导入。
本轮不会自动上传旧数据，也没有删除原网址或原记录。
家庭登录数据库与学习JSON是两类备份：前者涉及认证，请保存在私有备份位置；
后者目前不包含照片或登录密码。不要上传认证数据库到GitHub。

## 实际验证

- 全部56项测试通过：原40项、13项家庭认证、3项独立界面权限测试。
- 验证设置码、不可重复初始化、密码策略、两个身份、Cookie标志、Origin、限速、
  重启保留登录、五分钟家长复验、改密撤销、设备撤销、退出和30天过期。
- Docker镜像实际构建成功；非root、只读容器实际启动。
- 容器HTTP实际验证health、登录拦截、首次设置、密码登录、私有首页和学生会话。
- 容器重启后家庭账号设置仍存在；合成测试容器和测试数据已清理。
- Compose配置检查通过。
- 未完成：真实域名HTTPS、手机真机/浏览器页面验收、外部托管、真实家庭账号、付费模型调用。
