/* PROMPTBOOM — evolved from Platano audaz (jtvaldivia, 2025).
   Procedural art, original synthesized soundtrack, no downloaded game assets. */
(() => {
'use strict';
const W=800,H=600,COLS=15,ROWS=11,T=42,OX=85,OY=88;
const C={bg:0x080f1c,panel:0x111f30,line:0x274353,ink:0xeaf6ee,muted:0x91abae,lime:0xd9ff68,teal:0x54e4cc,coral:0xff777d,gold:0xffce68,blue:0x6f9fff};
const CABINET_KEYS={
 P1_U:['w'],P1_D:['s'],P1_L:['a'],P1_R:['d'],
 P1_1:['u'],P1_2:['i'],P1_3:['o'],P1_4:['j'],P1_5:['k'],P1_6:['l'],
 P2_U:['ArrowUp'],P2_D:['ArrowDown'],P2_L:['ArrowLeft'],P2_R:['ArrowRight'],
 P2_1:['r'],P2_2:['t'],P2_3:['y'],P2_4:['f'],P2_5:['g'],P2_6:['h'],START1:['Enter'],START2:['2']
};
const lookup={},held={},pressed={};
for(const [code,keys] of Object.entries(CABINET_KEYS)) for(const k of keys) lookup[k]=code;
function releaseKeys(){for(const k in held) delete held[k];for(const k in pressed) delete pressed[k];}
window.addEventListener('keydown',e=>{const k=lookup[e.key.length===1?e.key.toLowerCase():e.key];if(k){e.preventDefault();if(!held[k])pressed[k]=true;held[k]=true;}});
window.addEventListener('keyup',e=>{const k=lookup[e.key.length===1?e.key.toLowerCase():e.key];if(k){e.preventDefault();held[k]=false;}});
window.addEventListener('blur',releaseKeys);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseKeys();});
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
const FIRMS=[['PLATANUS',C.lime,'IDEAS QUE EXPLOTAN'],['OPENAI',C.teal,'UN PROMPT. MIL POSIBILIDADES.'],['ANTHROPIC',C.coral,'CONTEXTO BAJO CONTROL'],['FINTUAL',C.blue,'INVIERTE EN TU PRÓXIMO MOVIMIENTO'],['NOTCO',C.gold,'NOT A NORMAL BANANA'],['BUK',0xc7a0ff,'EL MEJOR EQUIPO GANA']];
const ZONES=['PLATANUS / BATCH CERO','FINTUAL / CAPITAL SEMILLA','NOTCO / LABORATORIO','ANTHROPIC / CONTEXTO INFINITO','OPENAI / ÚLTIMA INFERENCIA'];
const STORE='promptboom-26-cl-v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), key=(x,y)=>y*COLS+x;
let records=[],soundOn=true;
async function readRecords(){try{const b=window.platanusArcadeStorage;if(!b)return;const r=await b.get(STORE);if(r.found&&Array.isArray(r.value))records=r.value.filter(v=>v&&/^[A-Z]{3}$/.test(v.name)&&Number.isFinite(v.score)&&v.score>=0&&v.score<1e8).sort((a,b)=>b.score-a.score).slice(0,5);}catch{}}
function saveRecord(name,score){records=[...records,{name,score}].sort((a,b)=>b.score-a.score).slice(0,5);try{const b=window.platanusArcadeStorage;if(b)Promise.resolve(b.set(STORE,records)).catch(()=>{});}catch{}}
class Arena extends Phaser.Scene{
 constructor(){super('Arena');}
 create(){
  this.g=this.add.graphics();this.ui=this.add.container(0,0);this.fx=[];this.texts={};this.clock=0;this.noteAt=0;this.beat=0;this.selection=0;this.firm=0;this.firm2=2;this.touch=false;this.lastInput=0;this.best=0;
  this.input.on('pointerdown',p=>this.pointer(p));this.input.on('pointerup',()=>{for(const k of Object.keys(held))if(k.startsWith('P1_'))held[k]=false;});this.input.on('pointerupoutside',releaseKeys);
  this.scale.on('leave',releaseKeys);readRecords();this.menu();
 }
 text(id,x,y,str,size=16,col=C.ink,align='center'){
  let o=this.texts[id];if(!o){o=this.add.text(x,y,'',{fontFamily:'Arial, sans-serif',fontSize:size+'px',fontStyle:'bold',color:'#fff',align,lineSpacing:5}).setOrigin(align==='left'?0:align==='right'?1:.5,.5);this.ui.add(o);this.texts[id]=o;}
  o.setPosition(x,y).setText(str).setFontSize(size).setColor('#'+col.toString(16).padStart(6,'0')).setVisible(true);return o;
 }
 hideUI(){for(const t of Object.values(this.texts))t.setVisible(false);}
 beep(freq=440,dur=.1,type='triangle',vol=.035){
  const ctx=this.sound.context;if(!soundOn||!ctx||ctx.state!=='running')return;
  try{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.65),ctx.currentTime+dur);g.gain.setValueAtTime(vol,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur);o.connect(g);g.connect(ctx.destination);o.onended=()=>{o.disconnect();g.disconnect();};o.start();o.stop(ctx.currentTime+dur);}catch{}
 }
 unlock(){const ctx=this.sound.context;if(ctx&&ctx.state==='suspended')ctx.resume().catch(()=>{});}
 menu(){this.state='menu';this.paused=false;this.lastInput=this.clock;this.idle=0;this.demo=false;this.fx=[];this.hideUI();releaseKeys();}
 begin(mode,demo=false){
  this.mode=mode;this.demo=demo;this.level=1;this.score=0;this.combo=0;this.comboUntil=0;this.charge=0;this.overclock=0;this.wins=[0,0];this.round=1;this.stats={blocks:0,chains:0,bots:0};this.build={hp:3,range:2,capacity:2,cooldown:3};this.startRound();
 }
 makePlayer(x,y,id){return {x,y,px:x,py:y,id,hp:this.mode===2?3:this.build.hp,alive:true,move:0,step:.125,dir:1,inv:1.8,dash:0,range:this.build.range,capacity:this.build.capacity,moveT:0};}
 startRound(){
  this.hideUI();releaseKeys();this.paused=false;this.state='play';this.elapsed=0;this.ready=2.6;this.grid=[];this.bombs=[];this.flames=[];this.drops=[];this.enemies=[];this.fx=[];this.tide=0;this.nextTide=this.mode===2?30:48;this.portal=false;this.clearTimer=0;this.bossTimer=0;this.warning=null;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
   const edge=x===0||y===0||x===COLS-1||y===ROWS-1,stone=x%2===0&&y%2===0;
   this.grid[key(x,y)]=edge||stone?1:Math.random()<.48?2:0;
  }
  if(this.mode===2)for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)this.grid[key(COLS-1-x,ROWS-1-y)]=this.grid[key(x,y)];
  const safe=[[1,1],[2,1],[3,1],[1,2],[1,3],[3,2],[3,3],[2,3],[13,9],[12,9],[11,9],[13,8],[13,7],[11,8],[11,7],[12,7]];
  for(const [x,y]of safe)this.grid[key(x,y)]=0;
  this.relays=[[7,3],[3,5],[11,5],[7,7]];for(const[x,y]of this.relays)this.grid[key(x,y)]=0;
  this.players=[this.makePlayer(1,1,0)];if(this.mode===2)this.players.push(this.makePlayer(13,9,1));
  if(this.mode===1){
   const spots=[[13,9],[13,1],[1,9],[9,5],[7,9],[11,3],[5,7]];
   const count=Math.min(6,2+this.level);
   for(let i=0;i<count;i++){const [x,y]=spots[i];this.grid[key(x,y)]=0;for(const[dX,dY]of DIRS)if(this.inside(x+dX,y+dY)&&this.tile(x+dX,y+dY)!==1)this.grid[key(x+dX,y+dY)]=0;
    this.enemies.push({x,y,px:x,py:y,id:2+i,hp:1,alive:true,move:.5+i*.11,step:Math.max(.22,.48-this.level*.035),dir:0,inv:0,dash:0,range:2,capacity:1,think:3+i*.4,type:i%2?'bot':'crawler',moveT:0});
   }
   if(this.level===3||this.level===5){const b=this.enemies[this.enemies.length-1];b.type='boss';b.hp=this.level===5?5:3;b.step=.52;b.range=3;b.capacity=2;}
  }
 }
 tile(x,y){return this.grid[key(x,y)];}
 inside(x,y){return x>0&&y>0&&x<COLS-1&&y<ROWS-1;}
 wet(x,y){return x<=this.tide||y<=this.tide||x>=COLS-1-this.tide||y>=ROWS-1-this.tide;}
 bombAt(x,y){return this.bombs.find(b=>b.x===x&&b.y===y);}
 walk(x,y){return this.inside(x,y)&&this.tile(x,y)===0&&!this.bombAt(x,y);}
 rays(x,y,range){
  const cells=[],seen=new Set(),relayed=new Set(),queue=[[x,y,range]];
  const add=(cx,cy)=>{const k=key(cx,cy);if(!seen.has(k)){seen.add(k);cells.push([cx,cy]);}if(this.relays?.some(([rx,ry])=>rx===cx&&ry===cy)&&!relayed.has(k)){relayed.add(k);queue.push([cx,cy,2]);}};
  while(queue.length){const[cx,cy,r]=queue.shift();add(cx,cy);for(const[dx,dy]of DIRS)for(let n=1;n<=r;n++){const nx=cx+dx*n,ny=cy+dy*n;if(!this.inside(nx,ny)||this.tile(nx,ny)===1)break;add(nx,ny);if(this.tile(nx,ny)===2)break;}}
  return cells;
 }
 danger(){
  const map=new Map();for(const f of this.flames)map.set(key(f.x,f.y),0);
  const due=new Map(this.bombs.map(b=>[b,b.fuse]));
  for(let pass=0;pass<this.bombs.length;pass++)for(const b of this.bombs)for(const[x,y]of this.rays(b.x,b.y,b.range)){const other=this.bombAt(x,y);if(other&&due.get(other)>due.get(b))due.set(other,due.get(b));}
  for(const b of this.bombs)for(const[x,y]of this.rays(b.x,b.y,b.range)){const k=key(x,y);map.set(k,Math.min(map.get(k)??99,due.get(b)));}
  return map;
 }
 escape(e,haz,extra){
  const q=[{x:e.x,y:e.y,first:null,d:0}],seen=new Set([key(e.x,e.y)]);
  for(let i=0;i<q.length;i++){
   const n=q[i],k=key(n.x,n.y),arrival=n.d*e.step;
   if(n.d>0&&!this.wet(n.x,n.y)&&!extra?.has(k)&&!haz.has(k)&&(!extra||arrival<1.8))return n.first;
   if(n.d>=9||(extra&&arrival+e.step>=1.8))continue;
   for(const [dx,dy]of DIRS){const x=n.x+dx,y=n.y+dy,k2=key(x,y);if(!this.walk(x,y)||seen.has(k2)||this.wet(x,y))continue;if(haz.has(k2)&&haz.get(k2)<arrival+e.step+.16)continue;seen.add(k2);q.push({x,y,first:n.first||[dx,dy],d:n.d+1});}
  }
  return null;
 }
 place(e){
  if(!e.alive||this.bombAt(e.x,e.y)||this.bombs.filter(b=>b.owner===e).length>=e.capacity)return false;
  this.bombs.push({x:e.x,y:e.y,owner:e,range:e.range+(e.id===0&&this.overclock>0?1:0),fuse:e.id===0&&this.overclock>0?1.45:2.05,total:e.id===0&&this.overclock>0?1.45:2.05,chain:1});this.beep(280,.07,'square',.025);return true;
 }
 moveEntity(e,dx,dy){
  const x=e.x+dx,y=e.y+dy;if(!this.walk(x,y))return false;
  if(this.players.some(p=>p!==e&&p.alive&&p.x===x&&p.y===y))return false;
  e.px=e.x;e.py=e.y;e.x=x;e.y=y;e.moveT=e.step;e.dir=DIRS.findIndex(d=>d[0]===dx&&d[1]===dy);return true;
 }
 dash(e){
  if(e.dash>0||!e.alive)return;let moved=false;const[dx,dy]=DIRS[e.dir];
  const sx=e.x,sy=e.y;for(let i=0;i<2;i++)if(this.moveEntity(e,dx,dy))moved=true;else break;
  if(moved){this.burst(OX+sx*T+T/2,OY+sy*T+T/2,this.playerColor(e),12);e.inv=Math.max(e.inv,.3);e.dash=this.build.cooldown;e.move=.16;this.beep(760,.13,'sine');}
 }
 addScore(n,x,y){
  if(this.mode!==1)return;
  if(this.clock>this.comboUntil)this.combo=0;this.combo++;this.comboUntil=this.clock+3;const mult=Math.min(5,1+Math.floor(this.combo/3));this.score+=n*mult;
  if(x!==undefined)this.float('+'+n*mult+(mult>1?' ×'+mult:''),OX+x*T+T/2,OY+y*T,C.lime);
 }
 explode(start){
  const queue=[start],seen=new Set();while(queue.length){const b=queue.shift();if(seen.has(b)||!this.bombs.includes(b))continue;seen.add(b);const cells=this.rays(b.x,b.y,b.range);this.bombs.splice(this.bombs.indexOf(b),1);
   this.beep(90+b.chain*20,.22,'sawtooth',.045);this.cameras.main.shake(80,.002);
   if(b.chain>1){this.stats.chains++;if(b.owner.id===0){this.charge=clamp(this.charge+22,0,100);this.addScore(80*b.chain,b.x,b.y);}this.float('CHAIN '+b.chain,OX+b.x*T+T/2,OY+b.y*T,C.gold);}
   for(const [x,y]of cells){
    this.flames.push({x,y,life:.43,owner:b.owner});this.burst(OX+x*T+T/2,OY+y*T+T/2,C.gold,4);
    if(this.tile(x,y)===2){this.grid[key(x,y)]=0;this.stats.blocks++;if(b.owner.id===0)this.addScore(25);if(Math.random()<.34)this.drops.push({x,y,type:Math.random()<.7?'token':'range',safe:.55});}
    const next=this.bombAt(x,y);if(next){next.chain=Math.max(next.chain,b.chain+1);queue.push(next);}
   }
  }
 }
 hurt(e,owner){
  if(!e.alive||e.inv>0)return;e.hp--;e.inv=e.type==='boss'?.65:1.65;this.burst(OX+e.x*T+T/2,OY+e.y*T+T/2,C.coral,18);this.beep(140,.18,'square');
  if(e.hp<=0){e.alive=false;if(e.id>=2){this.stats.bots++;if(owner?.id===0)this.addScore(e.type==='boss'?1200:250,e.x,e.y);}else this.float('OFFLINE',OX+e.x*T+T/2,OY+e.y*T,C.coral);}
 }
 ai(e,dt,haz){
  e.move-=dt;e.think-=dt;if(e.move>0||!e.alive)return;e.move=e.step;
  const danger=haz.has(key(e.x,e.y))||this.wet(e.x,e.y);
  let step=null;if(danger)step=this.escape(e,haz);
  else{
   const target=this.players.find(p=>p.alive);let best=Infinity;
   for(const[dx,dy]of Phaser.Utils.Array.Shuffle(DIRS.slice())){const x=e.x+dx,y=e.y+dy,k=key(x,y);if(!this.walk(x,y)||this.wet(x,y)||haz.has(k))continue;
    const d=target?Math.abs(target.x-x)+Math.abs(target.y-y):0;const score=d+Math.random()*2;if(score<best){best=score;step=[dx,dy];}}
   if(e.type!=='crawler'&&e.think<=0&&this.elapsed>4){
    const targetNear=target&&Math.abs(target.x-e.x)+Math.abs(target.y-e.y)<5;
    const crate=DIRS.some(([dx,dy])=>this.tile(e.x+dx,e.y+dy)===2);
    const blast=new Set(this.rays(e.x,e.y,e.range).map(([x,y])=>key(x,y)));
    const exit=this.escape(e,haz,blast);
    if(exit&&(targetNear||crate)){this.place(e);step=exit;}e.think=2+Math.random()*2;
   }
  }
  if(step)this.moveEntity(e,...step);
 }
 tick(dt){
  if(this.ready>0){this.ready-=dt;releaseKeys();return;}
  this.elapsed+=dt;this.overclock=Math.max(0,this.overclock-dt);
  if(this.charge>=100){this.charge=0;this.overclock=8;this.float('OVERCLOCK · 8s',400,260,C.teal);this.beep(1100,.35);}
  if(this.elapsed>=this.nextTide){this.tide=Math.min(5,this.tide+1);this.nextTide+=this.mode===2?10:9;this.beep(170,.3);this.float('LA NUBE CAE · BUSCA EL CENTRO',400,280,C.blue);}
  const all=[...this.players,...this.enemies];
  for(const e of all){e.inv=Math.max(0,e.inv-dt);e.dash=Math.max(0,e.dash-dt);e.moveT=Math.max(0,e.moveT-dt);}
  if(this.demo){const p=this.players[0];p.think=p.think??0;p.type='bot';this.ai(p,dt,this.danger());}
  else for(const p of this.players){if(!p.alive)continue;p.move=Math.max(0,p.move-dt);const prefix='P'+(p.id+1)+'_';
   let dx=0,dy=0;if(held[prefix+'L'])dx=-1;else if(held[prefix+'R'])dx=1;else if(held[prefix+'U'])dy=-1;else if(held[prefix+'D'])dy=1;
   if((dx||dy)&&p.move<=0){p.dir=DIRS.findIndex(d=>d[0]===dx&&d[1]===dy);if(this.moveEntity(p,dx,dy))p.move=p.step;}
   if(pressed[prefix+'1'])this.place(p);if(pressed[prefix+'2'])this.dash(p);
  }
  const haz=this.danger();for(const e of this.enemies)this.ai(e,dt,haz);
  for(const b of this.bombs)b.fuse-=dt;for(const b of this.bombs.slice())if(b.fuse<=0&&this.bombs.includes(b))this.explode(b);
  for(const e of all){if(!e.alive)continue;
   const flame=this.flames.find(f=>f.x===e.x&&f.y===e.y);if(flame)this.hurt(e,flame.owner);
   if(this.wet(e.x,e.y))this.hurt(e,null);
  }
  for(const p of this.players)if(p.alive){
   if(this.enemies.some(e=>e.alive&&e.x===p.x&&e.y===p.y))this.hurt(p,null);
   for(const d of this.drops.slice())if(d.safe<=0&&d.x===p.x&&d.y===p.y){this.drops.splice(this.drops.indexOf(d),1);this.beep(900,.1);
    if(d.type==='range'){p.range=Math.min(5,p.range+1);this.float('CONTEXTO +1',OX+p.x*T,OY+p.y*T,C.gold);}else{this.addScore(75,p.x,p.y);if(p.id===0)this.charge=Math.min(100,this.charge+15);}}
  }
  for(const d of this.drops)d.safe-=dt;
  for(const f of this.flames)f.life-=dt;this.flames=this.flames.filter(f=>f.life>0);
  const boss=this.enemies.find(e=>e.alive&&e.type==='boss');
  if(boss){this.bossTimer+=dt;if(this.bossTimer>5&&!this.warning){this.warning={x:boss.x,y:boss.y,left:1.4};this.bossTimer=0;}
   if(this.warning){this.warning.left-=dt;if(this.warning.left<=0){for(const[x,y]of this.rays(this.warning.x,this.warning.y,5))this.flames.push({x,y,life:.45,owner:boss});this.warning=null;this.beep(70,.25,'sawtooth');}}}
  else this.warning=null;
  if(this.mode===1){
   if(!this.players[0].alive){this.endRun(false);return;}
   if(this.enemies.every(e=>!e.alive)){
    if(!this.portal){this.portal=true;this.bombs=[];this.flames=[];this.warning=null;this.float('BATCH COMPLETO',400,255,C.lime);this.beep(1300,.3);this.score+=Math.max(0,Math.floor(100-this.elapsed))*10;}
    this.clearTimer+=dt;
    if(this.clearTimer>2){this.build.hp=this.players[0].hp;this.build.range=this.players[0].range;if(this.level===5)this.endRun(true);else{this.state='upgrade';this.selection=0;this.hideUI();releaseKeys();}return;}
   }
  }else{
   const alive=this.players.filter(p=>p.alive);
   if(alive.length<2){if(alive.length===1)this.wins[alive[0].id]++;this.roundWinner=alive.length?alive[0].id:-1;this.state='round';this.resultAt=this.clock;this.hideUI();releaseKeys();}
  }
 }
 endRun(won){this.won=won;this.state='result';this.resultAt=this.clock;this.hideUI();releaseKeys();if(!this.demo&&(!records.length||records.length<5||this.score>records[records.length-1].score)){this.initials=[0,0,0];this.cursor=0;this.needName=true;}else this.needName=false;}
 burst(x,y,c,n){for(let i=0;i<n&&this.fx.length<260;i++){const a=Math.random()*Math.PI*2,s=25+Math.random()*120;this.fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-30,life:.3+Math.random()*.4,max:.7,c});}}
 float(s,x,y,c){const o=this.add.text(x,y,s,{fontFamily:'Arial',fontSize:'17px',fontStyle:'bold',color:'#'+c.toString(16),stroke:'#080f1c',strokeThickness:4}).setOrigin(.5).setDepth(4);this.tweens.add({targets:o,y:y-35,alpha:0,duration:1100,onComplete:()=>o.destroy()});}
 playerColor(e){return e.id===0?FIRMS[this.firm][1]:e.id===1?FIRMS[this.firm2][1]:e.type==='boss'?0xc7a0ff:e.type==='crawler'?C.coral:C.blue;}
 panel(x,y,w,h,c=C.panel){this.g.fillStyle(c);this.g.fillRoundedRect(x,y,w,h,12);this.g.lineStyle(1,C.line);this.g.strokeRoundedRect(x,y,w,h,12);}
 banana(x,y,s=1,c=C.gold){const g=this.g;g.lineStyle(10*s,0x70562d);g.beginPath();g.arc(x,y-5*s,15*s,.15,2.75,false);g.strokePath();g.lineStyle(7*s,c);g.beginPath();g.arc(x,y-6*s,15*s,.15,2.75,false);g.strokePath();g.fillStyle(C.teal);g.fillRect(x+10*s,y-8*s,5*s,6*s);}
 actor(e,now,scale=1,atX,atY){
  if(!e.alive)return;const g=this.g,progress=clamp(1-e.moveT/e.step,0,1);const x=atX??OX+(e.px+(e.x-e.px)*progress)*T+T/2,y=atY??OY+(e.py+(e.y-e.py)*progress)*T+T/2;
  if(e.inv>0&&Math.floor(now*12)%2===0)return;
  const c=this.playerColor(e),s=scale*(e.type==='boss'?1.2:1),bob=Math.sin(now*7+e.id)*1.5;
  g.fillStyle(0x000000,.3);g.fillEllipse(x,y+15*s,29*s,10*s);
  if(e.type==='crawler'){
   g.fillStyle(c);g.fillRoundedRect(x-13*s,y-8*s+bob,26*s,21*s,7*s);for(const d of[-1,1]){g.fillRect(x+d*16*s-2*s,y+2*s,4*s,12*s);g.fillRect(x+d*8*s-2*s,y+12*s,4*s,5*s);}
  }else{
   g.fillStyle(0x203b43);g.fillRoundedRect(x-13*s,y-14*s+bob,26*s,29*s,7*s);g.fillStyle(c);g.fillRoundedRect(x-11*s,y-16*s+bob,22*s,20*s,6*s);g.fillStyle(c);g.fillRect(x-10*s,y+8*s,7*s,9*s);g.fillRect(x+3*s,y+8*s,7*s,9*s);
   if(e.id<2){g.fillStyle(C.gold);g.fillRect(x+9*s,y-20*s+bob,4*s,8*s);g.fillStyle(c,.18);g.fillCircle(x,y,22*s);}
   if(e.type==='boss'){g.fillStyle(C.gold);g.fillTriangle(x-10*s,y-18*s,x-12*s,y-30*s,x,y-21*s);g.fillTriangle(x,y-21*s,x+12*s,y-30*s,x+10*s,y-18*s);}
  }
  g.fillStyle(C.bg);g.fillRoundedRect(x-8*s,y-10*s+bob,16*s,9*s,3*s);g.fillStyle(C.ink);g.fillRect(x-5*s,y-7*s+bob,3*s,3*s);g.fillRect(x+3*s,y-7*s+bob,3*s,3*s);
  if(e.id<2){g.fillStyle(C.bg);g.fillRect(x-4*s,y+5*s,8*s,3*s);}
  if(e.type==='boss'){g.fillStyle(C.bg);g.fillRect(x-18,y-40,36,5);g.fillStyle(C.coral);g.fillRect(x-18,y-40,36*e.hp/(this.level===5?5:3),5);}
 }
 backdrop(now){
  const g=this.g;g.fillStyle(C.bg);g.fillRect(0,0,W,H);
  g.lineStyle(1,0x244453,.22);for(let x=0;x<W;x+=40){g.lineBetween(x,0,x,H);}for(let y=0;y<H;y+=40)g.lineBetween(0,y,W,y);
  g.fillStyle(C.teal,.035);g.fillCircle(720,80,220);g.fillStyle(C.lime,.025);g.fillCircle(50,500,200);
  for(let i=0;i<28;i++){const x=(i*137+now*9)%800,y=(i*79)%600;g.fillStyle(i%2?C.teal:C.lime,.15+.15*Math.sin(now+i));g.fillRect(x,y,2,2);}
 }
 renderMenu(now){
  const g=this.g;
  this.text('eyebrow',400,39,'CHILE 2026   /   STARTUP ARENA',13,C.teal);
  this.text('title',400,95,'PROMPTBOOM',62,C.lime);this.text('subtitle',400,143,'BOMBERMAN EN LA ERA DE LA IA',15,C.muted);
  this.panel(64,179,672,169);
  for(let i=0;i<11;i++){const x=91+i*57;g.fillStyle(i%2?0x172d38:0x203b43);g.fillRoundedRect(x,206,44,44,6);g.fillRoundedRect(x,267,44,44,6);if(i%3===0){g.fillStyle(C.teal,.3);g.fillRect(x+8,215,28,3);g.fillRect(x+8,224,19,3);}}
  const fake={id:0,alive:true,inv:0,type:'',px:0,py:0,x:0,y:0,moveT:0,step:1};this.actor(fake,now,2.1,183,261);
  const fake2={...fake,id:1};this.actor(fake2,now,2.1,620,261);
  g.lineStyle(4,C.gold,.5+.3*Math.sin(now*3));g.lineBetween(290,255,510,255);g.lineBetween(400,201,400,315);
  for(const x of[310,400,490])this.banana(x,252,1.7);
  this.text('chainlabel',400,326,'PROMPTS + CADENAS + OVERCLOCK',12,C.gold);
  this.text('faction',247,372,'P1  ‹ '+FIRMS[this.firm][0]+' ›',19,FIRMS[this.firm][1]);this.text('faction2',553,372,'P2  ‹ '+FIRMS[this.firm2][0]+' ›',19,FIRMS[this.firm2][1]);
  this.text('tagline',400,398,FIRMS[this.firm][2]+'   /   CADA JUGADOR ELIGE SU EQUIPO',10,C.muted);
  const opts=['SOLO / 5 BATCHES','DUELO / MEJOR DE 3','CÓMO JUGAR','RÉCORDS'];
  for(let i=0;i<4;i++){const x=i%2?410:90,y=i<2?424:476;const active=this.selection===i;this.panel(x,y,300,43,active?0x304332:C.panel);this.text('option'+i,x+150,y+22,(active?'▸  ':'')+opts[i],16,active?C.lime:C.ink);}
  this.text('menukeys',400,548,'↑↓ MODO   ·   ←→ EQUIPO   ·   BOTÓN 1 / ENTER: JUGAR',12,C.ink);
  this.text('disclaimer',400,575,'Homenaje independiente al ecosistema tech. Sin afiliación con las marcas.',10,C.muted);
 }
 drawBoard(now){
  const g=this.g;this.panel(OX-8,OY-8,COLS*T+16,ROWS*T+16,0x0f2430);
  const impending=this.nextTide-this.elapsed<3;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
   const px=OX+x*T,py=OY+y*T,t=this.tile(x,y);g.fillStyle((x+y)%2?0x142a32:0x162e36);g.fillRect(px+1,py+1,T-2,T-2);
   if(t===1){g.fillStyle(0x27404a);g.fillRoundedRect(px+3,py+3,T-6,T-6,5);g.fillStyle(0x37515a);g.fillRect(px+7,py+6,T-14,3);g.fillStyle(C.teal,.45);g.fillRect(px+9,py+14,3,3);g.fillRect(px+15,py+14,3,3);g.fillStyle(C.bg,.5);g.fillRect(px+9,py+25,T-18,4);}
   if(t===2){g.fillStyle(0x80673b);g.fillRoundedRect(px+4,py+4,T-8,T-8,5);g.fillStyle(0xb19350);g.fillRect(px+6,py+5,T-12,5);g.lineStyle(2,0xd7b975,.45);g.strokeRect(px+10,py+12,T-20,T-22);g.lineBetween(px+11,py+13,px+T-11,py+T-11);g.lineBetween(px+T-11,py+13,px+11,py+T-11);}
   if(this.wet(x,y)&&t!==1){g.fillStyle(0x437dce,.55);g.fillRect(px,py,T,T);g.lineStyle(2,C.blue,.5);g.lineBetween(px+5,py+20+Math.sin(now*4+x)*6,px+T-5,py+20+Math.sin(now*4+x+1)*6);}
   if(impending&&!this.wet(x,y)&&(x===this.tide+1||y===this.tide+1||x===COLS-2-this.tide||y===ROWS-2-this.tide)){g.fillStyle(C.coral,.1+.15*(1+Math.sin(now*9)));g.fillRect(px,py,T,T);}
  }
  for(const[x,y]of this.relays){const px=OX+x*T+T/2,py=OY+y*T+T/2;g.fillStyle(C.teal,.1+.05*Math.sin(now*3));g.fillCircle(px,py,18);g.lineStyle(2,C.teal,.8);g.strokeCircle(px,py,11);g.lineBetween(px-15,py,px+15,py);g.lineBetween(px,py-15,px,py+15);g.fillStyle(C.teal);g.fillRect(px-3,py-3,6,6);}
  for(const d of this.drops)if(d.safe<=0){const x=OX+d.x*T+T/2,y=OY+d.y*T+T/2+Math.sin(now*5)*3;g.fillStyle(d.type==='token'?C.teal:C.gold,.12);g.fillCircle(x,y,17);g.lineStyle(2,d.type==='token'?C.teal:C.gold);g.strokeCircle(x,y,10);g.fillStyle(d.type==='token'?C.teal:C.gold);g.fillRect(x-3,y-6,6,12);g.fillRect(x-6,y-3,12,6);}
  for(const b of this.bombs){
   const x=OX+b.x*T+T/2,y=OY+b.y*T+T/2;
   if(b.fuse<.7)for(const[bx,by]of this.rays(b.x,b.y,b.range)){g.fillStyle(C.gold,.12+.08*Math.sin(now*20));g.fillRect(OX+bx*T+3,OY+by*T+3,T-6,T-6);}
   this.banana(x,y-2,1+Math.sin(now*(b.fuse<.6?24:9))*.08,b.owner.id===1?C.coral:C.gold);g.lineStyle(3,b.fuse<.7?C.coral:C.teal);g.beginPath();g.arc(x,y,17,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(b.fuse/b.total,0,1),false);g.strokePath();
  }
  if(this.warning)for(const[x,y]of this.rays(this.warning.x,this.warning.y,5)){g.fillStyle(0xc7a0ff,.2+.15*Math.sin(now*16));g.fillRect(OX+x*T,OY+y*T,T,T);g.lineStyle(2,0xc7a0ff);g.strokeRect(OX+x*T+6,OY+y*T+6,T-12,T-12);}
  for(const f of this.flames){const x=OX+f.x*T,y=OY+f.y*T;g.fillStyle(C.coral,f.life/.43*.65);g.fillRoundedRect(x+1,y+1,T-2,T-2,8);g.fillStyle(C.gold,.9);g.fillRoundedRect(x+6,y+6,T-12,T-12,9);g.fillStyle(0xfff7c7);g.fillRect(x+15,y+8,12,T-16);g.fillRect(x+8,y+15,T-16,12);}
  for(const e of this.enemies)this.actor(e,now);for(const p of this.players)this.actor(p,now);
  if(this.overclock>0){g.lineStyle(3,C.teal,.6+.3*Math.sin(now*9));g.strokeRoundedRect(OX-7,OY-7,COLS*T+14,ROWS*T+14,12);}
 }
 drawHUD(){
  const p=this.players[0];
  this.text('brand',34,26,'PROMPTBOOM',17,C.lime,'left');
  this.text('zone',400,22,this.mode===1?ZONES[this.level-1]:'DUELO DE STARTUPS / RONDA '+this.round,12,C.muted);
  this.text('score',766,24,this.mode===1?String(this.score).padStart(6,'0'):this.wins[0]+' : '+this.wins[1],23,C.ink,'right');
  const hp=p=>Array.from({length:3},(_,i)=>p.hp>i?'●':'○').join(' ');
  this.text('p1',85,62,(this.mode===2?'P1 ':'')+FIRMS[this.firm][0]+'   '+hp(p),15,FIRMS[this.firm][1],'left');
  this.text('p2',715,62,this.mode===2?'P2 '+FIRMS[this.firm2][0]+'  '+hp(this.players[1]):'BOTS '+this.enemies.filter(e=>e.alive).length+'   /   BATCH '+this.level+'/5',15,this.mode===2?FIRMS[this.firm2][1]:C.ink,'right');
  const remaining=Math.max(0,Math.ceil(this.nextTide-this.elapsed));this.text('tide',400,62,this.elapsed<4?'DOS PROMPTS. UNA IDEA.':'NUBE ↓ '+remaining+'s',12,remaining<4?C.coral:C.blue);
  const mult=this.clock<this.comboUntil?Math.min(5,1+Math.floor(this.combo/3)):1;
  this.text('bottom',85,571,this.mode===1?'COMBO ×'+mult+'   /   CADENAS '+this.stats.chains:'P1: WASD + U / I',12,C.ink,'left');
  this.text('action',715,571,this.mode===2?'P2: FLECHAS + R / T':'① PROMPT   ② ESQUIVA '+(p.dash>0?p.dash.toFixed(1)+'s':'LISTA'),12,C.muted,'right');
  if(this.mode===1){this.g.fillStyle(C.line);this.g.fillRoundedRect(320,565,150,8,4);this.g.fillStyle(C.teal);this.g.fillRoundedRect(320,565,Math.max(2,150*(this.overclock>0?this.overclock/8:this.charge/100)),8,4);this.text('charge',395,586,this.overclock>0?'OVERCLOCK '+this.overclock.toFixed(1)+'s':'TOKENS → OVERCLOCK',9,C.teal);}
  if(this.ready>0){this.panel(185,218,430,160,0x0b1827);this.text('ready',400,250,this.mode===2?'DUELO DE STARTUPS':'BATCH '+this.level+' / 5',26,C.lime);this.text('ready2',400,291,'① PON UN PROMPT    ② ESQUIVA',16,C.ink);this.text('ready3',400,329,Math.ceil(this.ready)===1?'¡A PRODUCIR!':'SAL DE LA CRUZ ANTES DEL BOOM',13,C.gold);}else for(const id of['ready','ready2','ready3'])if(this.texts[id])this.texts[id].setVisible(false);
  if(this.demo){this.text('demo',400,535,'DEMO AUTOMÁTICA · CUALQUIER BOTÓN PARA JUGAR',13,C.lime);}
 }
 overlay(now){
  const g=this.g;g.fillStyle(C.bg,.96);g.fillRect(35,30,730,540);this.panel(49,44,702,512);
  if(this.state==='help'){
   this.text('h0',400,91,'TU IDEA. TU EQUIPO. TU BOOM.',29,C.lime);
   const lines=[['01 / MUEVE','Joystick. No necesitas apuntar.'],['02 / PROMPTEA','Botón 1: bomba de plátano. Explota en 2 segundos.'],['03 / ENRUTA','Los nodos turquesa retransmiten la explosión en cruz.'],['04 / ENCADENA','Un prompt detona al siguiente. Cadena = más tokens.'],['05 / SOBRECARGA','Recoge tokens: al llenar la barra, +alcance por 8s.'],['06 / ESQUIVA','Botón 2: avanza 2 casillas con un breve escudo.'],['07 / SOBREVIVE','La nube cae: el borde azul hace daño. Busca el centro.']];
   lines.forEach(([a,b],i)=>{this.text('ha'+i,86,140+i*44,a,13,i%2?C.gold:C.teal,'left');this.text('hb'+i,86,160+i*44,b,14,C.ink,'left');});
   this.text('hk',400,485,'P1 WASD + U / I    ·    P2 FLECHAS + R / T',13,C.muted);this.text('back',400,523,'BOTÓN 1 / START: VOLVER',14,C.lime);
  }else if(this.state==='records'){
   this.text('rh',400,105,'HALL OF BUILDERS',32,C.lime);this.text('rs',400,148,'SOLO / PUNTOS + COMBOS + VELOCIDAD',12,C.muted);
   for(let i=0;i<5;i++){const r=records[i];this.text('r'+i,400,209+i*52,String(i+1).padStart(2,'0')+'     '+(r?r.name+'     '+String(r.score).padStart(6,'0'):'---     ------'),25,i===0?C.gold:C.ink);}
   this.text('back',400,515,'BOTÓN 1 / START: VOLVER',14,C.lime);
  }else if(this.state==='upgrade'){
   this.text('uh',400,100,'BATCH COMPLETO',37,C.lime);this.text('us',400,148,'ELIGE UNA INVERSIÓN PARA EL SIGUIENTE BATCH',13,C.muted);
   const choices=[['CONTEXTO LARGO','+1 casilla de alcance','LEE MÁS LEJOS'],['PARALELISMO','+1 prompt simultáneo','CREA MÁS CADENAS'],['RONDA SEED','Recupera una vida','SIGUE CONSTRUYENDO']];
   choices.forEach((a,i)=>{const x=78+i*219;this.panel(x,201,206,230,i===this.selection?0x2b4134:C.panel);this.banana(x+103,254,1.6,i===this.selection?C.lime:C.muted);this.text('u'+i,x+103,312,a[0],16,i===this.selection?C.lime:C.ink);this.text('ud'+i,x+103,347,a[1],13,C.ink);this.text('ut'+i,x+103,397,a[2],10,C.muted);});
   this.text('uk',400,480,'←→ ELIGE    ·    BOTÓN 1 CONFIRMA',16,C.lime);this.text('uf',400,515,'PUNTOS '+this.score+'   /   VIDA '+this.build.hp+'   /   ALCANCE '+this.build.range,13,C.muted);
  }else if(this.state==='round'){
   const winner=this.wins.some(n=>n>=2);this.text('dh',400,142,winner?'¡STARTUP UNICORNIO!':'RONDA TERMINADA',35,C.lime);this.text('dw',400,211,this.roundWinner<0?'EMPATE / AMBOS OFFLINE':'GANA '+(this.roundWinner===0?FIRMS[this.firm][0]:FIRMS[this.firm2][0]),23,this.roundWinner===0?FIRMS[this.firm][1]:FIRMS[this.firm2][1]);this.text('ds',400,300,this.wins[0]+'   :   '+this.wins[1],80,C.ink);this.text('dk',400,432,winner?'BOTÓN 1: REVANCHA  ·  START: MENÚ':'BOTÓN 1 / START: SIGUIENTE RONDA',14,C.lime);this.text('df',400,487,'MEJOR DE 3 · ARENA SIMÉTRICA · MISMAS MEJORAS',12,C.muted);
  }else{
   this.text('eh',400,100,this.won?'¡DE IDEA A UNICORNIO!':'SE CAYÓ PRODUCCIÓN',33,this.won?C.lime:C.coral);this.text('es',400,174,String(this.score).padStart(6,'0'),64,C.ink);this.text('est',400,234,'BATCH '+this.level+'/5   ·   '+this.stats.bots+' BOTS   ·   '+this.stats.chains+' CADENAS',14,C.muted);
   if(this.needName){this.text('nameh',400,295,'FIRMA TU RÉCORD',17,C.gold);for(let i=0;i<3;i++){this.panel(293+i*75,327,64,72,i===this.cursor?0x304332:C.panel);this.text('letter'+i,325+i*75,362,String.fromCharCode(65+this.initials[i]),38,i===this.cursor?C.lime:C.ink);}this.text('namekeys',400,429,'↑↓ LETRA  ·  ←→ POSICIÓN  ·  BOTÓN 1 GUARDA',13,C.ink);}
   else {this.text('endmsg',400,329,this.won?'EL PRÓXIMO GRAN BATCH ES EL TUYO.':'CADA CADENA ES UNA NUEVA OPORTUNIDAD.',17,C.gold);this.text('endkeys',400,410,'BOTÓN 1: REINTENTAR   ·   START: MENÚ',14,C.lime);}
   this.text('endfoot',400,500,'PROMPTBOOM / CHILE 2026',12,C.muted);
  }
 }
 pointer(p){
  this.unlock();this.lastInput=this.clock;
  if(this.state==='menu'){
   if(p.y>351&&p.y<411){if(p.x<400)this.firm=(this.firm+1)%6;else this.firm2=(this.firm2+1)%6;return;}
   if(p.y>=424&&p.y<519){this.selection=(p.y>=476?2:0)+(p.x>400?1:0);this.confirm();}return;
  }
  if(this.state==='play'){
   if(this.demo){this.menu();return;}if(this.ready>0)return;this.touch=true;
   const hero=this.players[0];if(p.x>640){if(p.y<300)this.place(hero);else this.dash(hero);}
   else{const dx=p.x-(OX+hero.x*T+T/2),dy=p.y-(OY+hero.y*T+T/2);const dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'R':'L'):(dy>0?'D':'U');held['P1_'+dir]=true;}return;
  }
  if(this.state==='upgrade'){this.selection=clamp(Math.floor((p.x-78)/219),0,2);this.confirm();}
  else if(this.state==='result'&&this.needName){this.initials[this.cursor]=(this.initials[this.cursor]+1)%26;}
  else this.confirm();
 }
 confirm(){
  this.unlock();this.beep(620,.06);
  if(this.state==='menu'){if(this.selection<2)this.begin(this.selection+1);else{this.state=this.selection===2?'help':'records';this.hideUI();}return;}
  if(this.state==='help'||this.state==='records'){this.menu();return;}
  if(this.state==='upgrade'){
   if(this.selection===0)this.build.range=Math.min(5,this.build.range+1);else if(this.selection===1)this.build.capacity=Math.min(4,this.build.capacity+1);else this.build.hp=Math.min(3,this.build.hp+1);
   this.level++;this.startRound();return;
  }
  if(this.clock-this.resultAt<.65)return;
  if(this.state==='round'){if(this.wins.some(n=>n>=2))this.begin(2);else{this.round++;this.startRound();}return;}
  if(this.state==='result'){if(this.needName){saveRecord(this.initials.map(n=>String.fromCharCode(65+n)).join(''),this.score);this.needName=false;this.hideUI();}else this.begin(1);}
 }
 update(time,delta){
  const dt=Math.min(.05,delta/1000);this.clock+=dt;this.hideUI();this.g.clear();this.backdrop(this.clock);
  const any=Object.keys(pressed).some(k=>pressed[k]);if(any){this.unlock();this.lastInput=this.clock;}
  if(this.demo&&any){this.menu();for(const k in pressed)delete pressed[k];return;}
  if(pressed.P1_6||pressed.P2_6){soundOn=!soundOn;}
  if(this.state==='play'){
   if((pressed.START1||pressed.START2)&&this.ready<=0&&!this.demo){this.paused=!this.paused;releaseKeys();}
   if(!this.paused)this.tick(dt);
   this.drawBoard(this.clock);this.drawHUD();
   if(this.paused){this.panel(190,220,420,150);this.text('pause',400,267,'PAUSA',34,C.lime);this.text('pausek',400,320,'START: CONTINUAR  ·  BOTÓN 3: MENÚ',13,C.ink);if(pressed.P1_3||pressed.P2_3){this.paused=false;this.menu();}}else for(const id of['pause','pausek'])if(this.texts[id])this.texts[id].setVisible(false);
   if(this.demo&&this.elapsed>22)this.menu();
  }else if(this.state==='menu'){
   if(pressed.P1_U||pressed.P2_U)this.selection=(this.selection+3)%4;
   if(pressed.P1_D||pressed.P2_D)this.selection=(this.selection+1)%4;
   if(pressed.P1_L)this.firm=(this.firm+5)%6;if(pressed.P2_L)this.firm2=(this.firm2+5)%6;
   if(pressed.P1_R)this.firm=(this.firm+1)%6;if(pressed.P2_R)this.firm2=(this.firm2+1)%6;
   this.renderMenu(this.clock);if(pressed.START2)this.begin(2);else if(pressed.P1_1||pressed.P2_1||pressed.START1)this.confirm();
   if(this.clock-this.lastInput>24){this.lastInput=this.clock;this.begin(1,true);}
  }else{
   if(this.state==='upgrade'){
    if(pressed.P1_L||pressed.P2_L)this.selection=(this.selection+2)%3;if(pressed.P1_R||pressed.P2_R)this.selection=(this.selection+1)%3;
   }
   if(this.state==='result'&&this.needName){if(pressed.P1_L)this.cursor=(this.cursor+2)%3;if(pressed.P1_R)this.cursor=(this.cursor+1)%3;if(pressed.P1_U)this.initials[this.cursor]=(this.initials[this.cursor]+1)%26;if(pressed.P1_D)this.initials[this.cursor]=(this.initials[this.cursor]+25)%26;}
   this.overlay(this.clock);
   if(pressed.P1_1||pressed.P2_1)this.confirm();
   else if(pressed.START1||pressed.START2){if(this.state==='result'||(this.state==='round'&&this.wins.some(n=>n>=2)))this.menu();else this.confirm();}
   if(this.demo&&this.clock-this.resultAt>3)this.menu();
   if((this.state==='result'||this.state==='round')&&this.clock-this.resultAt>45)this.menu();
  }
  for(const p of this.fx){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=170*dt;this.g.fillStyle(p.c,clamp(p.life/.5,0,1));this.g.fillRect(p.x,p.y,3,3);}this.fx=this.fx.filter(p=>p.life>0);
  if(!this.paused&&this.clock>this.noteAt){this.noteAt=this.clock+(this.state==='play'?.23:.38);const notes=[0,7,12,7,3,10,15,10,5,12,17,12,7,14,19,14];if(this.beat%2===0)this.beep(110*Math.pow(2,notes[this.beat%16]/12),.13,'triangle',.016);if(this.state==='play'&&this.beat%4===0)this.beep(65,.1,'sine',.025);this.beat++;}
  for(const k in pressed)delete pressed[k];
 }
}
new Phaser.Game({type:Phaser.AUTO,width:W,height:H,parent:'game-root',backgroundColor:'#080f1c',render:{antialias:true},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[Arena],audio:{disableWebAudio:false}});
})();
