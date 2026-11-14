// Finale-only copy. Other modes retain the shared settings and helper rules.
export function applyFinaleAssistCopy(document){
 for(const p of document.querySelectorAll('#settings-pane-controls p')){
  if(p.textContent.startsWith('章節頭目採'))p.textContent='本場三人對四人，一場定勝負。七名角色均已上場，雙方停用助拳；L 揪團仍可集滿 100% 後發動。';
  else if(p.textContent.startsWith('暫停後可更換主角'))p.textContent='暫停可查看能力。「重新開吵」會以相同三人隊伍從本場起點開始，章節與經驗保留。助拳配置與配點保留供其他章節使用。';
  else if(p.textContent.startsWith('A／D 或'))p.textContent='WASD／方向鍵四向走位；空白鍵跳；J 攻擊；K／左 Shift 防守；U／I／O 三招；L 揪團；Esc 暫停。H 助拳於終戰停用。';
 }
}
