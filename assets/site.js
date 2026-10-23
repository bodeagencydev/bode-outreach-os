document.addEventListener('DOMContentLoaded',()=>{const toggle=document.querySelector('.menu-toggle'),links=document.querySelector('.nav-links');if(toggle&&links){toggle.addEventListener('click',()=>{const open=links.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu');toggle.textContent=open?'×':'☰'});links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{links.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰'}))}document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear())});
/* Lightweight generative motion graphic and progressive reveal. */
document.addEventListener('DOMContentLoaded',()=>{
 const canvas=document.getElementById('signal-canvas');
 if(canvas){
  const ctx=canvas.getContext('2d',{alpha:true});
  const host=canvas.parentElement;
  let width=0,height=0,dpr=1,raf=0,frame=0;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const points=Array.from({length:52},(_,i)=>({seed:i,angle:Math.random()*Math.PI*2,r:.12+Math.random()*.42,speed:(Math.random()*.0008+.00018)*(i%2?1:-1),size:Math.random()*1.6+.35,orbit:.16+Math.random()*.34}));
  function resize(){
   const rect=host.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,1.7);
   width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
   canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function draw(){
   frame+=reduced?0:.008;ctx.clearRect(0,0,width,height);
   const cx=width*.5,cy=height*.5,scale=Math.min(width,height);
   const glow=ctx.createRadialGradient(cx,cy,2,cx,cy,scale*.43);
   glow.addColorStop(0,'rgba(201,255,74,.08)');glow.addColorStop(1,'rgba(201,255,74,0)');
   ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
   ctx.lineWidth=.65;
   points.forEach((p,i)=>{
    const a=p.angle+frame*p.speed*150;
    const x=cx+Math.cos(a)*scale*p.orbit;
    const y=cy+Math.sin(a)*scale*p.orbit*.58;
    const pulse=.55+.45*Math.sin(frame*2+p.seed);
    ctx.beginPath();ctx.arc(x,y,p.size*(.6+pulse*.5),0,Math.PI*2);
    ctx.fillStyle=i%7===0?'rgba(167,149,255,.8)':'rgba(201,255,74,'+(.25+pulse*.58)+')';ctx.fill();
    if(i%3===0){
     const tx=cx+Math.cos(a+.16)*scale*p.orbit*.72,ty=cy+Math.sin(a+.16)*scale*p.orbit*.42;
     ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.strokeStyle='rgba(201,255,74,.11)';ctx.stroke();
    }
   });
   ctx.beginPath();ctx.ellipse(cx,cy,scale*.32,scale*.14,-.34,0,Math.PI*2);
   ctx.strokeStyle='rgba(201,255,74,.22)';ctx.lineWidth=1;ctx.stroke();
   if(!reduced&&!document.hidden)raf=requestAnimationFrame(draw);
  }
  resize();draw();
  window.addEventListener('resize',()=>{cancelAnimationFrame(raf);resize();draw()},{passive:true});
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden)draw()});
 }
 const targets=document.querySelectorAll('.service-card,.project,.step,.service-detail,.contact-card,.showcase-card,.section-head,.callout,.about-grid');
 if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('reveal-on-scroll','is-visible');observer.unobserve(entry.target)}}),{threshold:.12});
  targets.forEach(el=>observer.observe(el));
 }
});

