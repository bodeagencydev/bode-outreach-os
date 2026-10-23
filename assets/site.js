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
