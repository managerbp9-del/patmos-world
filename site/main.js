import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createSky} from './sky.js';
import {createGroundSampler,toWgs84} from './terrain.js';
import {createOcean} from './ocean.js';

const $=id=>document.getElementById(id),clamp=THREE.MathUtils.clamp;
let noticeTimeout;
function notice(text){$('notice').textContent=text;$('notice').classList.add('visible');clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>$('notice').classList.remove('visible'),3600);}
async function read(path,binary=false){const r=await fetch(path);if(!r.ok)throw Error(`자료를 불러오지 못했습니다: ${path}`);return binary?r.arrayBuffer():r.json();}
const hash=(x,z,seed=0)=>{const n=Math.sin(x*127.1+z*311.7+seed*74.7)*43758.5453123;return n-Math.floor(n);};

async function start(){
  const compact=matchMedia('(max-width:850px)').matches;
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',logarithmicDepthBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,compact?1.2:1.5));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  $('world').append(renderer.domElement);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x9bb9c6,.000035);
  const camera=new THREE.PerspectiveCamera(64,innerWidth/innerHeight,.12,100000);camera.rotation.order='YXZ';
  const [meta,pb,ib,shoreBuffer]=await Promise.all([read('./data/terrain.json'),read('./data/terrain-positions.bin',true),read('./data/terrain-indices.bin',true),read('./data/shore-distance.bin',true)]);
  const positions=new Float32Array(pb),indices=new Uint32Array(ib),sample=createGroundSampler(positions,indices);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeVertexNormals();geometry.computeBoundingSphere();
  // A 10m shading footprint avoids thin coastal triangle fans making stripes.
  // Only display normals change: source coordinates and walking triangles do not.
  const surfaceNormals=geometry.attributes.normal,normalVector=new THREE.Vector3();
  for(let i=0;i<positions.length/3;i++){
    const x=positions[i*3],z=positions[i*3+2],center=positions[i*3+1];
    const left=sample(x-5,z)?.height??center,right=sample(x+5,z)?.height??center;
    const north=sample(x,z-5)?.height??center,south=sample(x,z+5)?.height??center;
    normalVector.set(left-right,10,north-south).normalize();surfaceNormals.setXYZ(i,normalVector.x,normalVector.y,normalVector.z);
  }
  const uv=new Float32Array(positions.length/3*2);for(let i=0;i<positions.length/3;i++){uv[i*2]=positions[i*3]/3.7;uv[i*2+1]=positions[i*3+2]/3.7;}
  geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  $('load-detail').textContent='흙과 암반의 표면을 준비합니다';
  const texLoader=new THREE.TextureLoader();
  async function texture(material,file,color=false){const t=await texLoader.loadAsync(`./assets/materials/${material}/${file}`);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=THREE.SRGBColorSpace;return t;}
  const [dirt,normal,rock]=await Promise.all([texture('dry_ground_rocks','base_color.jpg',true),texture('dry_ground_rocks','normal_opengl.png'),texture('rock_boulder_dry','base_color.jpg',true)]);
  const groundMaterial=new THREE.MeshStandardMaterial({map:dirt,normalMap:normal,normalScale:new THREE.Vector2(.45,.45),roughness:1,metalness:0,color:0xe9e2d3});
  groundMaterial.onBeforeCompile=shader=>{
    shader.uniforms.rockSurface={value:rock};
    shader.vertexShader='varying vec3 vGeoPosition; varying vec3 vGeoNormal;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGeoPosition=position;vGeoNormal=normal;');
    shader.fragmentShader=`varying vec3 vGeoPosition;varying vec3 vGeoNormal;uniform sampler2D rockSurface;
      float terrainHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float terrainNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(terrainHash(i),terrainHash(i+vec2(1,0)),f.x),mix(terrainHash(i+vec2(0,1)),terrainHash(i+vec2(1,1)),f.x),f.y);}
      `+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec3 wn=pow(abs(normalize(vGeoNormal)),vec3(4.));wn/=max(.001,wn.x+wn.y+wn.z);
      vec3 r=texture2D(rockSurface,vGeoPosition.zy*.28).rgb*wn.x+texture2D(rockSurface,vGeoPosition.xz*.28).rgb*wn.y+texture2D(rockSurface,vGeoPosition.xy*.28).rgb*wn.z;
      float broad=terrainNoise(vGeoPosition.xz*.012),medium=terrainNoise(vGeoPosition.xz*.09);
      float slope=1.-abs(normalize(vGeoNormal).y);
      float rockMix=clamp(smoothstep(.12,.6,slope)*.85+(medium-.5)*.25,0.,.95);
      diffuseColor.rgb=mix(diffuseColor.rgb,r*vec3(.82,.8,.76),rockMix)*(0.82+broad*.32);
      float lum=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(lum)*vec3(1.03,1.015,.93),.46)*1.05;
      vec3 farColor=vec3(.17,.163,.132)*(0.78+broad*.48);
      diffuseColor.rgb=mix(diffuseColor.rgb,farColor,smoothstep(50.,180.,distance(cameraPosition,vGeoPosition)));
      diffuseColor.rgb=mix(diffuseColor.rgb*.75,diffuseColor.rgb,smoothstep(-.1,1.2,vGeoPosition.y));`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`vec3 terrainBaseNormal=normal;
      #include <normal_fragment_maps>
      normal=normalize(mix(terrainBaseNormal,normal,1.-smoothstep(25.,100.,distance(cameraPosition,vGeoPosition))));`);
  };
  const land=new THREE.Mesh(geometry,groundMaterial);land.name='Patmos_UTM_35N_unscaled';land.receiveShadow=true;scene.add(land);
  const hemi=new THREE.HemisphereLight(0xc0d9e4,0x8d816c,1.15);scene.add(hemi);
  const sunlight=new THREE.DirectionalLight(0xffeed7,3.0);sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);sunlight.shadow.camera.left=-95;sunlight.shadow.camera.right=95;sunlight.shadow.camera.top=95;sunlight.shadow.camera.bottom=-95;sunlight.shadow.camera.near=1;sunlight.shadow.camera.far=1600;sunlight.shadow.normalBias=.06;sunlight.shadow.bias=-.00008;scene.add(sunlight,sunlight.target);
  const sky=createSky();scene.add(sky.mesh);
  const shoreTexture=new THREE.DataTexture(new Uint8Array(shoreBuffer),meta.shoreDistance.resolution,meta.shoreDistance.resolution);shoreTexture.minFilter=shoreTexture.magFilter=THREE.LinearFilter;shoreTexture.needsUpdate=true;
  const ocean=createOcean(THREE,{shoreTexture,shoreBounds:meta.shoreDistance});scene.add(ocean.mesh);
  $('load-detail').textContent='Blender에서 만든 바위와 식생을 배치합니다';
  const library=await new GLTFLoader().loadAsync('./assets/coastal-assets.glb');
  const study=new THREE.Vector2(...meta.coastalStudy.landmark),details=new THREE.Group();details.name='Petra_visual_reconstruction';scene.add(details);
  const plantUniforms=[];
  const groups=new Map();
  library.scene.traverse(object=>{
    if(!object.isMesh)return;
    const name=object.name,plant=!name.startsWith('Rock');
    const mat=object.material.clone();mat.roughness=plant?.95:.89;
    const t={value:0},w={value:.35};
    if(plant){mat.onBeforeCompile=s=>{s.uniforms.windTime=t;s.uniforms.windStrength=w;s.vertexShader='uniform float windTime;uniform float windStrength;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float bend=max(position.y,0.0);float phase=dot(instanceMatrix[3].xz,vec2(.13,.19));
      transformed.x+=sin(windTime*1.4+phase+position.y*1.7)*bend*bend*.08*windStrength;
      transformed.z+=cos(windTime*1.0+phase)*bend*bend*.04*windStrength;`);};plantUniforms.push({t,w});}
    object.geometry.computeBoundingBox();const gp=object.geometry.attributes.position;let radius=0;for(let i=0;i<gp.count;i++)radius=Math.max(radius,Math.hypot(gp.getX(i),gp.getZ(i)));
    const mesh=new THREE.InstancedMesh(object.geometry,mat,name.startsWith('Grass')?700:name.startsWith('Shrub')?240:320);mesh.count=0;mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.name=name;details.add(mesh);groups.set(name,{mesh,capacity:mesh.instanceMatrix.count,collisionRadius:radius,collisionTop:object.geometry.boundingBox.max.y});
  });
  const names=[...groups.keys()],rocks=names.filter(n=>n.startsWith('Rock')),shrubs=names.filter(n=>n.startsWith('Shrub')),grasses=names.filter(n=>n.startsWith('Grass'));
  const state={mode:'walk',hour:15.4,weather:'clear',wind:.35,yaw:-1.15,pitch:-.06,hidden:false};
  const keys=new Set(),object=new THREE.Object3D(),instanceColor=new THREE.Color();let colliders=[],lastScatter=new THREE.Vector2(Infinity,Infinity);
  function place(name,x,z,ground,scale,rotation,seed){
    const g=groups.get(name);if(!g||g.mesh.count>=g.capacity)return;
    object.position.set(x,ground.height-.03,z);object.rotation.set(0,rotation,0);object.scale.setScalar(scale);object.updateMatrix();g.mesh.setMatrixAt(g.mesh.count,object.matrix);
    instanceColor.setHSL(.115+seed*.03,.1+seed*.07,.74+seed*.2);g.mesh.setColorAt(g.mesh.count,instanceColor);g.mesh.count++;
    if(name.startsWith('Rock'))colliders.push({x,z,r:scale*g.collisionRadius,height:ground.height+scale*g.collisionTop});
  }
  function scatter(){
    if(lastScatter.distanceTo(new THREE.Vector2(camera.position.x,camera.position.z))<55)return;
    lastScatter.set(camera.position.x,camera.position.z);for(const g of groups.values())g.mesh.count=0;colliders=[];
    const px=camera.position.x,pz=camera.position.z;
    if(Math.hypot(px-study.x,pz-study.y)<700){
      const step=8,minX=Math.floor((px-235)/step),maxX=Math.ceil((px+235)/step),minZ=Math.floor((pz-235)/step),maxZ=Math.ceil((pz+235)/step);
      for(let zi=minZ;zi<=maxZ;zi++)for(let xi=minX;xi<=maxX;xi++){
        const x=(xi+hash(xi,zi,1))*step,z=(zi+hash(xi,zi,2))*step,d=Math.hypot(x-px,z-pz);
        if(d>230||Math.hypot(x-study.x,z-study.y)>360)continue;
        const g=sample(x,z);if(!g||g.height<.35||g.normalY<.7)continue;
        const h=hash(xi,zi,3),patch=hash(Math.floor(x/36),Math.floor(z/36),8);
        if(h<.31){const s=.3+hash(xi,zi,4)**2*1.5;place(rocks[Math.floor(hash(xi,zi,5)*rocks.length)],x,z,g,s,h*27,hash(xi,zi,6));}
        if(d<150&&g.height>1.4&&h>.58&&patch>.27){const s=.44+hash(xi,zi,7)*.46;place(shrubs[Math.floor(h*97)%shrubs.length],x,z,g,s,h*57,hash(xi,zi,8));}
        if(d<100&&g.height>.8&&g.normalY>.85&&patch>.27){
          for(let j=0;j<3;j++){
            const xx=x+hash(xi+j,zi,9)*5,zz=z+hash(xi,zi+j,10)*5,gg=sample(xx,zz);if(!gg||gg.height<.6)continue;
            place(grasses[(j+xi*xi+zi*zi)%grasses.length],xx,zz,gg,.48+hash(xi+j,zi,11)*.48,h*61+j,hash(xi,zi+j,12));
          }
        }
      }
    }
    for(const g of groups.values()){g.mesh.instanceMatrix.needsUpdate=true;if(g.mesh.instanceColor)g.mesh.instanceColor.needsUpdate=true;g.mesh.computeBoundingSphere();}
  }
  function setMode(mode,inform=true){state.mode=mode;const g=sample(camera.position.x,camera.position.z);if(mode==='walk'){if(!g||g.height<.05){state.mode='fly';if(inform)notice('바다 위에서는 자유 비행으로 둘러보세요.');}else camera.position.y=g.height+1.72;}$('walk').setAttribute('aria-pressed',state.mode==='walk');$('fly').setAttribute('aria-pressed',state.mode==='fly');$('movement-help').textContent=state.mode==='walk'?'화면 드래그 · WASD 걷기 · Shift 빠르게':'화면 드래그 · WASD 비행 · Q/E 높이 · Shift 빠르게';}
  function home(){camera.position.set(-1005,10,3195);setMode('walk',false);state.yaw=-1.1;state.pitch=-.06;lastScatter.set(Infinity,Infinity);scatter();}
  home();
  const skySun=new THREE.Vector3();let cloud=0,wet=0;
  function atmosphere(){
    const h=state.hour,elevation=Math.max(.035,Math.sin((h-6)/14*Math.PI)*.95),azimuth=(h-12)*Math.PI/12+Math.PI;
    skySun.set(Math.sin(azimuth)*Math.cos(elevation),Math.sin(elevation),Math.cos(azimuth)*Math.cos(elevation)).normalize();
    cloud=state.weather==='clear'?0:state.weather==='overcast'?.75:.96;wet=state.weather==='rain'?1:0;
    sunlight.intensity=(3.15-cloud*2.8)*Math.min(1,skySun.y*3+.15);sunlight.color.setHSL(.095,.17+Math.max(0,.32-skySun.y)*.7,.91);
    hemi.intensity=1.1+cloud*.35;hemi.color.set(cloud>.4?0xb3c2c9:0xc0d9e4);scene.fog.color.set(cloud>.4?0x94a7ad:0x9bb9c6);scene.fog.density=.000035+cloud*.00023;
    groundMaterial.roughness=1-wet*.22;groundMaterial.color.set(wet?0xbcb4a2:0xe9e2d3);
    renderer.toneMappingExposure=.85-cloud*.16;
    const hour=Math.floor(h),minutes=Math.round((h-hour)*60);$('hour-value').textContent=String(hour).padStart(2,'0')+':'+String(minutes).padStart(2,'0');
  }
  atmosphere();
  const rainArray=new Float32Array(1000*6),rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainArray,3));const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xcfdee1,transparent:true,opacity:.33,depthWrite:false}));rain.frustumCulled=false;rain.visible=false;scene.add(rain);
  const map=$('map'),ctx=map.getContext('2d'),mb={minX:meta.boundsMin[0]-450,minZ:meta.boundsMin[2]-450,width:meta.boundsMax[0]-meta.boundsMin[0]+900,height:meta.boundsMax[2]-meta.boundsMin[2]+900};map.height=Math.round(map.width*mb.height/mb.width);
  function mapPoint(x,z){return [(x-mb.minX)/mb.width*map.width,(z-mb.minZ)/mb.height*map.height];}
  function drawMap(){
    if($('map-panel').hidden)return;ctx.clearRect(0,0,map.width,map.height);ctx.fillStyle='#183c42';ctx.fillRect(0,0,map.width,map.height);ctx.strokeStyle='#b7d4c510';ctx.lineWidth=1;
    for(let x=0;x<map.width;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,map.height);ctx.stroke();}for(let y=0;y<map.height;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(map.width,y);ctx.stroke();}
    ctx.beginPath();meta.coast.forEach((p,i)=>{const [x,y]=mapPoint(...p);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.closePath();ctx.fillStyle='#99a995';ctx.fill();ctx.lineWidth=1;ctx.strokeStyle='#c3c9ac';ctx.stroke();
    const [sx,sz]=mapPoint(study.x,study.y);ctx.fillStyle='#edd6a8';ctx.beginPath();ctx.arc(sx,sz,5,0,Math.PI*2);ctx.fill();ctx.font='17px sans-serif';ctx.fillText('페트라',sx+12,sz+6);
    const [x,y]=mapPoint(camera.position.x,camera.position.z);ctx.save();ctx.translate(x,y);ctx.rotate(-state.yaw);ctx.fillStyle='#fff4c8';ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(-5,6);ctx.lineTo(5,6);ctx.closePath();ctx.fill();ctx.restore();
  }
  map.addEventListener('click',e=>{const r=map.getBoundingClientRect(),x=mb.minX+(e.clientX-r.left)/r.width*mb.width,z=mb.minZ+(e.clientY-r.top)/r.height*mb.height;camera.position.set(x,Math.max(25,(sample(x,z)?.height||0)+35),z);setMode('fly',false);state.pitch=-.2;scatter();notice('선택한 위치로 이동했습니다. F 키로 걸을 수 있습니다.');});
  $('coast-home').onclick=()=>{home();notice('페트라 해안으로 돌아왔습니다.');};
  function toggle(id,button){$(id).hidden=!$(id).hidden;$(button).setAttribute('aria-expanded',!$(id).hidden);if(id==='map-panel')drawMap();}
  $('map-toggle').onclick=()=>toggle('map-panel','map-toggle');$('info-toggle').onclick=()=>toggle('info-panel','info-toggle');$('info-close').onclick=()=>toggle('info-panel','info-toggle');
  $('walk').onclick=()=>setMode('walk');$('fly').onclick=()=>setMode('fly');$('hour').oninput=e=>{state.hour=+e.target.value;atmosphere();};$('weather').onchange=e=>{state.weather=e.target.value;atmosphere();};$('wind').oninput=e=>state.wind=+e.target.value;
  function hideUi(){state.hidden=!state.hidden;document.body.classList.toggle('hidden-ui',state.hidden);$('restore-ui').hidden=!state.hidden;}$('hide-ui').onclick=hideUi;$('restore-ui').onclick=hideUi;
  meta.attribution.forEach(c=>{const li=document.createElement('li'),a=document.createElement('a');a.href=c.url;a.target='_blank';a.rel='noopener';a.textContent=c.label;li.append(a);$('credits').append(li);});
  document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyF')setMode(state.mode==='walk'?'fly':'walk');if(e.code==='KeyH')hideUi();if(e.code==='Escape')keys.clear();});document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear();});
  let dragging=false,lastPointer=[0,0];const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastPointer=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;state.yaw-=(e.clientX-lastPointer[0])*.003;state.pitch=clamp(state.pitch-(e.clientY-lastPointer[1])*.003,-1.42,1.42);lastPointer=[e.clientX,e.clientY];});
  canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
  document.querySelectorAll('[data-move]').forEach(button=>{button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys.add(button.dataset.move);};button.onpointerup=()=>keys.delete(button.dataset.move);button.onpointercancel=()=>keys.delete(button.dataset.move);});
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  function move(dt){
    const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),s=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),n=Math.hypot(f,s)||1;
    const speed=(state.mode==='walk'?2.3:45)*(keys.has('ShiftLeft')||keys.has('ShiftRight')?state.mode==='walk'?2.6:5:1);
    let dx=(-Math.sin(state.yaw)*f+Math.cos(state.yaw)*s)/n*speed*dt,dz=(-Math.cos(state.yaw)*f-Math.sin(state.yaw)*s)/n*speed*dt;
    if(state.mode==='walk'){
      const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.3));dx/=steps;dz/=steps;
      for(let i=0;i<steps;i++){const x=camera.position.x+dx,z=camera.position.z+dz,g=sample(x,z);if(!g||g.height<.05||g.normalY<.5||Math.abs(g.height+1.72-camera.position.y)>1.0)break;let blocked=false;for(const c of colliders){if(Math.hypot(x-c.x,z-c.z)<c.r+.24&&c.height>g.height+.32){blocked=true;break;}}if(!blocked)camera.position.set(x,g.height+1.72,z);}
    }else{
      camera.position.x+=dx;camera.position.z+=dz;camera.position.y+=((keys.has('KeyE')?1:0)-(keys.has('KeyQ')?1:0))*speed*dt;
      const g=sample(camera.position.x,camera.position.z);camera.position.y=clamp(camera.position.y,Math.max(1.4,(g?.height||0)+1.3),9000);
    }
    camera.rotation.set(state.pitch,state.yaw,0);
  }
  if(document.modelContext?.registerTool){
    const life=new AbortController();let movingWithTool=false;
    const walkTool={name:'move_patmos_visitor',title:'밧모섬 안에서 직접 이동',description:'현재 탐험 모드에서 방문자를 짧게 이동합니다. 키보드와 동일한 지면·바위 충돌을 적용하며 위치를 순간 이동하지 않습니다.',inputSchema:{type:'object',properties:{direction:{type:'string',enum:['forward','back','left','right']},seconds:{type:'number',minimum:.1,maximum:2}},required:['direction','seconds'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async input=>{
      const key={forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD'}[input.direction];
      if(!key||!Number.isFinite(input.seconds)||input.seconds<.1||input.seconds>2||movingWithTool)throw Error('이동 입력을 확인해 주세요.');
      movingWithTool=true;const before=camera.position.toArray();keys.add(key);
      try{await new Promise(resolve=>setTimeout(resolve,input.seconds*1000));}finally{keys.delete(key);movingWithTool=false;}
      return {before,after:camera.position.toArray(),mode:state.mode,ground:sample(camera.position.x,camera.position.z),usesKeyboardMovement:true};
    }};
    try{Promise.resolve(document.modelContext.registerTool(walkTool,{signal:life.signal})).catch(()=>{});}catch{}
    addEventListener('pagehide',()=>life.abort(),{once:true});
  }
  // DOM-visible diagnostics describe the real runtime; they contain no private research.
  $('world').dataset.geometryVertices=String(meta.vertices);$('world').dataset.geometryTriangles=String(meta.triangles);$('world').dataset.eraStatus='not-yet-implemented';
  const clock=new THREE.Clock();let frames=0,frameTime=0,uiTime=0,time=0;
  renderer.setAnimationLoop(()=>{
    const elapsed=clock.getDelta(),dt=Math.min(elapsed,.05);time+=dt;move(dt);scatter();
    sky.mesh.position.copy(camera.position);sky.update(time,skySun,cloud);sunlight.target.position.copy(camera.position);sunlight.target.position.y-=1.5;sunlight.position.copy(sunlight.target.position).addScaledVector(skySun,700);
    ocean.update({time,sunDirection:skySun,cameraPosition:camera.position,cloud,wind:state.wind});
    for(const p of plantUniforms){p.t.value=time;p.w.value=state.wind;}
    rain.visible=wet>0;if(wet){for(let i=0;i<1000;i++){const x=hash(i,1)*55-27.5,z=hash(i,2)*55-27.5,y=(hash(i,3)*35-time*17)%35;const j=i*6;rainArray[j]=camera.position.x+x;rainArray[j+1]=camera.position.y+(y+35)%35-10;rainArray[j+2]=camera.position.z+z;rainArray[j+3]=rainArray[j]-.3-state.wind;rainArray[j+4]=rainArray[j+1]-1.7;rainArray[j+5]=rainArray[j+2]+.2;}rainGeo.attributes.position.needsUpdate=true;}
    renderer.render(scene,camera);frames++;frameTime+=elapsed;uiTime+=dt;
    if(uiTime>.2){uiTime=0;const geo=toWgs84(camera.position.x,camera.position.z,meta.originUtm);$('position').textContent=`${geo.lat.toFixed(5)}° N · ${geo.lon.toFixed(5)}° E · ${Math.round(camera.position.y)} m`;$('world').dataset.position=JSON.stringify(camera.position.toArray());$('world').dataset.mode=state.mode;$('place-name').textContent=Math.hypot(camera.position.x-study.x,camera.position.z-study.y)<550?'페트라의 해안':'밧모의 능선과 만';const heading=((-state.yaw*180/Math.PI)%360+360)%360;$('compass').textContent=['북','북동','동','남동','남','남서','서','북서'][Math.round(heading/45)%8]+' '+Math.round(heading)+'°';drawMap();}
    if(frameTime>2){$('performance').textContent=Math.round(frames/frameTime)+' fps';$('world').dataset.drawCalls=String(renderer.info.render.calls);$('world').dataset.renderTriangles=String(renderer.info.render.triangles);frames=0;frameTime=0;}
  });
  $('loading').classList.add('loaded');setTimeout(()=>$('loading').hidden=true,900);
}
start().catch(error=>{console.error(error);$('loading').querySelector('h1').textContent='탐험 화면을 열지 못했습니다';$('load-detail').textContent=error.message;$('loading').style.pointerEvents='auto';});
