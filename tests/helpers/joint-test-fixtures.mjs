import {createRequire} from 'node:module';
export const {createCanvas,loadImage}=createRequire(import.meta.url)('@napi-rs/canvas');
export const anchors={placard:[.13,.88,-.65],leaflet:[.12,.89,-.7],barricade:[.12,.90,-.35],'c1-mic':[.05,.86,-.5],'c1-guard':[.05,.88,-.25],'c2-mic':[.045,.87,-.5],'c2-guard':[.04,.88,-.2],'c3-mic':[.10,.87,-1.0],'c3-guard':[.91,.86,-2.0],'c4-mic':[.15,.90,-.35],'c4-guard':[.06,.86,-.25]};
