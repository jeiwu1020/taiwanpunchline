import {drawFighterArt} from './art-render.mjs?v=campaign-visuals-20261112-r2';
import {presentationFighter} from './move-readability.mjs?v=campaign-visuals-20261112-r2';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function assistView(episode,{hidden=false,reducedMotion=false}={}){
 if(hidden||!episode?.actor)return null;
 const {actor,phase}=episode;
 if(!['warning','attack','exit'].includes(phase))return null;
 const entry=clamp(episode.age/(episode.warning||.9));
 const exit=phase==='exit'?clamp((episode.exitAge??episode.phaseAge??0)/(episode.exitDuration||.28)):0;
 if(exit>=1)return null;
 return {actor,x:actor.x-(phase==='warning'&&!reducedMotion?(1-entry)*36*actor.face:0),y:actor.y,face:actor.face,alpha:phase==='exit'?.94*(1-exit):phase==='warning'?.55+.4*entry:.94,caption:phase==='warning'?'借過！援護到場':phase==='exit'?'收工！':'助拳，不加班！',color:episode.owner?.id==='enemy'?'#a7f5ff':'#ffe49a'};
}
export function createAssistRenderer(scene,images){
 const slots=[0,1].map(i=>{const key='assist-art-'+i,texture=scene.textures.createCanvas(key,512,384),image=scene.add.image(0,0,key).setOrigin(.5,350/384).setDepth(-.12).setVisible(false);const label=scene.add.text(0,0,'',{fontFamily:'system-ui',fontSize:'15px',fontStyle:'bold',color:'#ffe49a',stroke:'#142b32',strokeThickness:4}).setOrigin(.5).setDepth(3).setVisible(false);return {texture,image,label};});
 const puff=scene.add.graphics().setDepth(-.15);
 const hide=()=>{puff.clear();for(const s of slots){s.image.setVisible(false);s.label.setVisible(false);}};
 return {hide,draw(duel,time,options={}){hide();if(options.hidden)return;let n=0;for(const episode of duel.assists||[]){const view=assistView(episode,options);if(!view||n>=2)continue;const s=slots[n++],ctx=s.texture.getContext();ctx.clearRect(0,0,512,384);ctx.save();ctx.translate(256,350);drawFighterArt(ctx,images,presentationFighter(view.actor),time,{shadow:false});ctx.restore();s.texture.refresh();s.image.setPosition(view.x,view.y).setScale(view.face,1).setAlpha(view.alpha).setVisible(true);s.label.setPosition(view.x,view.y+14).setText(view.caption).setColor(view.color).setAlpha(view.alpha).setVisible(true);puff.fillStyle(episode.owner?.id==='enemy'?0x8adbe6:0xf2ce83,.18*view.alpha);puff.fillEllipse(view.x,view.y,108,19);if(!options.reducedMotion){puff.lineStyle(2,0xfff3d2,.6*view.alpha);for(let j=0;j<3;j++)puff.lineBetween(view.x-view.face*(44+j*9),view.y-35-j*12,view.x-view.face*(64+j*9),view.y-35-j*12);}}}};
}
