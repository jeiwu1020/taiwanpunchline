# 「有夢最美」前端小幅修剪 v201

## 交付結果

- 新檔：`chen-dream-user-candidate-v201.mp3`。
- 來源範圍由 **7.020–9.620 秒**改為 **7.048–9.620 秒**。
- 只移除開頭 **28 毫秒 / 1,344 samples**。有效長度 **2.572 秒**，原本為 2.600 秒。
- **直接證據：新版 WAV 與舊版 WAV 去掉前 1,344 個 samples 後，123,456 個 samples 全部逐樣本完全一致，差異 0。被移除的 1,344 個 samples 全部是數位 0。** 原始來源相同區間也全為 0。
- 主體、結尾與原音量設定均未更改。沒有新增降噪、高通濾波、剪接、變速或合成。
- 未改 repository、預覽頁或部署，未使用付費服務。

## 為何只剪 28 毫秒

舊版距離第一個超過 −38 dBFS 的來源樣本只有約 39.4 毫秒，不能將這整段全部當作空白：

| 來源時間 | 觀察 |
| --- | --- |
| 7.020–7.048 | 完整數位靜音，無低頻或其他聲音成分。 |
| 7.049333 | 最早非零來源樣本，極低振幅。 |
| 7.050271 | 第一個超過 −120 dBFS 的來源樣本。 |
| 7.053188 | 第一個超過 −100 dBFS 的來源樣本。 |
| 7.056063 | 第一個超過 −60 dBFS 的來源樣本。 |
| 7.059396 | 第一個超過 −38 dBFS 的來源樣本，隨後迅速進入明顯首音。 |

新裁點 7.048 秒在全部非零訊號之前，保留約 11.4 毫秒到 −38 dBFS 指標。這約 11.4 毫秒內包含起音，不是全部都還能再剪的靜音。原本的 5 毫秒 fade-in 現在結束於 7.053 秒；該 fade-in 區間來源峰值仍只有 −105.49 dBFS，經過 16-bit PCM 量化後不改變任何保留樣本。

若追求明顯大幅提早，超過目前可刪的數十毫秒就會開始切進首音，不宜在無聽驗的情況下自行加深裁切。

## 低頻與波形檢查

- `lead-trim-comparison.png` 含來源波形、1 毫秒峰值/RMS、短窗頻譜，以及新舊對齊後的全段波形。
- 本次刪掉區間是全零，因此不存在可另外去除的低頻噪音；不把首音的低頻能量誤當噪音。
- 7.059396–7.100 秒的起音，150 Hz 以下約 −18.45 dBFS RMS，150–3,500 Hz 約 −12.05 dBFS RMS。低頻與中頻同時屬於已開始的錄音，不據此移除。
- 不使用零相位濾波產生的前向振鈴推定音訊起點。硬裁點依未濾波的來源樣本確認。
- 極短區間的頻帶估計有頻率解析度限制，僅供輔助。−38 dBFS 是可重現的聲學指標，不是已核實的語言學詞界。

## 保留的處理設定

- Mono，48 kHz，128 kbps MP3。
- Constant gain −5.4 dB。
- Fade-in 5 ms，fade-out 15 ms。來源尾端仍為 9.620 秒；新版 fade-out 起點是 clip 內 2.557 秒。
- 無錄影標題、作者、日期或 ID3 標籤。ffprobe format/stream tags 都是空集合。

## 驗證數字

- WAV：123,456 samples，2.572 秒，峰值 −5.571 dBFS，0 clipping samples。
- MP3 解碼：123,456 samples，2.572 秒，峰值 −5.999 dBFS，0 clipping samples。
- MP3 容器時間 2.616 秒含 frame padding，不代表額外可聞空白。
- 新舊 MP3 解碼後、對齊 28 ms 的相關係數為 0.999603。MP3 是有損格式，改變檔案起點會移動編碼 frame，不能期待 MP3 解碼樣本完全相同；無損 PCM 版已驗證全段完全相同。
- 新 MP3：42,240 bytes，SHA-256 `fef9b40261b220e8066693292cd83089b9db885102b11c741cbb5369a4ccbc7a`。

完整量測與 hash：`manifest.json`。可重跑的比對程式：`analyze_and_verify.py`。

## 限制

沒有直接聽驗，沒有聲紋或說話者身分核實，也沒有以 ASR 聲稱首字精確界線。本結果依來源樣本、波形、頻譜與逐樣本比對，確認只去掉數位靜音並完整保留舊版已有的聲音。

## 重現

```sh
ffmpeg -i ../chen-dream-voice-v20/source.mp4 -vn -map_metadata -1 -map_chapters -1 \
  -af 'atrim=start=7.048:end=9.62,asetpts=PTS-STARTPTS,volume=-5.4dB,afade=t=in:st=0:d=0.005,afade=t=out:st=2.557:d=0.015' \
  -ac 1 -ar 48000 -c:a pcm_s16le chen-dream-user-candidate-v201.wav
ffmpeg -i chen-dream-user-candidate-v201.wav -map_metadata -1 -map_chapters -1 \
  -c:a libmp3lame -b:a 128k -id3v2_version 0 -write_id3v1 0 chen-dream-user-candidate-v201.mp3
```
