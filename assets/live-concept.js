/* Reactive visual direction preview. This is a concept sketch, not a generated deliverable. */
document.addEventListener('DOMContentLoaded',()=>{
 const stage=document.getElementById('live-concept-stage');if(!stage)return;
 const form=document.getElementById('creative-brief');
 const title=document.getElementById('live-concept-title'),kind=document.getElementById('live-concept-kind'),styleText=document.getElementById('live-concept-style'),motionText=document.getElementById('live-concept-motion');
 const palettes={
  'Cinematic and realistic':['#c9ff4a','#a795ff'],
  'Bold motion graphics':['#c9ff4a','#39d9ff'],
  '3D and product worlds':['#a795ff','#c9ff4a'],
  'Playful animation':['#ff6fae','#c9ff4a'],
  'Minimal and premium':['#f2f2f2','#c9ff4a'],
  'Surprise me':['#c9ff4a','#a795ff']
 };
 const symbols={'AI video ad':'▶','Motion graphics':'✳','Animated product visual':'◈','AI image / campaign artwork':'▧','Social content pack':'▦','Not sure yet':'✦'};
 function update(){
  const data=new FormData(form),deliverable=data.get('deliverable')||'AI video ad',style=data.get('style')||'Cinematic and realistic',motions=data.getAll('motion');
  const palette=palettes[style]||palettes['Cinematic and realistic'];
  stage.dataset.style=style;stage.dataset.deliverable=deliverable;stage.style.setProperty('--concept-accent',palette[0]);stage.style.setProperty('--concept-secondary',palette[1]);
  const object=stage.querySelector('.live-concept-object b');if(object)object.textContent=symbols[deliverable]||'✳';
  title.textContent=style==='Surprise me'?'An unexpected visual direction':style==='Bold motion graphics'?'Make the elements move.':style==='3D and product worlds'?'A world around your product.':style==='Minimal and premium'?'Less noise. More impact.':style==='Playful animation'?'Let the idea come alive.':'A cinematic first impression.';
  kind.textContent=deliverable.toUpperCase();
  styleText.textContent=style;
  motionText.textContent=motions.length?motions.slice(0,2).join(' · '):'Movement direction appears as you choose';
 }
 form.addEventListener('change',update);update();
});
