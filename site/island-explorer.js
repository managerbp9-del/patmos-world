import * as THREE from 'three';
import {createGroundSampler,toWgs84} from './terrain.js?v=island-6';
import {createNavigator} from './navigation.js?v=island-6';
import {createIslandLife} from './island-life.js?v=island-6';
import {createIslandWater} from './island-water.js?v=island-6';
import {ISLAND_PLACES,ISLAND_CONTEXT} from './island-places.js?v=island-6';

const SCALE=.035,$=id=>document.getElementById(id),clamp=THREE.MathUtils.clamp;
let noticeTimer;
function notice(text){$('notice').textContent=text;$('notice').classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.remove('visible'),3600);}
async function start(){
 const mobile=matchMedia('(max-width:800px)').matches;
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:1.8));renderer.setSize(innerWidth,innerHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.localClippingEnabled=true;$('world').append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#88959d');scene.fog=new THREE.FogExp2('#88959d',.045);
 scene.add(new THREE.HemisphereLight('#abc0cf','#464b49',1.9));
 const sun=new THREE.DirectionalLight('#f2d5af',2.3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.00005;sun.shadow.normalBias=.0015;sun.shadow.radius=3;
 Object.assign(sun.shadow.camera,{left:-2.8,right:2.8,top:2.8,bottom:-2.8,near:.01,far:110});sun.shadow.camera.updateProjectionMatrix();scene.add(sun,sun.target);
 const sunDirection=new THREE.Vector3(.7,.65,-.35).normalize();
 const camera=new THREE.OrthographicCamera(-2,2,2,-2,.002,1600),mirror=camera.clone();
 let span=1.45,azimuth=Math.PI*.25,overview=false,following=true,paused=false,time=0,route=[],moving=false,distanceWalked=0;
 const follow=new THREE.Vector3(),pan=new THREE.Vector3(),target=new THREE.Vector3();
 const read=async(name,binary=false)=>{const r=await fetch(name);if(!r.ok)throw Error(name);return binary?r.arrayBuffer():r.json();};
 const [meta,pb,ib,sb]=await Promise.all([read('./data/terrain.json'),read('./data/terrain-positions.bin',true),read('./data/terrain-indices.bin',true),read('./data/shore-distance.bin',true)]);
 const original=new Float32Array(pb),indices=new Uint32Array(ib),sample=createGroundSampler(original,indices);
 const baseGround=(x,z)=>{const h=sample(x/SCALE,z/SCALE);return h?{height:h.height*SCALE,slope:h.normalY}:null;};
 const bounds={minX:meta.boundsMin[0]*SCALE,maxX:meta.boundsMax[0]*SCALE,minZ:meta.boundsMin[2]*SCALE,maxZ:meta.boundsMax[2]*SCALE};
 const positions=new Float32Array(original.length),colors=new Float32Array(original.length),uv=new Float32Array(original.length/3*2);
 const green=new THREE.Color('#869c90'),dry=new THREE.Color('#a9aaa1'),stone=new THREE.Color('#bbc4be'),color=new THREE.Color(),coastColor=new THREE.Color('#a7b5ae');
 for(let i=0;i<original.length;i+=3){
  const x=original[i],y=original[i+1],z=original[i+2];positions[i]=x*SCALE;positions[i+1]=y*SCALE;positions[i+2]=z*SCALE;
  const slope=sample(x,z)?.normalY??1;color.copy(dry).lerp(green,.25+.35*(Math.sin(x*.0018)*Math.cos(z*.0025)*.5+.5));
  color.lerp(stone,clamp((.87-slope)*3,0,.8));if(y<3)color.lerp(coastColor,.28);color.toArray(colors,i);uv[i/3*2]=x/9;uv[i/3*2+1]=z/9;
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeVertexNormals();
 const groundMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96});
 groundMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',THREE.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;','float grey=dot(sampledDiffuseColor.rgb,vec3(.2126,.7152,.0722)); sampledDiffuseColor.rgb=mix(vec3(grey),sampledDiffuseColor.rgb,.12)*1.6; diffuseColor *= sampledDiffuseColor;'));};
 const terrain=new THREE.Mesh(geometry,groundMaterial);terrain.receiveShadow=true;terrain.name='Patmos · uniform geographic scale';scene.add(terrain);
 const loader=new THREE.TextureLoader();
 const loadTexture=(path,assign,colorSpace)=>new Promise(resolve=>loader.load(path,t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(colorSpace)t.colorSpace=colorSpace;groundMaterial[assign]=t;groundMaterial.needsUpdate=true;resolve();},undefined,()=>{console.warn('Terrain texture unavailable:',path);resolve();}));
 const terrainTextures=Promise.all([loadTexture('./assets/materials/dry_ground_rocks/base_color.jpg','map',THREE.SRGBColorSpace),loadTexture('./assets/materials/dry_ground_rocks/normal_opengl.png','normalMap')]);groundMaterial.normalScale.set(.17,.17);
 const shore=new THREE.DataTexture(new Uint8Array(sb),512,512);shore.minFilter=shore.magFilter=THREE.LinearFilter;shore.needsUpdate=true;
 const sea=createIslandWater(shore,meta.shoreDistance,SCALE);scene.add(sea.mesh);sea.uniforms.sunDirection.value.copy(sunDirection);sea.uniforms.fogColor.value.copy(scene.fog.color);
 const reflectionTarget=new THREE.WebGLRenderTarget(mobile?384:768,mobile?384:768,{type:THREE.HalfFloatType});sea.uniforms.reflection.value=reflectionTarget.texture;
 const places=ISLAND_PLACES.map(p=>({...p}));$('load-detail').textContent='해안에 작은 생활의 흔적을 놓습니다';
 const life=createIslandLife({scene,ground:baseGround,places,SCALE});azimuth=(life.harbor?.yaw??Math.PI*.25)-.55;
 const ground=(x,z)=>{
  let h=baseGround(x,z);
  for(const s of life.walkSurfaces||[]){const a=s.rotation||0,dx=x-s.x,dz=z-s.z,lx=dx*Math.cos(a)-dz*Math.sin(a),lz=dx*Math.sin(a)+dz*Math.cos(a);if(Math.abs(lx)<s.width/2&&Math.abs(lz)<s.depth/2&&(!h||s.y>h.height))h={height:s.y,slope:1};}
  for(const r of life.walkSurfaces||[]){if(r.type!=='ramp')continue;const dx=r.end.x-r.start.x,dz=r.end.z-r.start.z,ll=dx*dx+dz*dz,t=((x-r.start.x)*dx+(z-r.start.z)*dz)/ll,side=Math.abs((x-r.start.x)*dz-(z-r.start.z)*dx)/Math.sqrt(ll);if(t>=0&&t<=1&&side<r.width/2)h={height:THREE.MathUtils.lerp(r.start.y,r.end.y,t),slope:1};}
  return h;
 };
 const navigator=createNavigator({ground,bounds,obstacles:life.obstacles,step:.28});
 for(const p of places){const authored=life.placePositions?.[p.id]||life.landmarks?.[p.id]||p.point||p;const q=navigator.nearest(authored.x,authored.z,4)||navigator.nearest(p.x,p.z,12);p.point=q?new THREE.Vector3(q.x,q.y??ground(q.x,q.z).height,q.z):new THREE.Vector3(p.x,ground(p.x,p.z)?.height??0,p.z);}
 const player=life.player,spawn=life.spawn||places[0].point,safeSpawn=navigator.nearest(spawn.x,spawn.z,4)||places[0].point;
 player.root.position.set(safeSpawn.x,safeSpawn.y??ground(safeSpawn.x,safeSpawn.z).height,safeSpawn.z);if(!player.root.parent)scene.add(player.root);follow.copy(player.root.position);target.copy(follow);
 const marker=new THREE.Mesh(new THREE.RingGeometry(.027,.033,40),new THREE.MeshBasicMaterial({color:'#e1d5a1',transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.visible=false;scene.add(marker);
 const pathGeometry=new THREE.BufferGeometry(),pathLine=new THREE.Line(pathGeometry,new THREE.LineBasicMaterial({color:'#dfd7ad',transparent:true,opacity:.36,depthWrite:false}));pathLine.frustumCulled=false;scene.add(pathLine);
 const playerRing=new THREE.Mesh(new THREE.RingGeometry(.020,.023,32),new THREE.MeshBasicMaterial({color:'#efdb9f',transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false}));playerRing.rotation.x=-Math.PI/2;scene.add(playerRing);
 let currentPlace=places[0],planning=false;
 const interactables=life.interactables||[];for(const item of interactables)item.object.traverse(o=>o.userData.inspect=item);
 const raycaster=new THREE.Raycaster(),pointerNdc=new THREE.Vector2();
 function resize(){const aspect=innerWidth/innerHeight,w=bounds.maxX-bounds.minX,d=bounds.maxZ-bounds.minZ,cspan=overview?1.18*Math.max((w*Math.abs(Math.cos(azimuth))+d*Math.abs(Math.sin(azimuth)))/aspect,(w*Math.abs(Math.sin(azimuth))+d*Math.abs(Math.cos(azimuth)))*.72):span;camera.left=-cspan*aspect/2;camera.right=cspan*aspect/2;camera.top=cspan/2;camera.bottom=-cspan/2;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);$('overview').textContent=overview?'산책으로 돌아가기':'섬 전체';}
 function moveTo(x,z){
  if(planning)return false;const end=navigator.nearest(x,z,.65);if(!end){notice('바다나 가파른 바위에는 걸어갈 수 없습니다.');return false;}
  planning=true;const result=navigator.findPath({x:player.root.position.x,z:player.root.position.z},end);planning=false;
  if(!result.points?.length){notice('이어지는 길을 찾지 못했습니다. 가까운 땅을 눌러 주세요.');return false;}
  route=result.points.map(p=>new THREE.Vector3(p.x,p.y,p.z));if(route[0].distanceTo(player.root.position)<.008)route.shift();
  marker.position.set(end.x,(ground(end.x,end.z)?.height??end.y)+.003,end.z);marker.visible=true;pathGeometry.setFromPoints([player.root.position,...route].map(p=>new THREE.Vector3(p.x,p.y+.004,p.z)));
  following=true;overview=false;resize();$('walk-state').textContent='선택한 곳으로 걷는 중';return true;
 }
 function stop(){route=[];marker.visible=false;pathGeometry.setFromPoints([]);$('walk-state').textContent='잠시 머무르는 중';}
 function showInfo(item){$('inspect-kind').textContent=({house:'해안의 생활',harbor:'바닷가의 소재',cave:'전승의 장소',rock:'섬의 지형',person:'섬의 사람',plant:'섬의 식물',tree:'섬의 식물',olive:'섬의 식물',amphora:'생활의 소재',timber:'생활의 소재',object:'생활의 소재'})[item.kind]||item.kind||'섬의 소재';$('inspect-title').textContent=item.title||item.name;$('inspect-text').textContent=item.text||item.details||item.summary||'';$('inspect-source').hidden=!item.sourceUrl;if(item.sourceUrl)$('inspect-source').href=item.sourceUrl;$('inspect').hidden=false;$('inspect-walk').hidden=item.kind!=='harbor'||!item.point;$('inspect-walk').onclick=()=>{if(item.point&&moveTo(item.point.x,item.point.z))$('inspect').hidden=true;};}
 function visit(id){const p=places.find(p=>p.id===id);if(!p)return;stop();player.root.position.copy(p.point);following=true;overview=false;span=1.45;follow.copy(p.point);target.copy(p.point);currentPlace=p;resize();$('map-panel').close();$('inspect').hidden=true;$('place-name').textContent=p.name;$('place-kind').textContent=p.kind.replace('의장소','의 장소');history.replaceState(null,'','#place-'+p.id);notice(p.name+'에서 산책을 시작합니다.');}
 function mapProjection(x,z,w,h){const mx=(bounds.minX+bounds.maxX)/2,mz=(bounds.minZ+bounds.maxZ)/2,s=Math.min((w-32)/(bounds.maxX-bounds.minX),(h-32)/(bounds.maxZ-bounds.minZ));return [w/2+(x-mx)*s,h/2+(z-mz)*s];}
 function drawMap(){
  for(const id of ['mini-map','island-map']){const c=$(id),ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#1b3038';ctx.fillRect(0,0,w,h);ctx.beginPath();meta.coast.forEach(([x,z],i)=>{const p=mapProjection(x*SCALE,z*SCALE,w,h);i?ctx.lineTo(...p):ctx.moveTo(...p);});ctx.closePath();ctx.fillStyle='#79847c';ctx.fill();ctx.strokeStyle='#b3beb1';ctx.lineWidth=1;ctx.stroke();
   for(const p of places){const [x,z]=mapProjection(p.point.x,p.point.z,w,h);ctx.beginPath();ctx.arc(x,z,id==='mini-map'?2.3:4,0,Math.PI*2);ctx.fillStyle='#dec394';ctx.fill();if(id==='island-map'){ctx.font='12px sans-serif';ctx.fillStyle='#eceadf';ctx.fillText(p.name,x+9,z+4);}}
   const [x,z]=mapProjection(player.root.position.x,player.root.position.z,w,h);ctx.beginPath();ctx.arc(x,z,id==='mini-map'?3:5,0,Math.PI*2);ctx.fillStyle='#fff8d8';ctx.fill();ctx.strokeStyle='#253c40';ctx.stroke();ctx.fillStyle='#aebfbd';ctx.font='11px serif';ctx.fillText('N',w-18,19);
  }
 }
 function showMap(){drawMap();$('map-panel').showModal();}
 for(const p of places){const b=document.createElement('button');b.className='map-place';b.innerHTML='<small></small><strong></strong><span>여기서 산책 시작 ↗</span>';b.querySelector('small').textContent=p.kind.replace('의장소','의 장소');b.querySelector('strong').textContent=p.name;b.onclick=()=>visit(p.id);$('places-list').append(b);}
 $('map-open').onclick=showMap;$('mini-map-button').onclick=showMap;$('map-close').onclick=()=>$('map-panel').close();$('island-context').onclick=()=>showInfo(ISLAND_CONTEXT);$('inspect-close').onclick=()=>$('inspect').hidden=true;$('place-context').onclick=()=>showInfo(currentPlace);
 $('overview').onclick=()=>{overview=!overview;following=!overview;resize();$('overview').textContent=overview?'산책으로 돌아가기':'섬 전체';};
 $('follow').onclick=()=>{following=true;overview=false;resize();};
 $('zoom-in').onclick=()=>{overview=false;span=clamp(span*.78,.6,18);resize();};$('zoom-out').onclick=()=>{overview=false;span=clamp(span/.78,.6,18);resize();};
 $('rotate-left').onclick=()=>{azimuth-=Math.PI/4;resize();};$('rotate-right').onclick=()=>{azimuth+=Math.PI/4;resize();};
 $('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'재생':'잠시 멈추기';$('pause').setAttribute('aria-pressed',String(paused));};
 $('hide-ui').onclick=()=>document.body.classList.add('clean');$('restore-ui').onclick=()=>document.body.classList.remove('clean');
 $('map-panel').addEventListener('click',e=>{if(e.target===$('map-panel')){const r=$('map-panel').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('map-panel').close();}});
 const canvas=renderer.domElement,pointers=new Map();let drag=null,pinching=false;
 function cast(x,y){pointerNdc.set(x/innerWidth*2-1,1-y/innerHeight*2);raycaster.setFromCamera(pointerNdc,camera);}
 function inspectAt(x,y){cast(x,y);const hits=raycaster.intersectObjects(interactables.map(i=>i.object),true);const land=raycaster.intersectObject(terrain)[0];return hits[0]&&(!land||hits[0].distance<=land.distance+.003)?{...hits[0].object.userData.inspect,point:hits[0].point}:null;}
 function tap(x,y){const item=inspectAt(x,y);if(item){showInfo(item);return;}cast(x,y);const hits=raycaster.intersectObject(terrain);if(hits.length){const p=hits[0].point;moveTo(p.x,p.z);}else notice('걷고 싶은 땅을 눌러 주세요.');}
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY,travel:0,button:e.button};if(pointers.size>1)pinching=true;});
 canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId)){const item=inspectAt(e.clientX,e.clientY);canvas.style.cursor=item?'help':'crosshair';$('hover-label').hidden=!item;if(item){$('hover-label').textContent=item.title||item.name;$('hover-label').style.left=e.clientX+'px';$('hover-label').style.top=(e.clientY-16)+'px';}return;}
  const old=pointers.get(e.pointerId),dx=e.clientX-old.x,dy=e.clientY-old.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag.travel+=Math.hypot(dx,dy);
  if(pointers.size===2){const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)[1],before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);span=clamp(span*before/Math.max(after,1),.6,18);overview=false;resize();return;}
  if(drag.travel>6){if(drag.button===2){azimuth-=dx*.006;resize();}else{following=false;const k=(camera.top-camera.bottom)/innerHeight;pan.x-=dx*k*Math.cos(azimuth)+dy*k*Math.sin(azimuth)/.7;pan.z+=dx*k*Math.sin(azimuth)-dy*k*Math.cos(azimuth)/.7;}}
 });
 const release=e=>{const click=drag&&drag.travel<7&&!pinching&&drag.button===0;pointers.delete(e.pointerId);if(click)tap(e.clientX,e.clientY);if(!pointers.size){drag=null;pinching=false;}};
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',()=>{pointers.clear();drag=null;pinching=false;});
 canvas.addEventListener('wheel',e=>{e.preventDefault();overview=false;span=clamp(span*Math.exp(e.deltaY*.001),.6,18);resize();},{passive:false});
 addEventListener('blur',()=>{pointers.clear();drag=null;pinching=false;});
 addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||e.target.matches('input,textarea,button'))return;if(e.code==='Escape'){stop();$('inspect').hidden=true;}if(e.code==='KeyR')$('follow').click();if(e.code==='KeyM'){showMap();e.preventDefault();}if(e.code==='KeyQ')$('rotate-left').click();if(e.code==='KeyE')$('rotate-right').click();if(e.code==='Equal')$('zoom-in').click();if(e.code==='Minus')$('zoom-out').click();if(e.code==='Space'){$('pause').click();e.preventDefault();}});
 await terrainTextures;addEventListener('resize',resize);resize();drawMap();$('loading').hidden=true;
 const requested=location.hash.replace('#place-','');if(places.some(p=>p.id===requested))visit(requested);else{$('place-name').textContent=places[0].name;$('place-kind').textContent='요한의 섬 · 자유로운 산책';}
 function state(){return {mode:overview?'island-map':'quarter-view',player:player.root.position.toArray(),heightMetres:1.75,uniformScale:SCALE,verticalExaggeration:1,camera:camera.position.toArray(),viewHeightMetres:span/SCALE,walking:route.length>0,remainingWaypoints:route.length,walkedMetres:distanceWalked/SCALE,place:currentPlace.id,interactables:interactables.map(i=>({title:i.title,kind:i.kind})),lifeCounts:life.root.userData.counts,npcs:interactables.filter(i=>i.kind==='person').map(i=>i.object.position.toArray()),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}
 if(document.modelContext?.registerTool)document.modelContext.registerTool({name:'explore_patmos',description:'Explore Patmos at human scale with a quarter-view camera. Move along walkable terrain, choose a map starting point, or inspect state.',inputSchema:{type:'object',properties:{place:{type:'string',enum:places.map(p=>p.id)},x:{type:'number'},z:{type:'number'},zoom:{type:'number',minimum:.6,maximum:18},overview:{type:'boolean'},inspect:{type:'integer',minimum:0}},additionalProperties:false},annotations:{readOnlyHint:false},execute:async({place,x,z,zoom,overview:map,inspect}={})=>{if(place)visit(place);if(zoom!==undefined){span=zoom;resize();}if(map!==undefined){overview=map;following=!map;resize();}let accepted;if(typeof x==='number'&&typeof z==='number')accepted=moveTo(x,z);if(inspect!==undefined&&interactables[inspect])showInfo(interactables[inspect]);return {...state(),accepted};}});
 const lookMirror=new THREE.Vector3(),bias=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),clipPlane=new THREE.Plane(new THREE.Vector3(0,1,0),.005);
 let last=performance.now(),frames=0,fpsTime=0,frame=0;
 function animate(now){requestAnimationFrame(animate);const raw=(now-last)/1000,dt=Math.min(.05,raw);last=now;frame++;frames++;fpsTime+=raw;if(fpsTime>1){$('fps').textContent=Math.round(frames/fpsTime)+' fps';frames=0;fpsTime=0;}
  moving=false;
  if(!paused){time+=dt;if(route.length){const next=route[0],dx=next.x-player.root.position.x,dz=next.z-player.root.position.z,length=Math.hypot(dx,dz),step=Math.min(length,.058*dt);if(length<1e-5)route.shift();else{const nx=player.root.position.x+dx/length*step,nz=player.root.position.z+dz/length*step,h=ground(nx,nz);if(h&&h.height>=.00015){player.root.position.set(nx,h.height,nz);player.root.rotation.y=Math.atan2(dx,dz);distanceWalked+=step;moving=true;}else stop();}if(!route.length){marker.visible=false;pathGeometry.setFromPoints([]);$('walk-state').textContent='도착 · 소재를 눌러 살펴보세요';}}life.update(time,dt);player.update?.(time,moving);}
  playerRing.position.copy(player.root.position);playerRing.position.y+=.003;playerRing.visible=!overview;marker.material.opacity=.6+Math.sin(time*3)*.2;
  if(following){follow.lerp(player.root.position,1-Math.exp(-dt*4));pan.set(0,0,0);}target.copy(overview?new THREE.Vector3(-5,1,0):follow).add(pan);
  const elevation=.60,distance=overview?500:Math.max(5,span*3);camera.position.set(target.x+Math.sin(azimuth)*Math.cos(elevation)*distance,target.y+Math.sin(elevation)*distance,target.z+Math.cos(azimuth)*Math.cos(elevation)*distance);camera.up.set(0,1,0);camera.lookAt(target);camera.updateMatrixWorld();
  const shadowSpan=clamp(span*1.3,1.4,12);if(Math.abs(sun.shadow.camera.right-shadowSpan)>.1){Object.assign(sun.shadow.camera,{left:-shadowSpan,right:shadowSpan,top:shadowSpan,bottom:-shadowSpan});sun.shadow.camera.updateProjectionMatrix();}sun.target.position.copy(player.root.position);sun.position.copy(player.root.position).addScaledVector(sunDirection,45);
  scene.fog.density=overview?.0015:.075;sea.uniforms.fogDensity.value=scene.fog.density;sea.uniforms.time.value=time;sea.uniforms.eye.value.copy(camera.position);
  if(frame%(overview?4:2)===0){mirror.copy(camera);mirror.position.y=-camera.position.y-.008;lookMirror.copy(target);lookMirror.y=-target.y-.008;mirror.up.set(0,-1,0);mirror.lookAt(lookMirror);mirror.updateMatrixWorld();sea.uniforms.reflectionMatrix.value.copy(bias).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);sea.mesh.visible=false;marker.visible=false;playerRing.visible=false;pathLine.visible=false;const auto=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;renderer.clippingPlanes=[clipPlane];renderer.setRenderTarget(reflectionTarget);renderer.render(scene,mirror);renderer.setRenderTarget(null);renderer.clippingPlanes=[];renderer.shadowMap.autoUpdate=auto;sea.mesh.visible=true;marker.visible=route.length>0;playerRing.visible=!overview;pathLine.visible=true;}
  renderer.render(scene,camera);
  if(frame%20===0){drawMap();let nearest=places[0],best=Infinity;for(const p of places){const d=p.point.distanceTo(player.root.position);if(d<best){best=d;nearest=p;}}currentPlace=nearest;$('place-name').textContent=best<3?nearest.name:'밧모의 길 위에서';const coords=toWgs84(player.root.position.x/SCALE,player.root.position.z/SCALE,meta.originUtm);$('coordinates').textContent=coords.lat.toFixed(4)+'° N  '+coords.lon.toFixed(4)+'° E';$('scale-label').textContent=Math.round((camera.top-camera.bottom)/SCALE*.12)+' m';}
 }requestAnimationFrame(animate);
}
start().catch(error=>{console.error(error);$('loading').hidden=false;$('load-detail').textContent='섬을 불러오지 못했습니다. '+error.message;});

