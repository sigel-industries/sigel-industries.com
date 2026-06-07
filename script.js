
const header=document.querySelector('.header');
const navLinks=[...document.querySelectorAll('.nav a')];
const sections=[...document.querySelectorAll('main section[id]')];
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function activeNav(){let id='';sections.forEach(s=>{const r=s.getBoundingClientRect();if(r.top<=130&&r.bottom>=130)id=s.id});navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${id}`))}
window.addEventListener('scroll',()=>{header&&header.classList.toggle('is-scrolled',scrollY>20);activeNav()},{passive:true});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');if(!id||id==='#')return;const t=document.querySelector(id);if(!t)return;e.preventDefault();t.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})}));
const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
document.querySelectorAll('.card,.console,.stack-item,.visual-panel,.form-card,.btn').forEach(el=>{el.addEventListener('pointermove',ev=>{const r=el.getBoundingClientRect();el.style.setProperty('--x',`${ev.clientX-r.left}px`);el.style.setProperty('--y',`${ev.clientY-r.top}px`)},{passive:true})});
if(!reduce){let raf=null;window.addEventListener('pointermove',ev=>{if(raf)return;raf=requestAnimationFrame(()=>{document.documentElement.style.setProperty('--mx',`${Math.round(ev.clientX/innerWidth*100)}%`);document.documentElement.style.setProperty('--my',`${Math.round(ev.clientY/innerHeight*100)}%`);raf=null})},{passive:true});
 document.querySelectorAll('.console,.card,.visual-panel,.form-card').forEach(el=>{el.addEventListener('pointermove',ev=>{const r=el.getBoundingClientRect(),x=ev.clientX-r.left,y=ev.clientY-r.top;const rx=((y-r.height/2)/(r.height/2))*-2.2, ry=((x-r.width/2)/(r.width/2))*2.2;el.style.transform=`perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`},{passive:true});el.addEventListener('pointerleave',()=>el.style.transform='')});}
activeNav();