/* Cinematic generative canvas system. */
document.addEventListener('DOMContentLoaded',()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function mount(id,mode){const canvas=document.getElementById(id);if(!canvas)return;const ctx=canvas.getContext('2d',{alpha:true}),host=canvas.parentElement;let w=0,h=0,dpr=1,raf=0,t=0,visible=true;const count=mode==='hero'?115:88;const dots=Array.from({length:count},(_,i)=>({a:Math.random()*6.28,r:.08+Math.random()*.43,s:.12+Math.random()*.62,size:.3+Math.random()*1.7,phase:Math.random()*6.28,kind:i%9}));function resize(){const b=host.getBoundingClientRect();w=b.width;h=b.height;dpr=Math.min(devicePixelRatio||1,1.6);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}function draw(){t+=reduced?0:.008;ctx.clearRect(0,0,w,h);const u=Math.min(w,h),cx=w*.5,cy=h*(mode==='hero'?.46:.45);const g=ctx.createRadialGradient(cx,cy,0,cx,cy,u*.53);g.addColorStop(0,'rgba(201,255,74,.14)');g.addColorStop(.4,'rgba(167,149,255,.035)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);for(let k=0;k<5;k++){ctx.beginPath();ctx.ellipse(cx,cy,u*(.15+k*.065),u*(.055+k*.025),-.42+k*.18+t*.018*(k%2?1:-1),0,6.283);ctx.strokeStyle=k%2?'rgba(167,149,255,.23)':'rgba(201,255,74,'+(.12+k*.025)+')';ctx.lineWidth=k===2?1.15:.65;ctx.stroke()}const pts=dots.map((p,i)=>{const a=p.a+t*p.s*(mode==='hero'?.34:.26)*(i%2?1:-1),z=.58+.42*Math.sin(a*1.7+p.phase);return{x:cx+Math.cos(a)*u*p.r*z,y:cy+Math.sin(a*1.12)*u*p.r*.72,p,i,z}});pts.forEach((q,i)=>{pts.filter((o,j)=>j!==i).map(o=>({...o,d:Math.hypot(q.x-o.x,q.y-o.y)})).filter(o=>o.d<u*.17).sort((a,b)=>a.d-b.d).slice(0,2).forEach(o=>{ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(o.x,o.y);ctx.strokeStyle='rgba(201,255,74,.075)';ctx.lineWidth=.6;ctx.stroke()})});pts.forEach(({x,y,p,z})=>{const pulse=.4+.6*(.5+.5*Math.sin(t*2+p.phase));ctx.beginPath();ctx.arc(x,y,p.size*(.7+pulse)*z,0,6.283);ctx.fillStyle=p.kind===0?'rgba(167,149,255,.9)':'rgba(201,255,74,'+(.24+pulse*.68)+')';ctx.fill()});for(let j=0;j<3;j++){const phase=(t*(.13+j*.035)+j*.36)%1,y=h*(.18+j*.28)+Math.sin(t+j)*h*.05,x=-w*.2+phase*w*1.4,grad=ctx.createLinearGradient(x-u*.12,y,x+u*.12,y);grad.addColorStop(0,'rgba(201,255,74,0)');grad.addColorStop(.5,'rgba(201,255,74,'+(.12+j*.035)+')');grad.addColorStop(1,'rgba(201,255,74,0)');ctx.strokeStyle=grad;ctx.lineWidth=j===1?1.2:.7;ctx.beginPath();ctx.moveTo(x-u*.12,y);ctx.lineTo(x+u*.12,y);ctx.stroke()}if(!reduced&&visible&&!document.hidden)raf=requestAnimationFrame(draw)}resize();draw();addEventListener('resize',()=>{cancelAnimationFrame(raf);resize();draw()},{passive:true});const io=new IntersectionObserver(e=>{visible=e[0].isIntersecting;cancelAnimationFrame(raf);if(visible)draw()},{threshold:.01});io.observe(host)}
 mount('hero-motion','hero');mount('reel-motion','reel');
 const reveal=document.querySelectorAll('.service-card,.project,.step,.service-detail,.contact-card,.showcase-card,.section-head,.callout,.about-grid,.reel-lab-grid');if('IntersectionObserver'in window&&!reduced){const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('reveal-on-scroll','is-visible');o.unobserve(e.target)}}),{threshold:.12});reveal.forEach(el=>o.observe(el))}
});

/* Creative brief builder: progressive steps and a reviewed email handoff. */
document.addEventListener('DOMContentLoaded',()=>{
 const form=document.getElementById('creative-brief');if(!form)return;
 const panels=[...form.querySelectorAll('.brief-panel')],bar=document.getElementById('brief-progress-bar'),label=document.getElementById('brief-progress-label'),result=document.getElementById('brief-result');let step=1;
 const labels=['The basics','Visual direction','Your idea'];
 function show(n){step=n;panels.forEach(p=>p.classList.toggle('active',Number(p.dataset.panel)===n));bar.style.width=(n/3*100)+'%';label.textContent='Step '+n+' of 3 · '+labels[n-1];document.querySelector('.brief-aside')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
 function validatePanel(n){const panel=panels.find(p=>Number(p.dataset.panel)===n);for(const el of panel.querySelectorAll('input[required],textarea[required],select[required]')){if(!el.checkValidity()){el.reportValidity();el.focus();return false;}}return true;}
 form.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>{if(validatePanel(step))show(Math.min(3,step+1));}));
 form.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>show(Math.max(1,step-1))));
 form.addEventListener('submit',e=>{e.preventDefault();if(!validatePanel(3))return;const fd=new FormData(form),get=k=>(fd.get(k)||'Not specified').toString(),all=k=>fd.getAll(k).join(', ')||'Not specified';const subject='Creative project brief — '+get('brand')+' — '+get('deliverable');const body=[
'NEW CREATIVE PROJECT BRIEF — BODE AI AD LAB','',
'CONTACT','Name: '+get('name'),'Email: '+get('email'),'Brand: '+get('brand'),'Website / social: '+get('brandLink'),'',
'WHAT TO CREATE','Deliverable: '+get('deliverable'),'Platforms: '+all('platform'),'Goal: '+get('goal'),'',
'VISUAL DIRECTION','Style: '+get('style'),'Motion ideas: '+all('motion'),'Length: '+get('duration'),'Format: '+get('format'),'',
'THE IDEA','Project idea: '+get('idea'),'Deadline: '+get('deadline'),'References: '+get('references'),'Keep / avoid: '+get('notes'),'',
'Sent from the Bode AI Ad Lab creative brief portal.'
].join('\n');const mail='mailto:budyagencyofficial@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);document.getElementById('brief-email-link').href=mail;panels.forEach(p=>p.hidden=true);result.hidden=false;result.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});});
 document.getElementById('edit-brief')?.addEventListener('click',()=>{result.hidden=true;panels.forEach(p=>p.hidden=false);show(3);});
});
