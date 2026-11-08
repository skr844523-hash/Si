import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const LANES=[-2.25,0,2.25];
const themes=[
 {name:'المدينة الحديثة',sky:'#8bd7ff',ground:'#34465e',accent:'#20d9b4'},
 {name:'سكة الصحراء',sky:'#ffc27c',ground:'#9a6840',accent:'#ffcf5a'},
 {name:'الغابة الاستوائية',sky:'#8de6b0',ground:'#315c48',accent:'#79ed91'},
 {name:'مدينة النيون',sky:'#21194f',ground:'#211e3b',accent:'#ff4edb'}
];
function Block({position,scale,color,round=0.08}) {
 return <mesh position={position} castShadow receiveShadow><boxGeometry args={scale}/><meshStandardMaterial color={color} roughness={round}/></mesh>;
}
function Coin({position}) {
 const ref=useRef();
 useFrame((_,d)=>{if(ref.current)ref.current.rotation.y+=d*5});
 return <mesh ref={ref} position={position} castShadow><cylinderGeometry args={[.34,.34,.09,24]}/><meshStandardMaterial color="#ffd83d" metalness={.8} roughness={.22}/></mesh>;
}
function Runner({lane,jump,slide,theme}) {
 const group=useRef();
 useFrame((s)=>{if(!group.current)return; group.current.position.x=THREE.MathUtils.damp(group.current.position.x,LANES[lane],12,1/60);group.current.position.y=jump?Math.max(0,Math.sin(s.clock.elapsedTime*8)*1.35):0;group.current.scale.y=slide?.58:1;});
 return <group ref={group} position={[LANES[lane],0,2]}>
  <mesh position={[0,.93,0]} castShadow><capsuleGeometry args={[.34,.8,5,10]}/><meshStandardMaterial color={theme===3?'#ff4edb':'#13bfa8'}/></mesh>
  <mesh position={[0,1.72,0]} castShadow><sphereGeometry args={[.34,20,16]}/><meshStandardMaterial color="#d99b6c"/></mesh>
  <mesh position={[0,1.78,.29]}><boxGeometry args={[.42,.12,.12]}/><meshStandardMaterial color="#17233b"/></mesh>
  <mesh position={[-.43,.35,0]} rotation={[0,0,-.2]}><capsuleGeometry args={[.12,.58,4,8]}/><meshStandardMaterial color="#f0b27e"/></mesh>
  <mesh position={[.43,.35,0]} rotation={[0,0,.2]}><capsuleGeometry args={[.12,.58,4,8]}/><meshStandardMaterial color="#f0b27e"/></mesh>
  <Block position={[-.19,-.28,0]} scale={[.22,.55,.27]} color="#243d73"/><Block position={[.19,-.28,0]} scale={[.22,.55,.27]} color="#243d73"/>
 </group>;
}
function World({game,theme,lane,jump,slide,onHit,onCoin,onPower,activePower}) {
 const [items,setItems]=useState([]);
 const speed=useRef(13); const spawn=useRef(0); const next=useRef(0);
 const objects=useRef([]);
 useEffect(()=>{setItems([]);objects.current=[];speed.current=13;spawn.current=0;},[game]);
 useFrame((state,dt)=>{
  if(game!=='playing')return;
  speed.current=Math.min(26,speed.current+dt*.2);
  spawn.current+=dt;
  if(spawn.current>Math.max(.52,1.28-(speed.current-13)*.032)){
   spawn.current=0;
   const l=Math.floor(Math.random()*3),z=-78,id=next.current++;
   const roll=Math.random();
   let type=roll<.49?'coin':roll<.62?'power':roll<.83?'barrier':'train';
   if(type==='coin') objects.current.push(...Array.from({length:6},(_,i)=>({id:id+i*.001,type,lane:l,z:z-i*2.15,hit:false})));
   else objects.current.push({id,type,lane:l,z,hit:false,power:['magnet','sneakers','jetpack','multiplier','shield'][Math.floor(Math.random()*5)]});
  }
  const speedFactor=activePower==='jetpack'?1.05:1;
  objects.current=objects.current.map(o=>({...o,z:o.z+speed.current*dt*speedFactor})).filter(o=>o.z<9);
  for(const o of objects.current){
   if(o.hit||o.z<1.15||o.z>3.15)continue;
   const near=activePower==='magnet'&&o.type==='coin'&&Math.abs(o.lane-lane)<=1;
   if(o.type==='coin'&&(o.lane===lane||near)){o.hit=true;onCoin(activePower==='multiplier'?2:1);}
   else if(o.type==='power'&&o.lane===lane){o.hit=true;onPower(o.power);}
   else if((o.type==='barrier'||o.type==='train')&&o.lane===lane){
    const avoided=(o.type==='barrier'&&(jump||slide))||(o.type==='train'&&activePower==='jetpack');
    if(!avoided){o.hit=true;onHit();}
   }
  }
  setItems(objects.current.filter(o=>!o.hit));
 });
 return <group>
  <color attach="background" args={[themes[theme].sky]}/>
  <fog attach="fog" args={[themes[theme].sky,28,105]}/>
  <ambientLight intensity={.85}/><directionalLight position={[8,15,8]} intensity={2.1} castShadow shadow-mapSize={[1024,1024]}/>
  <Block position={[0,-.48,-34]} scale={[9,.5,100]} color={themes[theme].ground}/>
  {LANES.map((x,i)=><group key={i}><Block position={[x,-.16,-34]} scale={[.12,.12,100]} color="#b7c7d8"/><Block position={[x-.58,-.2,-34]} scale={[.12,.18,100]} color="#65758b"/><Block position={[x+.58,-.2,-34]} scale={[.12,.18,100]} color="#65758b"/></group>)}
  {Array.from({length:18},(_,i)=><group key={i} position={[0,0,-i*6-4]}>
    <Block position={[-6,2,-1]} scale={[2.2,5,4]} color={i%2?'#6c87a8':'#91a8c2'}/>
    <Block position={[6,2,-1]} scale={[2.2,5,4]} color={i%2?'#8ca4c1':'#627e9f'}/>
    <Block position={[-6,4.8,-1]} scale={[2.3,.18,4.1]} color={themes[theme].accent}/>
    <Block position={[6,4.8,-1]} scale={[2.3,.18,4.1]} color={themes[theme].accent}/>
  </group>)}
  {items.map(o=>o.type==='coin'?<Coin key={o.id} position={[LANES[o.lane],1.15,o.z]}/>:o.type==='power'?
   <group key={o.id} position={[LANES[o.lane],1.25,o.z]}><mesh><icosahedronGeometry args={[.48,1]}/><meshStandardMaterial color={{magnet:'#ff5a9e',sneakers:'#7be7ff',jetpack:'#ffb52e',multiplier:'#b58cff',shield:'#66f2bd'}[o.power]} emissive="#ffffff" emissiveIntensity={.18}/></mesh></group>:
   o.type==='barrier'?<group key={o.id} position={[LANES[o.lane],0,o.z]}><Block position={[0,.48,0]} scale={[1.35,.9,.55]} color="#f18b32"/><Block position={[0,.95,0]} scale={[1.45,.13,.62]} color="#ffe7bd"/></group>:
   <group key={o.id} position={[LANES[o.lane],0,o.z]}><Block position={[0,1.8,0]} scale={[1.8,3.6,5.5]} color="#db5268"/><Block position={[0,1.8,2.8]} scale={[1.6,2.5,.12]} color="#283a57"/></group>)}
  <Runner lane={lane} jump={jump} slide={slide} theme={theme}/>
  <Sparkles count={theme===3?80:25} scale={[12,5,80]} size={2} speed={.25} opacity={.45}/>
 </group>;
}
export default function App(){
 const [screen,setScreen]=useState('menu'),[lane,setLane]=useState(1),[jump,setJump]=useState(false),[slide,setSlide]=useState(false);
 const [coins,setCoins]=useState(()=>Number(localStorage.getItem('sasaCoins')||0));
 const [best,setBest]=useState(()=>Number(localStorage.getItem('sasaBest')||0));
 const [score,setScore]=useState(0),[theme,setTheme]=useState(0),[character,setCharacter]=useState(0),[power,setPower]=useState('');
 const [muted,setMuted]=useState(false),[missionClaimed,setMissionClaimed]=useState(()=>localStorage.getItem('sasaMission')==='yes'),[runCoins,setRunCoins]=useState(0),[powerLeft,setPowerLeft]=useState(0);
 const start=()=>{setScore(0);setRunCoins(0);setLane(1);setJump(false);setSlide(false);setPower('');setPowerLeft(0);setScreen('playing')};
 const powerLabels={magnet:'مغناطيس العملات',sneakers:'حذاء القفز',jetpack:'Jetpack',multiplier:'مضاعف العملات',shield:'درع الحماية'};
 const activatePower=(kind)=>{setPower(kind);setPowerLeft(8);window.clearTimeout(window.__sasaPowerTimer);window.__sasaPowerTimer=window.setTimeout(()=>{setPower('');setPowerLeft(0)},8000);};
 const collect=(amount=1)=>{setRunCoins(v=>v+amount);setCoins(c=>{const n=c+amount;localStorage.setItem('sasaCoins',n);return n})};
 
 const hit=()=>{if(power==='shield'){setPower('');setPowerLeft(0);window.clearTimeout(window.__sasaPowerTimer);return;}setBest(b=>{const n=Math.max(b,score);localStorage.setItem('sasaBest',n);return n});setScreen('over')};
 useEffect(()=>{if(screen!=='playing')return;let t=setInterval(()=>setScore(s=>s+1),120);return()=>clearInterval(t)},[screen]);
 useEffect(()=>{if(!power||screen!=='playing')return;const t=setInterval(()=>setPowerLeft(v=>Math.max(0,v-1)),1000);return()=>clearInterval(t)},[power,screen]);
 const act=(dir)=>{if(screen!=='playing')return;if(dir==='left')setLane(v=>Math.max(0,v-1));if(dir==='right')setLane(v=>Math.min(2,v+1));if(dir==='up'){setJump(true);setTimeout(()=>setJump(false),650)}if(dir==='down'){setSlide(true);setTimeout(()=>setSlide(false),650)}};
 const touch=useRef(null);
 useEffect(()=>{const key=e=>{if(e.key==='ArrowLeft')act('left');if(e.key==='ArrowRight')act('right');if(e.key==='ArrowUp'||e.key===' ')act('up');if(e.key==='ArrowDown')act('down');if(e.key==='Escape'&&screen==='playing')setScreen('paused')};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[screen,lane]);
 const buy=(id,cost)=>{if(coins<cost)return;setCoins(c=>{let n=c-cost;localStorage.setItem('sasaCoins',n);return n});setCharacter(id)};
 return <main onTouchStart={e=>touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY}} onTouchEnd={e=>{if(!touch.current)return;let dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;if(Math.max(Math.abs(dx),Math.abs(dy))>25)act(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy<0?'up':'down'));touch.current=null}}>
  <div className="game"><Canvas shadows dpr={[1,1.5]} gl={{antialias:false,powerPreference:'high-performance'}}><PerspectiveCamera makeDefault position={[0,5.1,10.5]} fov={58}/><Suspense fallback={null}><World game={screen} theme={theme} lane={lane} jump={jump||power==='sneakers'} slide={slide} onHit={hit} onCoin={collect} onPower={activatePower} activePower={power}/><Environment preset="city"/></Suspense></Canvas>
   {screen==='playing'&&<><div className="hud"><span>🪙 {coins}</span><span>المسافة <b>{score}م</b></span><span>🏆 {best}</span></div>{power&&<div className="power-tag">⚡ {powerLabels[power]} · {powerLeft}ث</div>}<button className="pause" onClick={()=>setScreen('paused')}>Ⅱ</button><div className="hint">اسحب للتحرك • ↑ قفز • ↓ انزلاق</div></>}
   {screen!=='playing'&&<div className="overlay"><div className="panel"><div className="brand">SASA <em>RUN</em></div><div className="sub">RUN • DODGE • COLLECT</div>
    {screen==='menu'&&<><p>انطلق في مغامرة لا نهائية وسط المدينة!</p><div className="stats"><span>🪙 {coins} عملة</span><span>🏆 أفضل نتيجة {best}</span></div><button className="primary" onClick={start}>ابدأ اللعب ▶</button><div className="actions"><button onClick={()=>setScreen('shop')}>الشخصيات</button><button onClick={()=>setScreen('worlds')}>العوالم</button><button onClick={()=>setScreen('settings')}>الإعدادات</button><button onClick={()=>setScreen('missions')}>المهام</button></div></>}
    {screen==='over'&&<><h2>انتهت الجولة!</h2><div className="score">{score}</div><p>المسافة التي قطعتها</p><button className="primary" onClick={start}>العب مرة أخرى ↻</button><button className="secondary" onClick={()=>setScreen('menu')}>القائمة الرئيسية</button></>}
    {screen==='paused'&&<><h2>اللعبة متوقفة</h2><button className="primary" onClick={()=>setScreen('playing')}>متابعة</button><button className="secondary" onClick={start}>إعادة اللعب</button><button className="secondary" onClick={()=>setScreen('menu')}>القائمة الرئيسية</button></>}
    {screen==='shop'&&<><h2>اختار شخصيتك</h2><div className="characters">{['SASA','NOVA','ZIZO'].map((n,i)=><button className={character===i?'chosen':''} onClick={()=>i===0||character===i?setCharacter(i):buy(i,100+i*50)} key={n}><span className="avatar">{['🧢','🕶️','⚡'][i]}</span>{n}<small>{i===0?'مجاناً':character===i?'محدد':`${100+i*50} 🪙`}</small></button>)}</div><button className="secondary" onClick={()=>setScreen('menu')}>رجوع</button></>}
    {screen==='worlds'&&<><h2>اختر العالم</h2><div className="worlds">{themes.map((t,i)=><button style={{borderColor:t.accent}} onClick={()=>setTheme(i)} key={t.name}>{t.name}{theme===i?' ✓':''}</button>)}</div><button className="secondary" onClick={()=>setScreen('menu')}>رجوع</button></>}
    {screen==='missions'&&<><h2>المهام اليومية</h2><div className="mission"><b>جامع العملات</b><p>اجمع 25 عملة في جولة واحدة</p><div className="progress"><i style={{width:Math.min(100,runCoins/25*100)+'%'}}/></div><small>{Math.min(runCoins,25)} / 25</small></div><button className="primary" disabled={runCoins<25||missionClaimed} onClick={()=>{setMissionClaimed(true);localStorage.setItem('sasaMission','yes');collect(50)}}>{missionClaimed?'تم استلام المكافأة':'استلام 50 عملة'}</button><button className="secondary" onClick={()=>setScreen('menu')}>رجوع</button></>}
    {screen==='settings'&&<><h2>الإعدادات</h2><button className="secondary" onClick={()=>setMuted(!muted)}>الصوت: {muted?'مغلق':'مفتوح'}</button><p className="small">تحكم بالسحب على الشاشة. أفضل نتيجة والعملات تُحفظان على جهازك.</p><button className="secondary" onClick={()=>setScreen('menu')}>رجوع</button></>}
   </div></div>}
  </div>
 </main>
}