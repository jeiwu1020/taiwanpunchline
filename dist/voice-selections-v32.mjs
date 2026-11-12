// User-reviewed ranges, relative to the exact voice-studio source ID. V32 adds the replacement ko_name recording only.
export const V32_VOICE_SELECTIONS={
  "ko_name": {
    "source": null,
    "requestedTime": null,
    "referenceNote": "使用者後補新錄影「賴祥德v2.mp4」；先前影片僅作參考，未核實與本次音檔關係。",
    "src": "assets/voice/ko-name-user-selected-v32.wav",
    "sha256": "bfbd2b9b8159501a340b7af27244fc00b332a646ddf9912d64ef77bb68b11865",
    "sourceFile": "賴祥德v2.mp4",
    "cue": 0,
    "decoded": true,
    "reviewNeeded": false,
    "selection": {
      "sourceId": "ko-name-user-v2-original",
      "sourceFile": "賴祥德v2.mp4",
      "sourceSha256": "acb162f0ecc3899e0bab75a940244d67290414c1a1135e903d2738e9fabb4cb3",
      "range": {
        "start": 5.177,
        "end": 6.219
      },
      "frames": {
        "start": 248496,
        "end": 298512
      },
      "sampleRate": 48000,
      "channels": 2,
      "duration": 1.042,
      "targetDb": -20,
      "fadeMs": 5,
      "actualDb": -20.000561777513823,
      "peakDb": -6.665272364403462,
      "upstreamRange": null,
      "endClampedSeconds": 0
    },
    "sourceRange": {
      "start": 5.177,
      "end": 6.219
    },
    "status": "依使用者指定切點，從語音工作室 ko-name-user-v2-original（賴祥德v2.mp4）取 5.177–6.219 秒，長約 1.042 秒。統一以有效段 RMS −20 dBFS 為目標，加入 5 毫秒淡入淡出與防爆音限制；使用者確認區間，未獨立聽驗、認證發言者或再利用權。原檔及前版保留可回復。"
  }
};
