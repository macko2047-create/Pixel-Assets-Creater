const canvas=document.querySelector('#canvas'),ctx=canvas.getContext('2d'),preview=document.querySelector('#preview'),pctx=preview.getContext('2d');
const palette=['#111827','#ffffff','#ef4444','#f97316','#facc15','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899'];let color=palette[0],tool='pencil',zoom=10,drawing=false,history=[],future=[],mirror=false,last=null;
const wrap=document.querySelector('#canvasWrap'),coord=document.querySelector('#coord');
function blank(n){canvas.width=canvas.height=preview.width=preview.height=n;ctx.clearRect(0,0,n,n);fit();renderPreview();saveLocal()}
function fit(){const max=Math.min(wrap.clientWidth*.88,wrap.clientHeight*.88);zoom=Math.max(2,Math.floor(max/canvas.width));applyZoom()}
function applyZoom(){canvas.style.width=canvas.width*zoom+'px';canvas.style.height=canvas.height*zoom+'px';document.querySelector('#zoomLabel').textContent='Zoom '+zoom*100+'%'}
function snap(){return ctx.getImageData(0,0,canvas.width,canvas.height)}function push(){history.push(snap());if(history.length>60)history.shift();future=[]}
function restore(img){ctx.putImageData(img,0,0);renderPreview();saveLocal()}
function xy(e){const r=canvas.getBoundingClientRect();return{x:Math.floor((e.clientX-r.left)/r.width*canvas.width),y:Math.floor((e.clientY-r.top)/r.height*canvas.height)}}
function rgba(hex){let n=parseInt(hex.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255,255]}
function dot(x,y,erase=false){if(x<0||y<0||x>=canvas.width||y>=canvas.height)return;if(erase)ctx.clearRect(x,y,1,1);else{ctx.fillStyle=color;ctx.fillRect(x,y,1,1)}if(mirror){let mx=canvas.width-1-x;if(erase)ctx.clearRect(mx,y,1,1);else ctx.fillRect(mx,y,1,1)}}
function line(a,b,erase){let x0=a.x,y0=a.y,x1=b.x,y1=b.y,dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;for(;;){dot(x0,y0,erase);if(x0===x1&&y0===y1)break;let e=2*err;if(e>=dy){err+=dy;x0+=sx}if(e<=dx){err+=dx;y0+=sy}}}
function fill(x,y){let d=ctx.getImageData(0,0,canvas.width,canvas.height),p=d.data,i=(y*canvas.width+x)*4,t=[p[i],p[i+1],p[i+2],p[i+3]],c=rgba(color);if(t.every((v,j)=>v===c[j]))return;let q=[[x,y]];while(q.length){let [a,b]=q.pop();if(a<0||b<0||a>=canvas.width||b>=canvas.height)continue;let k=(b*canvas.width+a)*4;if(!t.every((v,j)=>p[k+j]===v))continue;c.forEach((v,j)=>p[k+j]=v);q.push([a+1,b],[a-1,b],[a,b+1],[a,b-1])}ctx.putImageData(d,0,0)}
function pick(x,y){let p=ctx.getImageData(x,y,1,1).data;if(!p[3])return;color='#'+[p[0],p[1],p[2]].map(v=>v.toString(16).padStart(2,'0')).join('');document.querySelector('#color').value=color;markColor()}
function renderPreview(){pctx.clearRect(0,0,preview.width,preview.height);pctx.drawImage(canvas,0,0);saveLocal()}
function saveLocal(){try{localStorage.pixelAsset=canvas.toDataURL()}catch{}}
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.isPrimary===false)return;e.preventDefault();let p=xy(e);push();if(tool==='fill'){fill(p.x,p.y);renderPreview();return}if(tool==='pick'){pick(p.x,p.y);return}drawing=true;last=p;dot(p.x,p.y,tool==='eraser');canvas.setPointerCapture(e.pointerId);renderPreview()});
canvas.addEventListener('pointermove',e=>{let p=xy(e);coord.textContent=p.x+', '+p.y;if(!drawing)return;line(last,p,tool==='eraser');last=p;renderPreview()});canvas.addEventListener('pointerup',()=>{drawing=false;last=null;renderPreview()});
wrap.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(2,Math.min(40,zoom+(e.deltaY<0?1:-1)));applyZoom()},{passive:false});
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(x=>x.classList.toggle('active',x===b))});
document.querySelector('#mirror').onclick=e=>{mirror=!mirror;e.currentTarget.classList.toggle('active',mirror)};
document.querySelector('#undo').onclick=()=>{if(!history.length)return;future.push(snap());restore(history.pop())};document.querySelector('#redo').onclick=()=>{if(!future.length)return;history.push(snap());restore(future.pop())};
document.querySelector('#size').onchange=e=>{if(confirm('Create a new '+e.target.value+'×'+e.target.value+' canvas?')){history=[];future=[];blank(+e.target.value)}else e.target.value=canvas.width};
document.querySelector('#color').oninput=e=>{color=e.target.value;markColor()};document.querySelector('#export').onclick=()=>{let a=document.createElement('a');a.download='pixel-asset-'+canvas.width+'x'+canvas.height+'.png';a.href=canvas.toDataURL('image/png');a.click()};
function markColor(){document.querySelectorAll('.swatch').forEach(x=>x.classList.toggle('selected',x.dataset.c===color))}let pal=document.querySelector('#palette');palette.forEach(c=>{let b=document.createElement('button');b.className='swatch';b.dataset.c=c;b.style.background=c;b.onclick=()=>{color=c;document.querySelector('#color').value=c;markColor()};pal.append(b)});markColor();
window.addEventListener('resize',fit);blank(32);
