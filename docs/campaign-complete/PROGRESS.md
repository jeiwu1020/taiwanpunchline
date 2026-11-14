# 實作記錄 — 2026-11-12 complete-campaign

- 基底 main 488e317；私人 clone 與外部 worktree 已建立。線上首頁版本 workers-background-only-20261113-r1；challenge-backdrop-cache.mjs 線上/本地 SHA-256 f26f769e279b7d7f0ba99cd80d384c33accbedfe511e5d995e12045065ddd91b 完全一致。
- 基線 npm ci 原本因 npm cache 在唯讀 HOME 失敗，改用 /workspace/.npm-cache 後成功。原 package 漏列 @napi-rs/canvas；補上 executor 既有 0.1.100 版本與 Playwright。完整原版基線4438項中3項環境失敗：兩個寫入 ../evidence 未建目錄、一項1.1.1版Canvas取樣差；建立目錄、釘選0.1.100後這13項相關回歸全通過。未更改背景或桌面人物繪製密度。
- Task 2：第5章共用 controller、三路段、兩虛構小頭目、阿扁仔 BO3 與解鎖測試 RED→GREEN。故事3/4章從再次搬錯改為查單/護送，章1補戰後音浪因果；保留既有開場/美術。調整第二章動線後相機測試指出 route-b 第一個敵種過早改為近戰使縮放不連續，恢復該路原有前段出怪，32項相機回歸通過。
- Task 3：v4同鍵擴充finale步驟與可選隊伍，舊ready/not-ready+null資料仍接受。七人門檻、唯一三人、首通冪等、敗北重試、quota重試、其他槽不變、精準handoff測試 RED→GREEN。第五章/最終戰首頁與跨頁接續已開放，舊locked期望改為新內容實際路由測試。
- Task 4：FinaleArena 重用 Duel 的21招、傷害、防禦、助拳/揪團；新增團隊/深度/AI/全隊勝負迴圈。finale-session分開保存battle/ending/complete，失敗不前進；preview純記憶體且不宣稱已保存。新增四向正規化、敵我/不同lane、AI互打、玩家倒下仍勝、21招、定點箭矢depth、純preview測試 RED→GREEN。
- Task 5 驗證記錄：完整候選首輪4455項，4443通過/12失敗；包含9個既有第五章鎖定期望、1個測試mkdir匯入、2個相機節奏回歸，已逐項修正且針對性重測。瀏覽器首輪發現第五章本地資產相對路徑，已改從第四章擁有者路徑解析並加release資產檢查。最終戰改用共用相機安全solver，全七人避HUD/控制區測試通過。獨立reviewer已完成檢查。

Correction: 父線程後續更正並提供 11 月 10 日使用者原文，已明確同意三打四及自由換角。本次維持這個既定方向，只有限時比較、碰撞與保存細節自行決定；先前交接的「未定案」已更正。
Ruling: 本輪交付隔離分支與PR，不直接合併main或發正式站；使用者可先驗收，現行線上接縫版保留。
Ruling: 無限城只作結局伏筆，尚未提供無限關卡/線上排行榜/Google登入；這些不在本輪完整主線範圍。

- 舊候選查核：GitHub 三個既有 heads 只有 main/兩個背景候選；main 無第五章或可玩三打四。Library 已找到 chapter5-temple-queue-candidate-20261110.zip（libfile_bedc7d1959bc819189ba51dd353d0b3e）及五章資料備份；依官方下載 helper 取回時 hosted apps tools/list HTTP 401，無法取得 bytes，未宣稱已比對或可安全沿用。沒有修改 GPT Site。
- 獨立 review 完成，發現兩項 Important：延遲 queue depth、跨 lane/友軍 queue 與 projectile erase；已補測試 RED→GREEN，未改既有 Duel。

- 最終驗證：4,464項完整回歸通過；第五章/最終戰的Workers建置輸出可直接載入遊玩，無HTTP/頁面錯誤。完整新存檔瀏覽器流程、quota救援、結尾刷新/重看、直向/橫向/側轉實際觸控均通過。直向七人血條受共享objective高度限制，已改最終戰專用排列並測父元素不裁切。21場seeded AI全場模擬皆結算，未冒充真人平衡。
- Library另外定位三打四原型 fighter-3v4-isolated-rule-spike-20261110.zip（libfile_bd9d3253fe508191815ea6136fde9a8e）；官方helper同樣HTTP401，未取回、未聲稱安全沿用。

## R2 街道視覺補強

- 父線程指出原第五章重用第四章畫面，未滿足從街道呈現Boss特色；已核對11月10日原要求。新增章5獨立三全景、透明道具與兩staff；章2–4補匿名擴音／核對站／補水站，345個既有媒體檔未改。
- 實際看圖修正手持清單擋臉與領口間隙，新增回歸RED→GREEN。新透明場務圖第一版有殘底，經ImageGen去背後才使用。
- 預載絕對URL導致7個既有測試失敗，改回共用相對URL路由與assets宣告，針對項目重測通過。最終4471項全通過；全主線16項及視覺6項/27張實拍皆成功。桌面/手機直橫/側轉/實際觸控，含第五章三路段/兩小頭目戰鬥/阿扁仔戰鬥。
- 最新版本campaign-visuals-20261112-r2，build525檔259584792bytes。R2明確不開PR、不部署，同分支交付。詳VISUAL-VERIFICATION.md。
- R2獨立review完成，逐張查看27張、重跑15項、逐位元確認345原媒體及525輸出檔；無Critical/Important，未驗實機。建置版第2–5章street smoke皆通過。
