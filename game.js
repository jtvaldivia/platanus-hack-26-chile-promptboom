/* PLATANAZO — evolved from Platano audaz (jtvaldivia, 2025).
   Procedural art, original synthesized soundtrack, no downloaded game assets. */
(() => {
'use strict';
const W=800,H=600,COLS=15,ROWS=11,T=42,OX=85,OY=88;
const C={bg:0x191525,panel:0x30243e,line:0x65536a,ink:0xfff1d5,muted:0xbca9ba,lime:0xd9ff68,teal:0x54e4cc,coral:0xff777d,gold:0xffce68,blue:0x6f9fff};
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
const FIRMS=[['PLATANUS',C.lime,'DEMO DAY O DEMOLITION DAY'],['OPENAI',C.teal,'OTRO WRAPPER, PERO CON FE'],['ANTHROPIC',C.coral,'TE LO RESUMO EN 80 SLIDES'],['FINTUAL',C.blue,'MANOS DE DIAMANTE, GUATA DE PALTA'],['NOTCO',C.gold,'NOT A NORMAL BANANA'],['BUK',0xc7a0ff,'ESTA REUNIÓN PUDO SER UN MAIL']];
const ZONES=['PLATANUS / DEMO DAY','FINTUAL / MANOS DE DIAMANTE','NOTCO / NOT A NORMAL BOSS','BUK / STANDUP ETERNA','OPENAI × ANTHROPIC / GUERRA DE WRAPPERS'];
const LOOT=[
 {id:'completo',name:'ITALIANO LEGENDARIO',desc:'+1 vida máxima y +1 vida',tag:'PALTA > VALUATION',icon:'completo',max:2},
 {id:'cafe',name:'CAFÉ DE COWORK',desc:'Esquiva recarga 0.6s antes',tag:'DORMIR ES DE SERIES B',icon:'cafe',max:3},
 {id:'deck',name:'PITCH DE 80 SLIDES',desc:'+1 alcance del plátano',tag:'AHORA SÍ ES EL ÚLTIMO SLIDE',icon:'deck',max:3},
 {id:'after',name:'AFTER OFFICE',desc:'+1 plátano simultáneo',tag:'UNO MÁS Y NOS VAMOS',icon:'banana',max:2},
 {id:'equity',name:'EQUITY EMOCIONAL',desc:'Escudo: bloquea 1 golpe / batch',tag:'VESTING INMEDIATO',icon:'equity',max:1},
 {id:'peel',name:'PIVOT CON CÁSCARA',desc:'Esquivar deja cáscaras que frenan bots',tag:'NO ES BUG, ES PIVOT',icon:'peel',max:1},
 {id:'propina',name:'LA PROPINA DEL 10%',desc:'Atrae lucas a 2 casillas',tag:'¿DESEA AGREGAR PROPINA?',icon:'cash',max:1},
 {id:'dca',name:'DCA DEL COMPLETO',desc:'+150 lucas × batch al completarlo',tag:'HODL LA PALTA',icon:'cash',max:2},
 {id:'hype',name:'WRAPPER PREMIUM',desc:'Café y lucas cargan +50% crunch',tag:'PERO TIENE IA, PO',icon:'laptop',max:2},
 {id:'notmilk',name:'NOT UNA VACA',desc:'Recupera 1 vida cada 3 bots',tag:'PROTEÍNA PARA EL PIVOT',icon:'milk',max:1}
];
const STORE='platanazo-26-cl-v2';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), key=(x,y)=>y*COLS+x;
let records=[],soundOn=true;
function validRecord(v){return v&&/^[A-Z]{3}$/.test(v.name)&&Number.isFinite(v.score)&&v.score>=0&&v.score<1e8&&Number.isInteger(v.level)&&v.level>=1&&v.level<=5&&Array.isArray(v.build)&&v.build.length<=10&&v.build.every(id=>LOOT.some(p=>p.id===id));}
async function readRecords(){try{const b=window.platanusArcadeStorage;if(!b)return;const r=await b.get(STORE);if(r.found&&Array.isArray(r.value))records=r.value.filter(validRecord).sort((a,b)=>b.score-a.score).slice(0,10);}catch{}}
async function saveRecord(name,score,level,build,won){const entry={name,score,level,build:[...build],won:!!won};records=[...records,entry].sort((a,b)=>b.score-a.score).slice(0,10);try{const b=window.platanusArcadeStorage;if(b){await b.set(STORE,records);return true;}}catch{}return false;}
class Arena extends Phaser.Scene{
 constructor(){super('Arena');}
 create(){
  this.g=this.add.graphics();this.effects=this.add.graphics().setDepth(3);this.art=[];this.artCount=0;this.floaters=new Set();this.makeArt();this.ui=this.add.container(0,0).setDepth(5);this.fx=[];this.texts={};this.clock=0;this.noteAt=0;this.beat=0;this.selection=0;this.firm=0;this.firm2=2;this.touch=false;this.lastInput=0;this.best=0;
  this.input.on('pointerdown',p=>this.pointer(p));this.input.on('pointerup',()=>{for(const k of Object.keys(held))if(k.startsWith('P1_'))held[k]=false;});this.input.on('pointerupoutside',releaseKeys);
  this.scale.on('leave',releaseKeys);readRecords();this.menu();
 }
 text(id,x,y,str,size=16,col=C.ink,align='center'){
  let o=this.texts[id];if(!o){o=this.add.text(x,y,'',{fontFamily:size>=28?'Impact, Arial Black, sans-serif':'Arial, sans-serif',fontSize:size+'px',fontStyle:'bold',color:'#fff',align,lineSpacing:5}).setOrigin(align==='left'?0:align==='right'?1:.5,.5);this.ui.add(o);this.texts[id]=o;}
  o.setPosition(x,y).setText(str).setFontSize(size).setColor('#'+col.toString(16).padStart(6,'0')).setVisible(true);return o;
 }
 hideUI(){for(const t of Object.values(this.texts))t.setVisible(false);}
 beep(freq=440,dur=.1,type='triangle',vol=.035){
  const ctx=this.sound.context;if(!soundOn||!ctx||ctx.state!=='running')return;
  try{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.65),ctx.currentTime+dur);g.gain.setValueAtTime(vol,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur);o.connect(g);g.connect(ctx.destination);o.onended=()=>{o.disconnect();g.disconnect();};o.start();o.stop(ctx.currentTime+dur);}catch{}
 }
 unlock(){const ctx=this.sound.context;if(ctx&&ctx.state==='suspended')ctx.resume().catch(()=>{});}
 menu(){this.clearFloats();this.state='menu';this.paused=false;this.lastInput=this.clock;this.idle=0;this.demo=false;this.fx=[];this.hideUI();releaseKeys();}
 begin(mode,demo=false){
  this.mode=mode;this.demo=demo;this.level=1;this.score=0;this.combo=0;this.comboUntil=0;this.charge=0;this.overclock=0;this.wins=[0,0];this.round=1;this.stats={blocks:0,chains:0,bots:0};this.build={hp:mode===1?4:3,maxHp:mode===1?4:3,range:2,capacity:2,cooldown:3,perks:{}};this.revived=false;this.rerolls=1;this.savedStatus='';this.startRound();
 }
 makePlayer(x,y,id){return {x,y,px:x,py:y,id,hp:this.mode===2?3:this.build.hp,shield:this.mode===1?(this.build.perks.equity||0):0,alive:true,move:0,step:.125,dir:1,inv:1.8,dash:0,range:this.build.range,capacity:this.build.capacity,moveT:0};}
 startRound(){
  this.clearFloats();this.hideUI();releaseKeys();this.paused=false;this.state='play';this.elapsed=0;this.ready=2.6;this.grid=[];this.bombs=[];this.flames=[];this.drops=[];this.enemies=[];this.fx=[];this.tide=0;this.nextTide=this.mode===2?30:48;this.portal=false;this.clearTimer=0;this.bossTimer=0;this.warning=null;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
   const edge=x===0||y===0||x===COLS-1||y===ROWS-1,stone=x%2===0&&y%2===0;
   this.grid[key(x,y)]=edge||stone?1:Math.random()<.48?2:0;
  }
  if(this.mode===2)for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)this.grid[key(COLS-1-x,ROWS-1-y)]=this.grid[key(x,y)];
  const safe=[[1,1],[2,1],[3,1],[1,2],[1,3],[3,2],[3,3],[2,3],[13,9],[12,9],[11,9],[13,8],[13,7],[11,8],[11,7],[12,7]];
  for(const [x,y]of safe)this.grid[key(x,y)]=0;
  this.relays=[[7,3],[3,5],[11,5],[7,7]];for(const[x,y]of this.relays)this.grid[key(x,y)]=0;
  this.peels=[];this.players=[this.makePlayer(1,1,0)];if(this.mode===2)this.players.push(this.makePlayer(13,9,1));
  if(this.mode===1){
   const spots=[[13,9],[13,1],[1,9],[9,5],[7,9],[11,3],[5,7]];
   const count=Math.min(6,1+this.level);
   for(let i=0;i<count;i++){const [x,y]=spots[i];this.grid[key(x,y)]=0;for(const[dX,dY]of DIRS)if(this.inside(x+dX,y+dY)&&this.tile(x+dX,y+dY)!==1)this.grid[key(x+dX,y+dY)]=0;
    this.enemies.push({x,y,px:x,py:y,id:2+i,hp:1,alive:true,move:.5+i*.11,step:Math.max(.22,.48-this.level*.035),dir:0,inv:0,dash:0,range:2,capacity:1,think:3+i*.4,type:i%3===2&&this.level>1?'hunter':i%2?'bot':'crawler',moveT:0});
   }
   if(this.level===3||this.level===5){const b=this.enemies[this.enemies.length-1];b.type='boss';b.hp=this.level===5?5:3;b.step=.52;b.range=3;b.capacity=2;}
  }
 }
 tile(x,y){return this.grid[key(x,y)];}
 inside(x,y){return x>0&&y>0&&x<COLS-1&&y<ROWS-1;}
 wet(x,y){return x<=this.tide||y<=this.tide||x>=COLS-1-this.tide||y>=ROWS-1-this.tide;}
 bombAt(x,y){return this.bombs.find(b=>b.x===x&&b.y===y);}
 walk(x,y){return this.inside(x,y)&&this.tile(x,y)===0&&!this.bombAt(x,y);}
 rays(x,y,range,grid=this.grid){
  const cells=[],seen=new Set(),relayed=new Set(),queue=[[x,y,range]];
  const add=(cx,cy)=>{const k=key(cx,cy);if(!seen.has(k)){seen.add(k);cells.push([cx,cy]);}if(this.relays?.some(([rx,ry])=>rx===cx&&ry===cy)&&!relayed.has(k)){relayed.add(k);queue.push([cx,cy,2]);}};
  while(queue.length){const[cx,cy,r]=queue.shift();add(cx,cy);for(const[dx,dy]of DIRS)for(let n=1;n<=r;n++){const nx=cx+dx*n,ny=cy+dy*n;if(!this.inside(nx,ny)||grid[key(nx,ny)]===1)break;add(nx,ny);if(grid[key(nx,ny)]===2)break;}}
  return cells;
 }
 /* Discrete space-time search: a tile can be safe now and lethal on arrival.
    Forecast simulates chained bombs, crate removal, active fire and the tide. */
 danger(extra=null){
  const windows=new Map(),blocked=new Map(),destroyed=new Map(),grid=this.grid.slice();
  const add=(x,y,a,b)=>{const k=key(x,y);if(!windows.has(k))windows.set(k,[]);windows.get(k).push([Math.max(0,a-.07),b+.07]);};
  for(const f of this.flames)add(f.x,f.y,0,f.life);
  if(this.warning)for(const[x,y]of this.rays(this.warning.x,this.warning.y,5))add(x,y,this.warning.left,this.warning.left+.45);
  const pending=this.bombs.map(b=>({...b}));if(extra)pending.push({...extra});
  for(const b of pending)blocked.set(key(b.x,b.y),Math.max(0,b.fuse));
  let horizon=.7;
  while(pending.length){
   let at=Math.min(...pending.map(b=>b.fuse));const queue=pending.filter(b=>Math.abs(b.fuse-at)<.001),done=new Set(),crates=new Set();horizon=Math.max(horizon,at+.58);
   while(queue.length){const b=queue.shift();if(done.has(b))continue;done.add(b);blocked.set(key(b.x,b.y),at);
    for(const[x,y]of this.rays(b.x,b.y,b.range,grid)){add(x,y,at,at+.43);if(grid[key(x,y)]===2)crates.add(key(x,y));for(const other of pending)if(other.x===x&&other.y===y&&!done.has(other))queue.push(other);}
   }
   for(const k of crates){grid[k]=0;destroyed.set(k,at);}
   for(let i=pending.length-1;i>=0;i--)if(done.has(pending[i]))pending.splice(i,1);
  }
  const next=this.nextTide-this.elapsed,interval=this.mode===2?10:9;
  for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){const edge=Math.min(x,y,COLS-1-x,ROWS-1-y),at=edge<=this.tide?0:next+(edge-this.tide-1)*interval;if(at<=horizon+1)add(x,y,Math.max(0,at),999);}
  return {windows,blocked,destroyed,horizon:Math.min(4,horizon)};
 }
 safeAt(fc,x,y,from,to){return !(fc.windows.get(key(x,y))||[]).some(([a,b])=>a<=to&&b>=from);}
 freeAt(fc,x,y,at){const k=key(x,y),t=this.tile(x,y);return this.inside(x,y)&&t!==1&&(t!==2||(fc.destroyed.get(k)??999)<at)&&(!fc.blocked.has(k)||fc.blocked.get(k)<at);}
 plan(e,fc,target=null,flee=false){
  const step=e.step*(this.peels.some(p=>p.x===e.x&&p.y===e.y)?2.8:1),limit=Math.min(23,Math.max(5,Math.ceil((fc.horizon+.35)/step))),q=[{x:e.x,y:e.y,d:0,first:null,route:[],left:false}],seen=new Set();
  let best=null,bestScore=-Infinity;
  for(let i=0;i<q.length;i++){
   const n=q[i],at=n.d*step,stable=this.safeAt(fc,n.x,n.y,at,Math.max(at+.3,fc.horizon+.15));
   if(stable&&(n.d>0||!flee)){
    const exits=DIRS.filter(([dx,dy])=>this.freeAt(fc,n.x+dx,n.y+dy,at+.01)&&this.safeAt(fc,n.x+dx,n.y+dy,at,at+step)).length;
    const dist=target?Math.abs(n.x-target.x)+Math.abs(n.y-target.y):0;
    const score=flee?exits*.4-n.d*.2: -dist*5-n.d*.25+exits*.07;
    if(score>bestScore){bestScore=score;best={step:n.first,route:n.route,safe:true,arrival:at,visited:i+1};}
    if(target&&dist===0&&n.first)return best;
   }
   if(n.d>=limit)continue;
   const dirs=[...DIRS,[0,0]];
   for(const[dx,dy]of dirs){
    const x=n.x+dx,y=n.y+dy,k=key(x,y),arrival=(n.d+1)*step,wait=!dx&&!dy;
    if(!this.inside(x,y))continue;
    const ownOrigin=x===e.x&&y===e.y&&!n.left;
    if(!ownOrigin&&!this.freeAt(fc,x,y,at+.001))continue;
    if(n.d===0&&!wait&&this.enemies.some(o=>o!==e&&o.alive&&o.x===x&&o.y===y))continue;
    if(!this.safeAt(fc,x,y,at,arrival+.09))continue;
    if(n.d>0&&!this.safeAt(fc,n.x,n.y,at,arrival-.04))continue;
    const left=n.left||x!==e.x||y!==e.y,stamp=k+':'+(n.d+1)+':'+Number(left);if(seen.has(stamp))continue;seen.add(stamp);
    q.push({x,y,d:n.d+1,first:n.first||[dx,dy],route:[...n.route,[x,y]],left});
   }
  }
  return best;
 }
 escape(e,fc){return this.plan(e,fc,null,true)?.step||null;}
 bombPlan(e){
  if(this.bombAt(e.x,e.y)||this.bombs.filter(b=>b.owner===e).length>=e.capacity)return null;
  const candidate={x:e.x,y:e.y,owner:e,range:e.range,fuse:2.05,total:2.05,chain:1};
  const cells=new Set(this.rays(e.x,e.y,e.range).map(([x,y])=>key(x,y)));
  let benefit=0;for(const k of cells)if(this.grid[k]===2)benefit+=2;
  for(const p of(e.id<2?this.enemies:this.players))if(p!==e&&p.alive){
   if(cells.has(key(p.x,p.y)))benefit+=7;
   if(e.type==='hunter'||e.type==='boss'){const[dx,dy]=DIRS[p.dir];let x=p.x,y=p.y;for(let i=0;i<2;i++)if(this.walk(x+dx,y+dy)){x+=dx;y+=dy;}if(cells.has(key(x,y)))benefit+=4;}
  }
  if(benefit<=0)return null;
  const fc=this.danger(candidate),escape=this.plan(e,fc,null,true);
  return escape?.step&&(escape.step[0]||escape.step[1])?{...escape,benefit}:null;
 }
 place(e){
  if(!e.alive||this.bombAt(e.x,e.y)||this.bombs.filter(b=>b.owner===e).length>=e.capacity)return false;
  this.bombs.push({x:e.x,y:e.y,owner:e,range:e.range+(e.id===0&&this.overclock>0?1:0),fuse:e.id===0&&this.overclock>0?1.45:2.05,total:e.id===0&&this.overclock>0?1.45:2.05,chain:1});this.beep(280,.07,'square',.025);return true;
 }
 moveEntity(e,dx,dy){
  const x=e.x+dx,y=e.y+dy;if(!this.walk(x,y))return false;
  if(e.id<2&&this.players.some(p=>p!==e&&p.alive&&p.x===x&&p.y===y))return false;
  if(e.id>=2&&this.enemies.some(o=>o!==e&&o.alive&&o.x===x&&o.y===y))return false;
  e.px=e.x;e.py=e.y;e.x=x;e.y=y;e.moveT=e.step;e.dir=DIRS.findIndex(d=>d[0]===dx&&d[1]===dy);return true;
 }
 dash(e){
  if(e.dash>0||!e.alive)return;let moved=false;const[dx,dy]=DIRS[e.dir];
  const sx=e.x,sy=e.y;for(let i=0;i<2;i++)if(this.moveEntity(e,dx,dy))moved=true;else break;
  if(moved){if(this.mode===1&&this.build.perks.peel)this.peels.push({x:sx,y:sy,left:3});this.burst(OX+sx*T+T/2,OY+sy*T+T/2,this.playerColor(e),12);e.inv=Math.max(e.inv,.3);e.dash=this.build.cooldown;e.move=.16;this.beep(760,.13,'sine');}
 }
 addScore(n,x,y){
  if(this.mode!==1)return;
  if(this.clock>this.comboUntil)this.combo=0;this.combo++;this.comboUntil=this.clock+3;const mult=Math.min(5,1+Math.floor(this.combo/3));this.score+=n*mult;
  if(x!==undefined)this.float('+'+n*mult+(mult>1?' ×'+mult:''),OX+x*T+T/2,OY+y*T,C.lime);
 }
 explode(start){
  const queue=[start],seen=new Set(),blastGrid=this.grid.slice();while(queue.length){const b=queue.shift();if(seen.has(b)||!this.bombs.includes(b))continue;seen.add(b);const cells=this.rays(b.x,b.y,b.range,blastGrid);this.bombs.splice(this.bombs.indexOf(b),1);
   this.beep(90+b.chain*20,.22,'sawtooth',.045);this.cameras.main.shake(80,.002);
   if(b.chain>1){this.stats.chains++;if(b.owner.id===0){this.charge=clamp(this.charge+22,0,100);this.addScore(80*b.chain,b.x,b.y);}this.float('PLATANAZO ×'+b.chain,OX+b.x*T+T/2,OY+b.y*T,C.gold);}
   for(const [x,y]of cells){
    this.flames.push({x,y,life:.43,owner:b.owner});this.burst(OX+x*T+T/2,OY+y*T+T/2,C.gold,4);
    if(this.tile(x,y)===2){this.grid[key(x,y)]=0;this.stats.blocks++;if(b.owner.id===0)this.addScore(25);if(Math.random()<.38){const r=Math.random();this.drops.push({x,y,type:r<.48?'cash':r<.73?'cafe':r<.87?'completo':r<.96?'deck':'milk',safe:.55});};}
    const next=this.bombAt(x,y);if(next){next.chain=Math.max(next.chain,b.chain+1);queue.push(next);}
   }
  }
 }
 hurt(e,owner){
  if(!e.alive||e.inv>0)return;if(e.id<2&&e.shield>0){e.shield--;e.inv=1;this.float('EQUITY ACTIVADA',OX+e.x*T,OY+e.y*T,0x9d8bff);this.beep(1100,.15);return;}e.hp--;e.inv=e.type==='boss'?.65:1.65;this.burst(OX+e.x*T+T/2,OY+e.y*T+T/2,C.coral,18);this.beep(140,.18,'square');
  if(e.hp<=0&&e.id===0&&this.mode===1&&!this.revived){this.revived=true;e.hp=2;e.inv=3;this.float('PIVOT GRATIS · SIGUES VIVO, PO',400,275,C.lime);return;}
  if(e.hp<=0){e.alive=false;if(e.id>=2){this.stats.bots++;if(this.mode===1&&this.build.perks.notmilk&&this.stats.bots%3===0){this.players[0].hp=Math.min(this.build.maxHp,this.players[0].hp+1);this.float('NOT UNA CURACIÓN',400,270,C.gold);}if(owner?.id===0)this.addScore(e.type==='boss'?1200:250,e.x,e.y);}else this.float('F EN EL CHAT',OX+e.x*T+T/2,OY+e.y*T,C.coral);}
 }
 ai(e,dt,fc){
  e.move-=dt;e.think-=dt;if(e.move>0||!e.alive)return;e.move=e.step*(this.peels.some(p=>p.x===e.x&&p.y===e.y)?2.8:1);
  const threat=!this.safeAt(fc,e.x,e.y,0,fc.horizon+.15)||(e.evadeUntil||0)>this.elapsed;
  let step=null;
  if(threat){step=this.escape(e,fc);e.intent='ESCAPE';}
  else{
   if(e.type!=='crawler'&&e.think<=0&&this.elapsed>4){const plan=this.bombPlan(e);e.think=1.6+Math.random()*1.1;
    if(plan&&this.place(e)){step=plan.step;e.evadeUntil=this.elapsed+2.65;e.intent='ESCAPE';}
   }
   if(!step){
    const target=(e.id<2?this.enemies:this.players).find(p=>p!==e&&p.alive)||this.players[0];
    if(e.type==='crawler'){
     const options=DIRS.map((d,i)=>({d,i})).filter(({d:[dx,dy]})=>this.walk(e.x+dx,e.y+dy)&&this.safeAt(fc,e.x+dx,e.y+dy,0,e.move+.15));
     const forward=options.find(o=>o.i===e.dir),turns=options.filter(o=>o.i!==(e.dir+2)%4);
     const choice=forward&&(options.length<3||Math.random()<.72)?forward:(turns.length?turns:options)[Math.floor(Math.random()*(turns.length||options.length))];
     step=choice?.d;e.intent='PIVOT';
    }else{
     let goal={x:target.x,y:target.y};
     if(e.type==='hunter'||e.type==='boss'){const[dx,dy]=DIRS[target.dir];for(let i=0;i<2;i++)if(this.walk(goal.x+dx,goal.y+dy)){goal.x+=dx;goal.y+=dy;}}
     step=this.plan(e,fc,goal)?.step;e.intent=e.type==='hunter'?'CORTE':'CHASE';
    }
   }
  }
  if(step&&(step[0]||step[1]))this.moveEntity(e,...step);
 }
 tick(dt){
  if(this.ready>0){this.ready-=dt;releaseKeys();return;}
  this.elapsed+=dt;this.overclock=Math.max(0,this.overclock-dt);
  if(this.charge>=100){this.charge=0;this.overclock=8;this.float('CRUNCH MODE · CAFÉ INFINITO',400,260,C.teal);this.beep(1100,.35);}
  if(this.elapsed>=this.nextTide){this.tide=Math.min(5,this.tide+1);this.nextTide+=this.mode===2?10:9;this.beep(170,.3);this.float('SE ACABÓ EL RUNWAY · AL CENTRO, PO',400,280,C.blue);}
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
   for(const d of this.drops.slice())if(d.safe<=0&&(d.x===p.x&&d.y===p.y||(this.mode===1&&this.build.perks.propina&&Math.abs(d.x-p.x)+Math.abs(d.y-p.y)<=2&&d.type==='cash'))){this.drops.splice(this.drops.indexOf(d),1);this.beep(900,.1);const solo=this.mode===1;
    if(d.type==='deck'){p.range=Math.min(5,p.range+1);this.float('+1 SLIDE, +1 ALCANCE',OX+p.x*T,OY+p.y*T,C.gold);}
    else if(d.type==='completo'){p.hp=Math.min(solo?this.build.maxHp:3,p.hp+1);this.float('ITALIANO +1 VIDA',OX+p.x*T,OY+p.y*T,C.lime);}
    else if(d.type==='milk'){p.shield=1;this.float('NOT DAÑO',OX+p.x*T,OY+p.y*T,C.gold);}
    else{this.addScore(d.type==='cash'?100:50,p.x,p.y);if(d.type==='cafe')p.dash=Math.max(0,p.dash-1.5);if(p.id===0&&solo)this.charge=Math.min(100,this.charge+(d.type==='cafe'?25:15)*(1+.5*(this.build.perks.hype||0)));}
   }
  }
  for(const p of this.peels)p.left-=dt;this.peels=this.peels.filter(p=>p.left>0);
  for(const d of this.drops)d.safe-=dt;
  for(const f of this.flames)f.life-=dt;this.flames=this.flames.filter(f=>f.life>0);
  const boss=this.enemies.find(e=>e.alive&&e.type==='boss');
  if(boss){this.bossTimer+=dt;if(this.bossTimer>5&&!this.warning){this.warning={x:boss.x,y:boss.y,left:1.4};this.bossTimer=0;}
   if(this.warning){this.warning.left-=dt;if(this.warning.left<=0){for(const[x,y]of this.rays(this.warning.x,this.warning.y,5))this.flames.push({x,y,life:.45,owner:boss});this.warning=null;this.beep(70,.25,'sawtooth');}}}
  else this.warning=null;
  if(this.mode===1){
   if(!this.players[0].alive){this.endRun(false);return;}
   if(this.enemies.every(e=>!e.alive)){
    if(!this.portal){this.portal=true;this.bombs=[];this.flames=[];this.warning=null;this.float('BATCH COMPLETO',400,255,C.lime);this.beep(1300,.3);this.score+=Math.max(0,Math.floor(100-this.elapsed))*10+150*this.level*(this.build.perks.dca||0);}
    this.clearTimer+=dt;
    if(this.clearTimer>2){this.build.hp=this.players[0].hp;this.build.range=this.players[0].range;if(this.level===5)this.endRun(true);else{this.draft();}return;}
   }
  }else{
   const alive=this.players.filter(p=>p.alive);
   if(alive.length<2){if(alive.length===1)this.wins[alive[0].id]++;this.roundWinner=alive.length?alive[0].id:-1;this.state='round';this.resultAt=this.clock;this.hideUI();releaseKeys();}
  }
 }
 endRun(won){this.clearFloats();this.won=won;this.state='result';this.resultAt=this.clock;this.hideUI();releaseKeys();if(!this.demo&&(!records.length||records.length<10||this.score>records[records.length-1].score)){this.initials=[0,0,0];this.cursor=0;this.needName=true;}else this.needName=false;}
 draft(){this.clearFloats();this.state='upgrade';this.selection=0;this.hideUI();releaseKeys();const available=LOOT.filter(p=>(this.build.perks[p.id]||0)<p.max&&(p.id!=='deck'||this.build.range<5)&&(p.id!=='after'||this.build.capacity<4)&&(p.id!=='completo'||this.build.maxHp<6));this.choices=Phaser.Utils.Array.Shuffle(available.slice()).slice(0,3);}
 takePerk(p){if(!p)return;const b=this.build;b.perks[p.id]=(b.perks[p.id]||0)+1;
  if(p.id==='completo'){b.maxHp=Math.min(6,b.maxHp+1);b.hp=Math.min(b.maxHp,b.hp+1);}if(p.id==='cafe')b.cooldown=Math.max(1.2,b.cooldown-.6);if(p.id==='deck')b.range=Math.min(5,b.range+1);if(p.id==='after')b.capacity=Math.min(4,b.capacity+1);
 }
 synergy(){const p=this.build.perks;return p.cafe&&p.peel?'AFTER OFFICE ANY%':p.dca&&p.propina?'PALTA COMPUESTA':p.deck&&p.after?'BATCH INFINITO':p.notmilk&&p.completo?'NOT HAMBREEE':'BUILD EN PRE-SEED';}
 burst(x,y,c,n){for(let i=0;i<n&&this.fx.length<260;i++){const a=Math.random()*Math.PI*2,s=25+Math.random()*120;this.fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-30,life:.3+Math.random()*.4,max:.7,c});}}
 clearFloats(){for(const o of this.floaters){this.tweens.killTweensOf(o);o.destroy();}this.floaters.clear();}
 float(s,x,y,c){const o=this.add.text(x,y,s,{fontFamily:'Arial',fontSize:'17px',fontStyle:'bold',color:'#'+c.toString(16),stroke:'#080f1c',strokeThickness:4}).setOrigin(.5).setDepth(4);this.floaters.add(o);this.tweens.add({targets:o,y:y-35,alpha:0,duration:1100,onComplete:()=>{this.floaters.delete(o);o.destroy();}});}
 playerColor(e){return e.id===0?FIRMS[this.firm][1]:e.id===1?FIRMS[this.firm2][1]:e.type==='boss'?0xc7a0ff:e.type==='crawler'?C.coral:C.blue;}
 panel(x,y,w,h,c=C.panel,g=this.g){g.fillStyle(c);g.fillRoundedRect(x,y,w,h,12);g.lineStyle(1,C.line);g.strokeRoundedRect(x,y,w,h,12);}
 makeArt(){
  const hex=c=>'#'+c.toString(16).padStart(6,'0');
  const texture=(name,w,h,draw)=>{const t=this.textures.createCanvas(name,w,h);const c=t.context;c.imageSmoothingEnabled=false;draw(c);t.refresh();};
  const skins=['founder','robot','nerd','frog','cow','capy','intern','growth','shark','unicorn'];
  skins.forEach((kind,index)=>{for(let dir=0;dir<3;dir++)for(let f=0;f<4;f++)texture('actor'+index+'-'+dir+'-'+f,32,40,c=>{
   const r=(x,y,w,h,col)=>{c.fillStyle=typeof col==='number'?hex(col):col;c.fillRect(x,y,w,h);},dark='#171323',skin=kind==='frog'||kind==='growth'?'#83ba72':kind==='cow'?'#fff6d7':kind==='capy'?'#b98158':kind==='shark'?'#8cadd1':kind==='unicorn'?'#c8a4e8':'#f3bd97';
   const cloth=index<6?hex(FIRMS[index][1]):kind==='intern'?'#ea9857':kind==='growth'?'#8fe764':kind==='shark'?'#486489':'#b184e0',walk=f%2?1:0;
   r(7,27,18,7,dark);r(7,33+walk,7,5-walk,dark);r(19,34-walk,7,4+walk,dark);r(7,35+walk,8,2,'#e8e3db');r(19,36-walk,8,2,'#e8e3db');
   r(5,19,22,13,dark);r(7,18,18,13,cloth);r(3,22+walk,5,8,dark);r(4,25+walk,3,4,skin);r(25,22-walk,5,8,dark);r(26,25-walk,3,4,skin);
   r(10,27,12,3,'#363044');r(15,21,2,6,'#ffec98');
   if(kind==='shark'||kind==='unicorn'){r(12,21,8,7,'#f3edda');r(15,22,3,8,'#ed587b');r(1,12,5,7,skin);r(27,12,5,7,skin);}
   r(6,6,20,16,dark);r(5,9,22,10,dark);r(7,7,18,13,skin);r(6,10,20,8,skin);
   if(kind==='founder'||kind==='intern'||kind==='nerd'){r(7,5,18,5,dark);r(6,8,5,5,dark);r(21,7,4,5,dark);r(8,3,14,3,kind==='intern'?'#ea9857':dark);}
   if(kind==='founder'){r(9,17,14,4,'#553f35');r(12,17,8,2,skin);r(11,2,12,3,'#ffe167');r(20,0,3,3,'#91c77a');r(23,2,3,3,'#ffe167');r(9,23,5,3,'#eee3ab');}
   if(kind==='robot'){r(4,7,24,16,dark);r(6,8,20,13,'#b9ded9');r(8,10,16,9,'#284047');r(11,13,3,3,'#67f7c4');r(19,13,3,3,'#67f7c4');r(15,4,2,4,'#b9ded9');r(14,2,4,3,'#ffdb6f');r(10,23,12,5,'#314348');}
   if(kind==='frog'||kind==='growth'){r(5,5,8,8,dark);r(19,5,8,8,dark);r(6,6,6,7,skin);r(20,6,6,7,skin);r(8,8,3,3,'#faf5cf');r(21,8,3,3,'#faf5cf');r(10,17,12,2,'#4c7550');r(8,15,3,2,'#dfb28c');}
   if(kind==='cow'){r(3,7,5,8,dark);r(24,7,5,8,dark);r(4,8,4,5,skin);r(25,8,3,5,skin);r(7,3,3,5,'#edc175');r(22,3,3,5,'#edc175');r(8,7,6,5,'#554850');r(10,16,13,5,'#dba7a0');r(12,18,2,2,dark);r(20,18,2,2,dark);r(17,26,5,4,'#554850');}
   if(kind==='capy'){r(5,5,7,7,dark);r(21,5,7,7,dark);r(6,6,5,4,skin);r(22,6,5,4,skin);r(9,14,17,7,'#d3a376');r(21,15,3,2,dark);r(8,4,16,3,'#9f76ca');r(3,11,4,8,'#9f76ca');r(26,11,4,8,'#9f76ca');r(25,19,4,2,dark);}
   if(kind==='shark'){r(13,1,5,6,dark);r(14,2,3,5,skin);r(9,15,15,5,'#faf0da');for(let i=0;i<4;i++)r(10+i*3,15,2,i%2?3:2,dark);}
   if(kind==='unicorn'){r(15,0,4,7,'#ffe167');r(16,0,2,3,'#fff1b8');r(5,4,6,7,'#ec90dc');r(22,5,7,6,'#ec90dc');r(7,18,18,4,'#edb4cf');r(4,9,3,12,'#89529c');}
   if(kind!=='robot'&&dir!==0){
    if(kind==='growth'||kind==='shark'||kind==='frog'||kind==='unicorn'){r(7,10,18,5,dark);r(9,11,5,2,'#8bf1e2');r(18,11,5,2,'#8bf1e2');}
    else if(kind==='nerd'){r(8,10,7,5,dark);r(18,10,7,5,dark);r(15,12,3,1,dark);r(10,11,3,2,'#f7e2c5');r(20,11,3,2,'#f7e2c5');}
    else{r(dir===1?14:10,11,2,3,dark);r(21,11,2,3,dark);r(14,17,4,1,dark);}
   }
   if(dir===0){r(7,8,18,12,kind==='frog'||kind==='cow'||kind==='capy'?skin:cloth);r(10,21,13,10,dark);r(12,22,9,7,'#887153');r(13,25,7,2,cloth);}
   if(dir===1&&kind!=='shark'){r(23,14,5,4,skin);r(25,23,5,6,'#fff0ce');r(26,24,3,2,'#634237');}
   if(kind==='nerd'||kind==='robot'){r(5,25,17,6,dark);r(7,25,13,4,'#9faaba');r(12,26,3,2,cloth);}
   if(kind==='growth'){r(10,22,13,2,'#ffe167');r(15,24,4,4,'#ffe167');r(4,4,24,2,'#29222e');r(2,8,4,9,'#a485d7');r(27,8,3,9,'#a485d7');}
  });});
  const itemNames=['completo','cafe','deck','cash','milk','equity','peel','banana','laptop'];
  itemNames.forEach(name=>texture('item-'+name,32,32,c=>{
   const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};const d='#1b1424';
   if(name==='completo'){r(3,10,26,13,d);r(4,9,24,14,'#d79247');r(6,8,20,3,'#ffe6a1');r(6,12,20,8,'#a44c30');r(6,11,20,5,'#91c85b');r(8,12,3,2,'#e34c57');r(15,13,4,2,'#e34c57');r(23,12,3,2,'#e34c57');for(let i=0;i<5;i++)r(7+i*4,16+i%2,3,2,'#fff7da');}
   if(name==='cafe'){r(6,10,18,17,d);r(7,10,15,15,'#eee5cd');r(9,12,12,3,'#67432f');r(22,13,6,10,d);r(23,15,3,5,'#eee5cd');r(11,17,8,6,'#a8cb59');r(12,4,2,4,'#bfe8da');r(18,2,2,5,'#bfe8da');r(5,27,22,2,'#6c475e');}
   if(name==='deck'||name==='laptop'){r(4,7,24,19,d);r(6,5,21,18,'#d9d3dc');r(8,7,17,13,name==='deck'?'#eb7fb2':'#4e6b77');r(10,10,12,2,'#f9efdb');r(10,14,9,2,'#6e436c');r(8,23,18,2,'#868599');if(name==='laptop')r(3,25,26,3,'#a6a1b2');}
   if(name==='cash'){r(2,8,28,18,d);r(3,9,26,16,'#8bce82');r(6,11,20,12,'#4c966a');r(11,10,10,14,'#a4e49a');r(15,11,2,12,'#3d7854');r(13,12,6,2,'#3d7854');r(13,16,6,2,'#3d7854');r(13,20,6,2,'#3d7854');}
   if(name==='milk'){r(8,4,16,24,d);r(10,3,12,4,'#e0c99c');r(9,8,14,19,'#fff1cd');r(10,11,12,13,'#edce59');r(12,13,2,8,d);r(18,13,2,8,d);r(14,15,2,3,d);r(16,18,2,3,d);}
   if(name==='equity'){c.fillStyle=d;c.beginPath();c.moveTo(16,2);c.lineTo(29,12);c.lineTo(16,29);c.lineTo(3,12);c.fill();c.fillStyle='#bd91ef';c.beginPath();c.moveTo(16,5);c.lineTo(25,12);c.lineTo(16,25);c.lineTo(7,12);c.fill();r(13,9,4,7,'#f2d6ff');}
   if(name==='banana'||name==='peel'){c.strokeStyle=d;c.lineWidth=10;c.beginPath();c.arc(16,7,14,.1,2.8);c.stroke();c.strokeStyle='#ffe17a';c.lineWidth=6;c.beginPath();c.arc(16,6,14,.1,2.8);c.stroke();r(26,5,3,5,'#78ad69');if(name==='peel'){r(12,15,4,12,'#e5b949');r(16,17,5,9,'#ffe98a');}}
  }));
 }
 stamp(texture,x,y,scale=1,depth=2,flip=false){let sprite=this.art[this.artCount];if(!sprite){sprite=this.add.image(0,0,texture);this.art.push(sprite);}this.artCount++;sprite.setTexture(texture).setPosition(x,y).setScale(scale).setDepth(depth).setFlipX(flip).setAlpha(1).setVisible(true);return sprite;}
 item(name,x,y,s=1){this.stamp('item-'+name,x,y,s,2.5);}
 banana(x,y,s=1,c=C.gold){this.stamp('item-banana',x,y,s,1.8);}
 actor(e,now,scale=1,atX,atY){
  if(!e.alive)return;const progress=clamp(1-e.moveT/e.step,0,1),x=atX??OX+(e.px+(e.x-e.px)*progress)*T+T/2,y=atY??OY+(e.py+(e.y-e.py)*progress)*T+T/2;
  const moving=e.moveT>0,frame=moving?Math.floor(now*12)%4:Math.floor(now*2)%2;
  const index=e.id===0?this.firm:e.id===1?this.firm2:e.type==='crawler'?6:e.type==='bot'?7:e.type==='hunter'?8:9;
  const dir=e.dir===0?0:e.dir===2?2:1,s=scale*(e.type==='boss'?1.2:1);
  this.g.fillStyle(0x080915,.5);this.g.fillEllipse(x,y+16*s,28*s,9*s);
  const img=this.stamp('actor'+index+'-'+dir+'-'+frame,x,y-4*s,s,2,e.dir===3);img.setAlpha(e.inv>0&&Math.floor(now*9)%2===0?.5:1);
  if(e.shield>0){this.effects.lineStyle(2,0xb890ed,.8);this.effects.strokeCircle(x,y-3,21);}
  if(e.id<2){this.effects.fillStyle(this.playerColor(e));this.effects.fillTriangle(x-3,y-29*s,x+3,y-29*s,x,y-25*s);}
  if(e.type==='boss'){this.effects.fillStyle(0x21152f);this.effects.fillRect(x-22,y-37,44,5);this.effects.fillStyle(C.coral);this.effects.fillRect(x-22,y-37,44*e.hp/(this.level===5?5:3),5);}
 }
 backdrop(now){
  const g=this.g;g.fillStyle(C.bg);g.fillRect(0,0,W,H);
  g.fillStyle(0x3f294c,.45);g.fillTriangle(-50,290,130,60,300,290);g.fillTriangle(480,300,700,28,880,300);g.fillStyle(0x857385,.12);g.fillTriangle(84,118,130,60,174,118);g.fillTriangle(661,90,700,28,741,90);
  g.fillStyle(0x251d32);for(let i=0;i<15;i++){const x=i*57,h=50+(i*37)%130;g.fillRect(x,600-h,48,h);g.fillStyle(0xe3af72,.12);for(let y=610-h;y<580;y+=18)g.fillRect(x+9,y,5,7);g.fillStyle(0x251d32);}
  g.lineStyle(1,0x896474,.09);for(let y=0;y<H;y+=32)g.lineBetween(0,y,W,y);
  for(let i=0;i<14;i++){const x=(i*137+now*5)%800,y=(i*79)%600;g.fillStyle(C.gold,.1);g.fillRect(x,y,2,2);}
 }
 renderMenu(now){
  const g=this.g;this.text('eyebrow',400,34,'PROVIDENCIA / 03:17 AM / DEPLOY EN VIERNES',12,C.teal);
  this.text('titleShade',403,100,'PLATANAZO',73,0x7c4c73);this.text('title',400,94,'PLATANAZO',73,C.lime);
  this.text('subtitle',400,149,'LEVANTA CAPITAL. BAJA PLÁTANOS.',17,C.gold);
  this.panel(64,179,672,169,0x3a2a43);
  for(let i=0;i<9;i++){const x=88+i*72;g.fillStyle(0x584357);g.fillRect(x,216,52,19);g.fillStyle(0x201e30);g.fillRect(x+7,203,36,23);g.fillStyle(i%2?0x9bc2b3:0x9b829f);g.fillRect(x+10,205,30,13);g.fillStyle(0x795b66);g.fillRect(x+18,235,5,70);}
  g.fillStyle(0x2b2035,.85);g.fillRect(70,238,660,103);
  const fake={id:0,alive:true,inv:0,type:'',dir:2,px:0,py:0,x:0,y:0,moveT:0,step:1};this.actor(fake,now,2.2,179,279);this.actor({...fake,id:1},now,2.2,624,279);
  g.lineStyle(5,C.gold,.6);g.lineBetween(295,270,505,270);g.lineBetween(400,221,400,308);
  for(const x of[310,400,490])this.banana(x,268,1.6);
  this.text('meme1',179,198,'SHIP IT, PO',12,C.lime);this.text('meme2',624,198,'¿Y EL MOAT?',12,C.coral);
  this.text('chainlabel',400,329,'CAFÉ, COMPLETOS Y CERO RUNWAY',12,C.gold);
  this.text('faction',247,373,'P1  ‹ '+FIRMS[this.firm][0]+' ›',19,FIRMS[this.firm][1]);this.text('faction2',553,373,'P2  ‹ '+FIRMS[this.firm2][0]+' ›',19,FIRMS[this.firm2][1]);
  this.text('tagline',400,400,FIRMS[this.firm][2],11,C.muted);
  const opts=['SOLO / RUN ROGUELITE','DUELO / MEJOR DE 3','CÓMO JUGAR','LEADERBOARD'];
  for(let i=0;i<4;i++){const x=i%2?410:90,y=i<2?424:476,active=this.selection===i;this.panel(x,y,300,43,active?0x4c5133:C.panel);this.text('option'+i,x+150,y+22,(active?'▸  ':'')+opts[i],15,active?C.lime:C.ink);}
  this.text('menukeys',400,548,'↑↓ MODO   ·   ←→ PERSONAJE   ·   BOTÓN 1 / ENTER: DALE',12,C.ink);
  this.text('disclaimer',400,575,'Parodia independiente del ecosistema startup. Sin afiliación con las marcas.',10,C.muted);
 }
 drawBoard(now){
  let g=this.g;this.panel(OX-8,OY-8,COLS*T+16,ROWS*T+16,0x221b31);
  const impending=this.nextTide-this.elapsed<3;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
   const px=OX+x*T,py=OY+y*T,t=this.tile(x,y);g.fillStyle((x+y)%2?0x3a3047:0x40364b);g.fillRect(px+1,py+1,T-2,T-2);
   if(t===1){
    g.fillStyle(0x110f1e,.6);g.fillRect(px+4,py+10,T-3,T-8);g.fillStyle(0x645268);g.fillRoundedRect(px+2,py+1,T-6,T-6,4);g.fillStyle(0x9a7e8c);g.fillRect(px+4,py+2,T-10,4);g.fillStyle(0x473951);g.fillRect(px+4,py+29,T-10,6);
    const variant=(x*3+y+this.level)%4;
    if(variant===0){g.fillStyle(0x191c2b);g.fillRect(px+7,py+8,25,19);g.fillStyle(C.teal,.7);g.fillRect(px+10,py+10,19,12);g.fillStyle(0xe5e7c6);g.fillRect(px+12,py+12,10,2);g.fillRect(px+12,py+16,6,2);}
    if(variant===1){g.fillStyle(0xd69d79);g.fillRect(px+13,py+20,15,13);g.fillStyle(0x8fbd71);g.fillTriangle(px+20,py+7,px+7,py+23,px+31,py+20);g.fillStyle(0x598f64);g.fillTriangle(px+19,py+5,px+16,py+27,px+32,py+12);}
    if(variant===2){g.fillStyle(0x292334);g.fillRect(px+9,py+9,23,21);g.fillStyle(C.coral,.7);g.fillRect(px+12,py+12,15,4);g.fillStyle(C.teal,.6);g.fillRect(px+12,py+21,3,3);g.fillStyle(C.gold,.8);g.fillRect(px+22,py+21,3,3);}
    if(variant===3){g.fillStyle(0xaa6d8d);g.fillRect(px+7,py+11,27,17);g.fillStyle(0xd493ac);g.fillRect(px+6,py+11,5,20);g.fillRect(px+29,py+11,5,20);g.fillStyle(0xc58ba5);g.fillRect(px+13,py+13,13,6);}
   }
   if(t===2){g.fillStyle(0x171020,.45);g.fillRect(px+4,py+9,T-5,T-9);g.fillStyle(0xb79262);g.fillRoundedRect(px+3,py+6,T-7,T-10,3);g.fillStyle(0xebcf90);g.fillRect(px+4,py+6,T-9,4);g.fillStyle(0x6c4c42);g.fillRect(px+18,py+10,6,24);g.lineStyle(1,C.gold,.8);g.strokeRect(px+3,py+5,T-7,T-10);this.stamp('item-deck',px+21,py+16,.74,1);}
   if(this.wet(x,y)&&t!==1){g.fillStyle(0x437dce,.55);g.fillRect(px,py,T,T);g.lineStyle(2,C.blue,.5);g.lineBetween(px+5,py+20+Math.sin(now*4+x)*6,px+T-5,py+20+Math.sin(now*4+x+1)*6);}
   if(impending&&!this.wet(x,y)&&(x===this.tide+1||y===this.tide+1||x===COLS-2-this.tide||y===ROWS-2-this.tide)){g.fillStyle(C.coral,.1+.15*(1+Math.sin(now*9)));g.fillRect(px,py,T,T);}
  }
  g=this.effects;
  for(const p of this.peels)this.item('peel',OX+p.x*T+T/2,OY+p.y*T+T/2,.8);
  for(const[x,y]of this.relays){const px=OX+x*T+T/2,py=OY+y*T+T/2;g.fillStyle(C.teal,.1+.05*Math.sin(now*3));g.fillCircle(px,py,18);g.lineStyle(2,C.teal,.8);g.strokeCircle(px,py,11);g.lineBetween(px-15,py,px+15,py);g.lineBetween(px,py-15,px,py+15);g.fillStyle(C.teal);g.fillRect(px-3,py-3,6,6);}
  for(const d of this.drops)if(d.safe<=0){const x=OX+d.x*T+T/2,y=OY+d.y*T+T/2+Math.sin(now*5)*2;g.fillStyle(C.gold,.12);g.fillCircle(x,y,17);this.item(d.type,x,y,.9);}
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
  if(this.mode===1){Object.keys(this.build.perks).slice(0,8).forEach((id,i)=>{this.item(LOOT.find(p=>p.id===id).icon,42,150+i*44,.85);this.text('rank'+i,62,166+i*44,String(this.build.perks[id]),10,C.gold);});this.text('pb',759,150,'PB',10,C.muted);this.text('pbn',759,167,records[0]?String(records[0].score):'---',10,C.gold);}
  this.text('brand',34,26,'PLATANAZO',17,C.lime,'left');
  this.text('zone',400,22,this.mode===1?ZONES[this.level-1]:'DUELO DE STARTUPS / RONDA '+this.round,12,C.muted);
  this.text('score',766,24,this.mode===1?String(this.score).padStart(6,'0'):this.wins[0]+' : '+this.wins[1],23,C.ink,'right');
  const hp=p=>Array.from({length:this.mode===1?this.build.maxHp:3},(_,i)=>p.hp>i?'●':'○').join(' ');
  this.text('p1',85,62,(this.mode===2?'P1 ':'')+FIRMS[this.firm][0]+'   '+hp(p),15,FIRMS[this.firm][1],'left');
  this.text('p2',715,62,this.mode===2?'P2 '+FIRMS[this.firm2][0]+'  '+hp(this.players[1]):'BOTS '+this.enemies.filter(e=>e.alive).length+'   /   BATCH '+this.level+'/5',15,this.mode===2?FIRMS[this.firm2][1]:C.ink,'right');
  const remaining=Math.max(0,Math.ceil(this.nextTide-this.elapsed));this.text('tide',400,62,this.elapsed<4?'EL MVP ESTÁ EN PROD, PO':'RUNWAY ↓ '+remaining+'s',12,remaining<4?C.coral:C.blue);
  const mult=this.clock<this.comboUntil?Math.min(5,1+Math.floor(this.combo/3)):1;
  this.text('bottom',85,571,this.mode===1?'COMBO ×'+mult+'   /   CADENAS '+this.stats.chains:'P1: WASD + U / I',12,C.ink,'left');
  this.text('action',715,571,this.mode===2?'P2: FLECHAS + R / T':'① PLÁTANO   ② PIVOT '+(p.dash>0?p.dash.toFixed(1)+'s':'LISTA'),12,C.muted,'right');
  if(this.mode===1){this.g.fillStyle(C.line);this.g.fillRoundedRect(320,565,150,8,4);this.g.fillStyle(C.teal);this.g.fillRoundedRect(320,565,Math.max(2,150*(this.overclock>0?this.overclock/8:this.charge/100)),8,4);this.text('charge',395,586,this.overclock>0?'CRUNCH '+this.overclock.toFixed(1)+'s':'CAFÉ + LUCAS → CRUNCH',9,C.teal);}
  if(this.ready>0){this.panel(185,218,430,160,C.panel,this.effects);this.text('ready',400,250,this.mode===2?'DUELO DE STARTUPS':'BATCH '+this.level+' / 5',26,C.lime);this.text('ready2',400,291,'① PLÁTANO    ② PIVOT / ESQUIVA',16,C.ink);this.text('ready3',400,329,Math.ceil(this.ready)===1?'¡SHIP IT, PO!':this.mode===1?'4 VIDAS + 1 PIVOT GRATIS · DALE TRANQUI':'3 VIDAS CADA UNO · SIN VENTAJAS DE BUILD',13,C.gold);}else for(const id of['ready','ready2','ready3'])if(this.texts[id])this.texts[id].setVisible(false);
  if(this.demo){this.text('demo',400,535,'DEMO AUTOMÁTICA · CUALQUIER BOTÓN PARA JUGAR',13,C.lime);}
 }
 overlay(now){
  const g=this.g;g.fillStyle(C.bg,.96);g.fillRect(35,30,730,540);this.panel(49,44,702,512);
  if(this.state==='help'){
   this.text('h0',400,91,'SIN RUNWAY, PERO CON PALTA',29,C.lime);
   const lines=[['01 / PLATANAZO','Botón 1: planta un plátano. Explota en 2 segundos.'],['02 / PIVOT','Botón 2: esquiva dos casillas. Cruza fuego con escudo.'],['03 / COWORK HACK','Los enchufes turquesa retransmiten el boom en cruz.'],['04 / POWER-UPS','Italiano: vida. Café: recarga. Lucas: puntos y crunch.'],['05 / RUN ROGUELITE','Elige 1 de 3 objetos entre batches. Combina sus efectos.'],['06 / SEGUNDA OPORTUNIDAD','Solo: 4 vidas y un pivot gratis si te piteas.'],['07 / DUELO','Mejor de 3. Arena simétrica, sin ventajas roguelite.']];
   lines.forEach(([a,b],i)=>{this.text('ha'+i,86,140+i*44,a,13,i%2?C.gold:C.teal,'left');this.text('hb'+i,86,160+i*44,b,13,C.ink,'left');});
   this.text('hk',400,485,'P1 WASD + U / I    ·    P2 FLECHAS + R / T',13,C.muted);this.text('back',400,523,'BOTÓN 1 / START: VOLVER',14,C.lime);
  }else if(this.state==='records'){
   this.text('rh',400,105,'HALL DEL COWORK',32,C.lime);this.text('rs',400,148,'TOP 10 · SOLO · ESTE NAVEGADOR / GABINETE',12,C.muted);
   this.text('rh2',95,174,'#    DEV',12,C.muted,'left');this.text('rh3',450,174,'LUCAS',12,C.muted,'right');this.text('rh4',530,174,'BATCH',12,C.muted);this.text('rh5',640,174,'BUILD',12,C.muted);
   for(let i=0;i<10;i++){const r=records[i],y=207+i*27;this.text('rn'+i,94,y,String(i+1).padStart(2,'0'),13,i===0?C.gold:C.muted,'left');this.text('r'+i,150,y,r?r.name:'---',16,C.ink,'left');this.text('rp'+i,450,y,r?String(r.score).padStart(6,'0'):'------',16,i===0?C.gold:C.ink,'right');this.text('rl'+i,530,y,r?(r.won?'★':r.level+'/5'):'-',13,C.muted);if(r)r.build.slice(0,3).forEach((id,n)=>this.item(LOOT.find(p=>p.id===id).icon,609+n*25,y,.65));}
   this.text('back',400,515,'BOTÓN 1 / START: VOLVER',14,C.lime);
  }else if(this.state==='upgrade'){
   this.text('uh',400,100,'BATCH LISTO, CRACK',37,C.lime);this.text('us',400,148,'ELIGE TU PRÓXIMA MALA DECISIÓN · BUILD NUEVA EN CADA RUN',12,C.muted);
   this.choices.forEach((a,i)=>{const x=78+i*219,active=i===this.selection;this.panel(x,201,206,230,active?0x514236:C.panel);this.item(a.icon,x+103,260,1.8);this.text('ur'+i,x+103,218,a.max===1?'RELIQUIA DEL COWORK':'MEJORA '+((this.build.perks[a.id]||0)+1)+'/'+a.max,10,active?C.gold:C.muted);this.text('u'+i,x+103,312,a.name,15,active?C.lime:C.ink);this.text('ud'+i,x+103,351,a.desc,13,C.ink).setWordWrapWidth(178);this.text('ut'+i,x+103,403,a.tag,9,C.gold);});
   this.text('uk',400,470,'←→ ELIGE  ·  ① CONFIRMA  ·  ② REROLL ('+this.rerolls+')',14,C.lime);this.text('uf',400,505,this.synergy()+'  /  VIDA '+this.build.hp+'/'+this.build.maxHp,13,C.muted);
  }else if(this.state==='round'){
   const winner=this.wins.some(n=>n>=2);this.text('dh',400,142,winner?'¡STARTUP UNICORNIO!':'RONDA TERMINADA',35,C.lime);this.text('dw',400,211,this.roundWinner<0?'EMPATE / AMBOS OFFLINE':'GANA '+(this.roundWinner===0?FIRMS[this.firm][0]:FIRMS[this.firm2][0]),23,this.roundWinner===0?FIRMS[this.firm][1]:FIRMS[this.firm2][1]);this.text('ds',400,300,this.wins[0]+'   :   '+this.wins[1],80,C.ink);this.text('dk',400,432,winner?'BOTÓN 1: REVANCHA  ·  START: MENÚ':'BOTÓN 1 / START: SIGUIENTE RONDA',14,C.lime);this.text('df',400,487,'MEJOR DE 3 · ARENA SIMÉTRICA · MISMAS MEJORAS',12,C.muted);
  }else{
   this.text('eh',400,100,this.won?'UNICORNIO CON PALTA':'SE ACABÓ EL RUNWAY',33,this.won?C.lime:C.coral);this.text('es',400,174,String(this.score).padStart(6,'0'),64,C.ink);this.text('est',400,234,'BATCH '+this.level+'/5   ·   '+this.stats.bots+' BOTS   ·   '+this.stats.chains+' CADENAS',14,C.muted);
   if(this.needName){this.text('nameh',400,295,'FIRMA TU RUN',17,C.gold);for(let i=0;i<3;i++){this.panel(293+i*75,327,64,72,i===this.cursor?0x304332:C.panel);this.text('letter'+i,325+i*75,362,String.fromCharCode(65+this.initials[i]),38,i===this.cursor?C.lime:C.ink);}this.text('namekeys',400,429,'↑↓ LETRA  ·  ←→ POSICIÓN  ·  BOTÓN 1 GUARDA',13,C.ink);}
   else {this.text('endmsg',400,329,this.won?'LE METISTE PALTA AL ECOSISTEMA.':'ERA UN MVP. TRANQUI. DALE OTRA RUN.',17,C.gold);this.text('endkeys',400,410,'BOTÓN 1: REINTENTAR   ·   START: MENÚ',14,C.lime);}
   this.text('endfoot',400,500,this.savedStatus||this.synergy(),11,C.muted);
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
   this.takePerk(this.choices[this.selection]);
   this.level++;this.startRound();return;
  }
  if(this.clock-this.resultAt<.65)return;
  if(this.state==='round'){if(this.wins.some(n=>n>=2))this.begin(2);else{this.round++;this.startRound();}return;}
  if(this.state==='result'){if(this.needName){saveRecord(this.initials.map(n=>String.fromCharCode(65+n)).join(''),this.score,this.level,Object.keys(this.build.perks),this.won).then(ok=>{this.savedStatus=ok?'GUARDADO EN ESTE NAVEGADOR / GABINETE':'RÉCORD DE ESTA SESIÓN · ALMACENAMIENTO NO DISPONIBLE';});this.needName=false;this.hideUI();}else this.begin(1);}
 }
 update(time,delta){
  const dt=Math.min(.05,delta/1000);this.clock+=dt;this.hideUI();for(const img of this.art)img.setVisible(false);this.artCount=0;this.g.clear();this.effects.clear();this.backdrop(this.clock);
  const any=Object.keys(pressed).some(k=>pressed[k]);if(any){this.unlock();this.lastInput=this.clock;}
  if(this.demo&&any){this.menu();for(const k in pressed)delete pressed[k];return;}
  if(pressed.P1_6||pressed.P2_6){soundOn=!soundOn;}
  if(this.state==='play'){
   if((pressed.START1||pressed.START2)&&this.ready<=0&&!this.demo){this.paused=!this.paused;releaseKeys();}
   if(!this.paused)this.tick(dt);
   this.drawBoard(this.clock);this.drawHUD();
   if(this.paused){this.panel(190,220,420,150,C.panel,this.effects);this.text('pause',400,267,'PAUSA',34,C.lime);this.text('pausek',400,320,'START: CONTINUAR  ·  BOTÓN 3: MENÚ',13,C.ink);if(pressed.P1_3||pressed.P2_3){this.paused=false;this.menu();}}else for(const id of['pause','pausek'])if(this.texts[id])this.texts[id].setVisible(false);
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
    if((pressed.P1_2||pressed.P2_2)&&this.rerolls>0){this.rerolls--;this.draft();}
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
new Phaser.Game({type:Phaser.AUTO,width:W,height:H,parent:'game-root',backgroundColor:'#191525',render:{antialias:false,roundPixels:true},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[Arena],audio:{disableWebAudio:false}});
})();
