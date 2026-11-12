export function rangeFrames(start,end,rate,length){
 if(![start,end,rate,length].every(Number.isFinite)||rate<=0||length<1)throw Error('無效的時間或音訊');
 const a=Math.max(0,Math.min(length,Math.round(start*rate))),b=Math.max(0,Math.min(length,Math.round(end*rate)));
 if(b<=a)throw Error('結束必須晚於開始');return {start:a,end:b};
}
export function measure(channels,rate){
 const n=channels[0].length,block=Math.max(1,Math.round(rate*.05));let peak=0,sum=0;const blocks=[];
 for(let p=0;p<n;p+=block){let energy=0,count=0;for(let i=p;i<Math.min(n,p+block);i++)for(const ch of channels){const x=Number.isFinite(ch[i])?ch[i]:0;peak=Math.max(peak,Math.abs(x));energy+=x*x;count++;}blocks.push({energy,count});sum+=energy;}
 const mean=sum/Math.max(1,n*channels.length),gate=Math.max(10**(-45/10),mean*.01);let es=0,ns=0;
 for(const b of blocks)if(b.energy/Math.max(1,b.count)>=gate){es+=b.energy;ns+=b.count;}
 const activeRms=Math.sqrt(es/Math.max(1,ns));return {peak,peakDb:peak?20*Math.log10(peak):-Infinity,rms:Math.sqrt(mean),activeRms,activeDb:activeRms?20*Math.log10(activeRms):-Infinity};
}
export function renderClip(input,rate,start,end,{normalize=true,targetDb=-20,fadeMs=5}={}){
 const r=rangeFrames(start,end,rate,input[0].length);const channels=input.map(c=>c.slice(r.start,r.end));const before=measure(channels,rate);
 const gainDb=normalize&&before.activeRms?Math.max(-30,Math.min(24,targetDb-before.activeDb)):0,gain=10**(gainDb/20),n=channels[0].length;
 for(const ch of channels)for(let i=0;i<n;i++)ch[i]*=gain;
 let limiterReduction=0;
 if(normalize){
  const ceiling=10**(-1/20),ahead=Math.max(1,Math.round(rate*.005)),release=Math.exp(-1/(rate*.08));
  const peaks=new Float32Array(n);for(let i=0;i<n;i++)for(const ch of channels)peaks[i]=Math.max(peaks[i],Math.abs(ch[i]));
  const deque=new Int32Array(n);let head=0,tail=0,added=0,envelope=1;
  for(let i=0;i<n;i++){
   while(added<Math.min(n,i+ahead+1)){while(tail>head&&peaks[deque[tail-1]]<=peaks[added])tail--;deque[tail++]=added++;}
   while(tail>head&&deque[head]<i)head++;
   const wanted=Math.min(1,ceiling/Math.max(ceiling,peaks[deque[head]]||0));envelope=wanted<envelope?wanted:Math.min(wanted,1-(1-envelope)*release);
   limiterReduction=Math.max(limiterReduction,-20*Math.log10(envelope));for(const ch of channels)ch[i]*=envelope;
  }
 }
 const fade=Math.min(Math.round(Math.max(0,fadeMs)*rate/1000),Math.floor(n/2));
 for(const ch of channels)for(let i=0;i<fade;i++){const g=i/Math.max(1,fade-1);ch[i]*=g;ch[n-1-i]*=g;}
 return {channels,rate,frames:r,before,after:measure(channels,rate),gainDb,limiterReduction};
}
export function wavBytes(channels,rate,{float32=false}={}){
 const sampleBytes=float32?4:2;
 const size=channels[0].length*channels.length*sampleBytes,bytes=new Uint8Array(44+size),v=new DataView(bytes.buffer);const str=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
 str(0,'RIFF');v.setUint32(4,36+size,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,float32?3:1,true);v.setUint16(22,channels.length,true);v.setUint32(24,rate,true);v.setUint32(28,rate*channels.length*sampleBytes,true);v.setUint16(32,channels.length*sampleBytes,true);v.setUint16(34,sampleBytes*8,true);str(36,'data');v.setUint32(40,size,true);
 let offset=44;for(let i=0;i<channels[0].length;i++)for(const ch of channels){const x=Math.max(-1,Math.min(1,ch[i]));if(float32)v.setFloat32(offset,ch[i],true);else v.setInt16(offset,Math.round(x<0?x*32768:x*32767),true);offset+=sampleBytes;}return bytes;
}
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(data){let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
export function zipBytes(files){
 const parts=[],central=[];let offset=0;const enc=new TextEncoder();
 for(const file of files){const name=enc.encode(file.name),data=typeof file.data==='string'?enc.encode(file.data):file.data,crc=crc32(data);const local=new Uint8Array(30+name.length),l=new DataView(local.buffer);l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint32(14,crc,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,name.length,true);local.set(name,30);parts.push(local,data);
 const record=new Uint8Array(46+name.length),v=new DataView(record.buffer);v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x800,true);v.setUint32(16,crc,true);v.setUint32(20,data.length,true);v.setUint32(24,data.length,true);v.setUint16(28,name.length,true);v.setUint32(42,offset,true);record.set(name,46);central.push(record);offset+=local.length+data.length;
 }
 const cdSize=central.reduce((s,b)=>s+b.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cdSize,true);e.setUint32(16,offset,true);const all=[...parts,...central,end],result=new Uint8Array(offset+cdSize+22);let p=0;for(const b of all){result.set(b,p);p+=b.length;}return result;
}
export function validateSelection(s,duration){
 if(!s||![s.start,s.end,duration].every(Number.isFinite)||s.start<0||s.end>duration+.001||s.end<=s.start)throw Error('區間資料無效或超出音檔');
 return {start:s.start,end:Math.min(duration,s.end),reviewed:s.reviewed===true,normalize:s.normalize!==false,targetDb:[-24,-22,-20,-18,-16].includes(s.targetDb)?s.targetDb:-20,fadeMs:[0,2,5,10].includes(s.fadeMs)?s.fadeMs:5};
}
