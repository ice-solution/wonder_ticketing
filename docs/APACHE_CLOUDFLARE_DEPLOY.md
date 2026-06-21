# Apache + Cloudflare Flexible 部署設定

Domain：`wonder.brandactivation.hk`  
模式：Cloudflare **Flexible SSL**  
Origin：Apache `:80` reverse proxy 到 Wonder Ticketing Node app `127.0.0.1:3777`

## 1. Wonder Ticketing `.env`

Production 建議：

```bash
NODE_ENV=production
PORT=3777
CLIENT_URL=https://wonder.brandactivation.hk
WEBHOOK_BASE_URL=https://wonder.brandactivation.hk
COOKIE_NAME=wonder_session
JWT_SECRET=<strong-production-secret>
```

如有 OAuth / SSO / WhatsApp / Wonder Payment webhook，也要把 callback URL 設成：

```text
https://wonder.brandactivation.hk/...
```

## 2. Build + Start App

```bash
npm install
npm run build
NODE_ENV=production PORT=3777 npm start
```

正式機建議用 `pm2` 或 `systemd` 管理 Node process。

### 弱機器部署：本機 build 後 SCP

如果 production server 無法執行 build，可以在本機 build 後上傳以下內容：

```text
dist/             # tsc 編譯後的 server/shared JS
client/dist/      # Vite 編譯後的 frontend assets
package.json
package-lock.json
node_modules/     # 或在 production server 跑 npm ci --omit=dev
.env
.secrets/         # 如使用 WONDER_PRIVATE_KEY_PATH，注意不要提交 git
uploads/          # 如已有上傳檔案
```

目錄結構應是：

```text
/var/www/wonder_ticketing/
  dist/server/_core/index.js
  client/dist/index.html
  package.json
  .env
```

不要只上傳 `dist/`，因為 frontend Vite output 預設在 `client/dist/`。

## 3. Apache Modules

Ubuntu / Debian：

```bash
sudo a2enmod proxy proxy_http headers rewrite
sudo systemctl reload apache2
```

## 4. VirtualHost

Repo 內已提供：

```text
deploy/apache/wonder.brandactivation.hk.conf
```

安裝到 Apache：

```bash
sudo cp deploy/apache/wonder.brandactivation.hk.conf /etc/apache2/sites-available/wonder.brandactivation.hk.conf
sudo a2ensite wonder.brandactivation.hk.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

## 5. Cloudflare DNS / SSL

Cloudflare 設定：

```text
DNS: wonder.brandactivation.hk -> Origin server IP
Proxy status: Proxied
SSL/TLS mode: Flexible
```

Flexible SSL 代表：

```text
Visitor --HTTPS--> Cloudflare --HTTP--> Apache origin
```

所以 Apache vhost 只需要聽 `:80`，不用在 origin 設 SSL cert。

## 6. 驗證

```bash
curl -I http://127.0.0.1:3777/api/health
curl -I http://wonder.brandactivation.hk/api/health
curl -I https://wonder.brandactivation.hk/api/health
```

預期 `/api/health` 回應 `200`。

## 7. 注意事項

- `server/_core/auth.ts` 在 `NODE_ENV=production` 會設定 secure cookie；Cloudflare 對使用者是 HTTPS，所以瀏覽器可正常保存 cookie。
- 如果之後改成 Cloudflare **Full / Full (strict)**，需要在 origin Apache 加 `:443` SSL vhost。
- 若要取得真實 client IP，可再設定 Apache `mod_remoteip` 並加入 Cloudflare IP ranges。
