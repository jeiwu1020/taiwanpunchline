// Street depth replaces vertical directional intent, never the explicit jump.
// Duel key bindings remain the source of truth outside a depth route.
export function challengeKeyAction(code,duelKeys,depthMode=false){
 if(depthMode){if(code==='ArrowUp'||code==='KeyW')return 'up';if(code==='ArrowDown'||code==='KeyS')return 'down';}
 return duelKeys[code];
}
