# PR預覽設定修正

使用者提供的 ec962e3 Cloudflare build 日誌顯示：525檔建置成功，但 `npx wrangler preview`（4.161.0）因缺少 `previews` 區塊退出。

依 [Cloudflare Previews configuration](https://developers.cloudflare.com/workers/previews/configuration/#what-goes-in-the-previews-block)，資產與compatibility設定留在頂層；只有頂層設定的專案可使用空 `previews: {}`。本次僅新增這個區塊，保留name、compatibility_date與assets.directory。

安全核對：專案是assets-only，沒有Worker自訂入口、路由、排程、KV／D1／R2／DO／Queue／Service／Workflow綁定或secrets設定。Wrangler 4.161.0的Preview路徑在本地已明定previews時直接採用該設定；沒有複製正式資源或建立資料綁定。遊戲進度仍由各網域的瀏覽器localStorage持有。

驗證：

- JSON解析及差異斷言：與原設定相比僅多出空previews；頂層其他欄位完全一致。
- `node build-release-output.mjs` 成功，525檔／259584792 bytes，與既有輸出相同。
- 與Cloudflare日誌同版本 `wrangler@4.161.0 deploy --dry-run` 成功，輸出 `No bindings found.`、`--dry-run: exiting now.`；沒有執行實際正式部署。雲端HOME唯讀，驗證使用工作目錄內隔離的XDG設定資料夾與/tmp日誌，未變更帳號登入。
- `git diff --check`通過。僅設定與本記錄修改，未改遊戲碼或媒體；沿用R2已通過的4471項回歸。

本修正只推候選分支以觸發既有Cloudflare Preview工作；不合併main，不執行正式 `wrangler deploy`。實際預覽網址與建置結果由後續Cloudflare bot／HTTP／瀏覽器驗證確認。
