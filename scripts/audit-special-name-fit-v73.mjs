// Optional native Canvas audit, not a production dependency.
// CANVAS_MODULE=/path/to/@napi-rs/canvas/index.js node scripts/audit-special-name-fit-v73.mjs
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {CAST} from '../dist/roster.mjs';
import {fitSpecialNameSize} from '../dist/special-name-fit.mjs';
if(!process.env.CANVAS_MODULE)throw new Error('Set CANVAS_MODULE to an installed native Canvas implementation.');
const {createCanvas,GlobalFonts}=await import(pathToFileURL(process.env.CANVAS_MODULE));
const fontPath=process.env.AUDIT_CJK_FONT||'/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc';
assert.ok(GlobalFonts.registerFromPath(fontPath,'NameAuditCJK'),'a real CJK font is required; tofu fallback is not a measurement');
const ctx=createCanvas(256,64).getContext('2d');
const scenarios=[
 {mode:'portrait D',viewports:['320x568','360x640','375x667','390x844','430x932'],cardWidth:110,availableWidth:102,maxSize:18},
 {mode:'native landscape / CSS-sideways',viewports:['568x320','650x320','844x390','320x568 rotated','390x844 rotated'],cardWidth:94,availableWidth:86,maxSize:18},
 {mode:'compact desktop minimum special column',viewports:['container near 736px breakpoint'],cardWidth:96,availableWidth:88,maxSize:18},
 {mode:'1200px desktop',viewports:['1200x750'],cardWidth:163.33,availableWidth:155,maxSize:20}
];
const results=scenarios.map(scenario=>({...scenario,names:Object.entries(CAST).flatMap(([character,entry])=>entry.moves.map(move=>{
 ctx.font=`900 ${scenario.maxSize}px NameAuditCJK`;const measuredWidth=ctx.measureText(move.name).width;
 const fit=fitSpecialNameSize({...scenario,measuredWidth});ctx.font=`900 ${fit.size}px NameAuditCJK`;const nativeWidth=ctx.measureText(move.name).width;
 assert.ok(fit.size>=12&&nativeWidth<=scenario.availableWidth-1+.05,`${scenario.mode}: ${move.name} cannot fit at the minimum readable size`);
 return{character,name:move.name,fontSize:fit.size,nativeWidth:Number(nativeWidth.toFixed(3)),overflow:false};
}))}));
const report={measurement:'Native Skia Canvas with registered Noto Sans CJK Bold. Browser font fallback may differ; browser QA remains required.',fontPath,minimumSize:12,horizontalPadding:1,safetyWidth:1,results};
const output=new URL('../docs/v73/special-name-canvas-audit.json',import.meta.url);writeFileSync(output,JSON.stringify(report,null,2)+'\n');
for(const scenario of results){const longest=scenario.names.find(n=>n.name==='可以這樣插隊喔');console.log(`${scenario.mode}: ${longest.fontSize}px, native width ${longest.nativeWidth}px / ${scenario.availableWidth}px, all ${scenario.names.length} names fit`);}
