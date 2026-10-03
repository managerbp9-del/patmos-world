import * as THREE from 'three';
import {createGroundSampler} from './terrain.js?v=journey-5.1';
import {createMiniSea} from './ocean.js?v=journey-5.1';
import {createSky} from './sky.js?v=journey-5.1';
import {createHarbor} from './harbor.js?v=journey-5.1';
import {createSanctuaries} from './sanctuaries.js?v=journey-5.1';
import {createCoastalHubs} from './coastal-hubs.js?v=journey-5.1';
import {createVoyage} from './voyage.js?v=journey-5.1';
import {JOURNEY} from './journey-data.js?v=journey-5.1';

const $=id=>document.getElementById(id),clamp=THREE.MathUtils.clamp;
const S=.035,V=.072; // Render only: shared geographic source remains unchanged.
const rand=(a,b=0)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453123;return v-Math.floor(v);};
let toast;
function notice(text){$('notice').textContent=text;$('notice').classList.add('visible');clearTimeout(toast);toast=setTimeout(()=>$('notice').classList.remove('visible'),3200);}
const places=[
 {id:'olive',name:'올리브 관목길',x:-88,z:24,note:'스칼라 남서 사면을 참고한 올리브길입니다.'},
 {id:'garden',name:'그리코스의 그늘',x:-40,z:94,note:'넝쿨과 돌담 뜰은 원작의 비와 눈물을 바탕으로 한 공간입니다.'},
 {id:'landing',name:'작은 정박지',x:-81.878,z:3.715,kicker:'01 · 섬으로 들어오는 길',description:'젖은 나무 부두, 조용히 흔들리는 돛. 물 위에 길게 놓인 빛을 따라 잠시 머물러 보세요.',note:'스칼라 주변의 위치를 참고한 고대 해안 생활의 시각적 재구성입니다.'},
 {id:'cave',name:'계시의 동굴',x:-81.134,z:40.051,kicker:'02 · 고요히 귀 기울이는 곳',description:'암반의 그늘과 올리브빛 나무 사이. 바다가 내려다보이는 조용한 길을 걸어보세요.',note:'요한과 관련된 동굴의 전승을 참고했습니다. 동굴 외형과 주변 길은 탐험용 재구성입니다.'},
 {id:'petra',name:'페트라의 바위',x:-26.527,z:108.321,kicker:'03 · 물과 돌이 만나는 자리',description:'둥근 바위 아래로 얕은 물이 반짝입니다. 갈매기와 물고기의 움직임을 찾아보세요.',note:'칼리카추의 위치를 바탕으로 암반 형태를 캐주얼하게 단순화했습니다.'},
 {id:'north',name:'북쪽의 작은 만',x:-6.004,z:-103.379,kicker:'04 · 바람이 머무는 들판',description:'풀을 뜯는 염소와 낮은 돌담. 바람에 흔들리는 나뭇잎 사이로 걸어보세요.',note:'캄보스 주변의 지형을 참고한 목가적 풍경입니다. 농가와 동물은 풍경 보완용입니다.'},
 {id:'ridge',name:'바람의 언덕',x:-96.103,z:94.364,kicker:'05 · 섬을 바라보는 시간',description:'굽이치는 해안과 겹쳐진 먼 능선. 해무 너머로 섬이 이어지는 모습을 바라보세요.',note:'남서쪽 능선의 위치를 참고했습니다. 후대의 교회나 수도원은 표현하지 않았습니다.'}
];

async function start(){
 const mobile=matchMedia('(max-width:800px)').matches;
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.6));renderer.setSize(innerWidth,innerHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.91;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$('world').append(renderer.domElement);
 const scene=new THREE.Scene();const hazeColor=new THREE.Color('#a1aaa1');scene.background=hazeColor.clone();scene.fog=new THREE.FogExp2(hazeColor,.0055);
 const sky=createSky();scene.add(sky.mesh);const sunDirection=new THREE.Vector3(.4,.16,-.85).normalize();
 const camera=new THREE.PerspectiveCamera(innerWidth/innerHeight<.85?52:42,innerWidth/innerHeight,.15,2300);
 const hemi=new THREE.HemisphereLight('#b5c4c4','#716859',1.7);scene.add(hemi);
 const sun=new THREE.DirectionalLight('#ffe0a2',3.2);sun.position.set(-180,270,150);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-260,right:260,top:260,bottom:-260,near:1,far:850});sun.shadow.bias=-.00025;sun.shadow.normalBias=.04;sun.shadow.radius=3;scene.add(sun,sun.target);
 const read=async(path,binary=false)=>{const r=await fetch(path);if(!r.ok)throw Error('불러오기 실패: '+path);return binary?r.arrayBuffer():r.json();};
 const [meta,pb,ib,sb]=await Promise.all([read('./data/terrain.json'),read('./data/terrain-positions.bin',true),read('./data/terrain-indices.bin',true),read('./data/shore-distance.bin',true)]);
 const original=new Float32Array(pb),indices=new Uint32Array(ib),baseSample=createGroundSampler(original,indices);
 const ground=(x,z)=>{const a=baseSample(x/S,z/S);return a?{height:a.height*V,slope:a.normalY}:null;};
 const nearest=(x,z,min=.12)=>{for(let r=0;r<18;r+=.7)for(let i=0;i<(r?16:1);i++){const a=i*Math.PI/8,nx=x+Math.sin(a)*r,nz=z+Math.cos(a)*r,g=ground(nx,nz);if(g&&g.height>min&&g.slope>.7)return new THREE.Vector3(nx,g.height,nz);}return new THREE.Vector3(x,1,z);};
 const positions=new Float32Array(original.length),colors=new Float32Array(original.length);
 const ochre=new THREE.Color('#8b8468'),grass=new THREE.Color('#5e6851'),rock=new THREE.Color('#99917f'),sand=new THREE.Color('#b5ab8d'),color=new THREE.Color();
 for(let i=0;i<original.length;i+=3){let x=original[i],y=original[i+1],z=original[i+2];positions[i]=x*S;positions[i+1]=y*V;positions[i+2]=z*S;let v=(Math.sin(x*.003)+Math.cos(z*.004)+2)/4;color.copy(ochre).lerp(grass,v*.8);if(y>150)color.lerp(rock,clamp((y-150)/110,0,1)*.7);if(y<15)color.lerp(sand,1-clamp(y/15,0,1));color.multiplyScalar(.94+rand(Math.floor(x/50),Math.floor(z/50))*.09);color.toArray(colors,i);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeVertexNormals();
 const normal=geometry.attributes.normal,n=new THREE.Vector3();
 for(let i=0;i<original.length;i+=3){const x=original[i],y=original[i+1],z=original[i+2],l=baseSample(x-12,z)?.height??y,r=baseSample(x+12,z)?.height??y,a=baseSample(x,z-12)?.height??y,b=baseSample(x,z+12)?.height??y;n.set((l-r)*V,24*S,(a-b)*V).normalize();normal.setXYZ(i/3,n.x,n.y,n.z);}
 const terrainCanvas=document.createElement('canvas');terrainCanvas.width=terrainCanvas.height=512;const terrainContext=terrainCanvas.getContext('2d');const terrainPixels=terrainContext.createImageData(512,512);for(let i=0;i<512*512;i++){const v=175+rand(i,132)*65;terrainPixels.data.set([v,v*.97,v*.91,255],i*4);}terrainContext.putImageData(terrainPixels,0,0);for(let i=0;i<2800;i++){const x=rand(i,133)*512,y=rand(i,134)*512;terrainContext.fillStyle=i%3?'#807c6b':'#d4cabb';terrainContext.beginPath();terrainContext.ellipse(x,y,.5+rand(i,135)*1.8,.4+rand(i,136),rand(i,137)*3,0,Math.PI*2);terrainContext.fill();}const terrainTexture=new THREE.CanvasTexture(terrainCanvas);terrainTexture.colorSpace=THREE.SRGBColorSpace;terrainTexture.wrapS=terrainTexture.wrapT=THREE.RepeatWrapping;terrainTexture.anisotropy=4;const terrainUV=new Float32Array(original.length/3*2);for(let i=0;i<positions.length/3;i++){terrainUV[i*2]=positions[i*3]*.24;terrainUV[i*2+1]=positions[i*3+2]*.24;}geometry.setAttribute('uv',new THREE.BufferAttribute(terrainUV,2));
 const terrain=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,map:terrainTexture,bumpMap:terrainTexture,bumpScale:.08,roughness:.95}));terrain.receiveShadow=true;scene.add(terrain);
 const shore=new THREE.DataTexture(new Uint8Array(sb),512,512);shore.minFilter=shore.magFilter=THREE.LinearFilter;shore.needsUpdate=true;
 const sea=createMiniSea(shore,meta.shoreDistance);scene.add(sea.mesh);
 const reflectionTarget=new THREE.WebGLRenderTarget(mobile?384:768,mobile?384:768,{type:THREE.HalfFloatType,depthBuffer:true});sea.uniforms.reflection.value=reflectionTarget.texture;
 const mirror=new THREE.PerspectiveCamera();const bias=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
 let harbor=null;
 const mats={};for(const [key,value] of Object.entries({stone:'#c1ad88',lightStone:'#dbc69f',wood:'#72533b',roof:'#b77451',wall:'#dbc8a3',dark:'#463f31',leaf:'#414f3b',leafLight:'#697359',leafDark:'#344536',grass:'#b9b16d',cloth:'#eee0b5',pot:'#b96e45',goat:'#e7dfbf'}))mats[key]=new THREE.MeshStandardMaterial({color:value,roughness:.94,flatShading:false});
 const geo={box:new THREE.BoxGeometry(1,1,1),ball:new THREE.IcosahedronGeometry(1,1),rough:new THREE.IcosahedronGeometry(1,0),pole:new THREE.CylinderGeometry(.08,.11,1,5),cone:new THREE.ConeGeometry(1,1,5)};
 const colliders=[],sway=[],boats=[],gulls=[],goats=[],fish=[];
 function mesh(g,m,pos,scale,parent=scene){const o=new THREE.Mesh(g,m);o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(mat,pos,scale,parent){return mesh(geo.box,mat,pos,scale,parent);}
 function stone(x,z,size=1){const h=ground(x,z)?.height;if(h===undefined||h<.05)return;const o=mesh(geo.ball,mats.stone,[x,h+size*.3,z],[size,size*.7,size*.85]);o.rotation.set(rand(x,z),rand(z,x)*6,rand(x,z)*.3);return o;}
 function tree(x,z,size=1){const h=ground(x,z)?.height;if(h===undefined||h<.1)return;const g=new THREE.Group();g.position.set(x,h,z);scene.add(g);mesh(geo.pole,mats.wood,[0,1.05*size,0],[size,2.1*size,size],g);const crown=new THREE.Group();crown.position.y=1.8*size;g.add(crown);for(let i=0;i<3;i++){const a=i*2.1;mesh(geo.ball,i===1?mats.leafLight:mats.leaf,[Math.cos(a)*.5*size,.18*i*size,Math.sin(a)*.5*size],[1.1*size,.72*size,.95*size],crown);}sway.push({node:crown,phase:rand(x,z)*6,amount:.035});}
 function house(x,z,size=1,angle=0){const h=ground(x,z)?.height;if(h===undefined||h<.15)return;const g=new THREE.Group();g.position.set(x,h,z);g.rotation.y=angle;scene.add(g);box(mats.wall,[0,1.1*size,0],[3*size,2.2*size,2.4*size],g);box(mats.roof,[0,2.25*size,0],[3.25*size,.18*size,2.65*size],g);box(mats.dark,[0,.65*size,1.208*size],[.55*size,1.3*size,.018],g);box(mats.dark,[-.95*size,1.35*size,1.212*size],[.4*size,.5*size,.025],g);box(mats.wood,[.8*size,1.9*size,2*size],[1.6*size,.09*size,1.9*size],g);for(const dx of [.1,1.5])mesh(geo.pole,mats.wood,[dx*size,.95*size,2.8*size],[.45*size,1.9*size,.45*size],g);colliders.push({x,z,r:1.6*size});return g;}
 function pot(x,z,size=.4){const h=ground(x,z)?.height;if(h===undefined||h<0)return;mesh(geo.ball,mats.pot,[x,h+size*.7,z],[size,size*.9,size]);mesh(new THREE.TorusGeometry(size*.35,size*.08,4,8),mats.pot,[x,h+size*1.5,z],[1,1,1]).rotation.x=Math.PI/2;}
 function path(points){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],0,p[1]))),data=[];let prev;
  for(const p of curve.getPoints(180)){const h=ground(p.x,p.z);if(!h||h.height<.06){prev=null;continue;}if(prev){const dx=p.x-prev.x,dz=p.z-prev.z,len=Math.hypot(dx,dz),w=.55,nx=-dz/len*w,nz=dx/len*w;const corners=[[prev.x+nx,prev.z+nz],[prev.x-nx,prev.z-nz],[p.x+nx,p.z+nz],[p.x-nx,p.z-nz]];const q=corners.map(([x,z])=>[x,(ground(x,z)?.height??h.height)+.07,z]);for(const j of [0,1,2,2,1,3])data.push(...q[j]);}prev=p;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data,3));g.computeVertexNormals();const o=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#99876c',roughness:1,side:THREE.DoubleSide}));o.receiveShadow=true;scene.add(o);}
 $('load-detail').textContent='나무, 작은 집과 바닷길을 놓습니다';
 for(const p of places){p.point=nearest(p.x,p.z);p.x=p.point.x;p.z=p.point.z;}
 // Deterministic, sparse native-looking scrub; species are artistic approximations.
 for(let i=0;i<470;i++){const x=-142+rand(i,7)*276,z=-218+rand(i,11)*436,h=ground(x,z);if(!h||h.height<.35||h.slope<.77)continue;const busy=places.some(p=>Math.hypot(p.x-x,p.z-z)<18);if(busy)continue;if(!busy&&rand(i,3)>.26)tree(x,z,.45+rand(i,19)*.7);else if(!busy)stone(x,z,.35+rand(i,21)*1.1);}
 const bladeGeometry=new THREE.BufferGeometry();bladeGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.13,0,0,.13,0,0,0,.8,.04,0,0,-.1,0,0,.1,.04,.6,0],3));bladeGeometry.computeVertexNormals();
 const grassMat=mats.grass.clone();grassMat.side=THREE.DoubleSide;const windUniform={value:.45},timeUniform={value:0};grassMat.onBeforeCompile=s=>{s.uniforms.breeze=windUniform;s.uniforms.elapsed=timeUniform;s.vertexShader='uniform float breeze;uniform float elapsed;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(elapsed*2.+instanceMatrix[3].x*.4+instanceMatrix[3].z*.2)*position.y*position.y*breeze*.35;');};
 const grassMesh=new THREE.InstancedMesh(bladeGeometry,grassMat,3200),dummy=new THREE.Object3D();let grassCount=0;
 for(let i=0;i<6000&&grassCount<3200;i++){let x=-142+rand(i,32)*276,z=-218+rand(i,33)*436,h=ground(x,z);if(!h||h.height<.2||h.slope<.74)continue;dummy.position.set(x,h.height,z);dummy.scale.setScalar(.25+rand(i,34)*.45);dummy.rotation.y=rand(i,35)*6;dummy.updateMatrix();grassMesh.setMatrixAt(grassCount++,dummy.matrix);}grassMesh.count=grassCount;grassMesh.receiveShadow=true;scene.add(grassMesh);
 const placeById=Object.fromEntries(places.map(p=>[p.id,p]));const {landing,cave,petra,north,ridge}=placeById;
 for(const [dx,dz,s,a] of [[-8,-7,.8,-.5],[6,-9,.7,.1]])house(landing.x+dx,landing.z+dz,s,a);
 for(let i=0;i<9;i++)pot(landing.x-5+rand(i,40)*10,landing.z-3+rand(i,41)*9,.25+rand(i,42)*.2);
 // Detailed olive trees are authored in the harbor module.
 path([[landing.x,landing.z],[landing.x-3,landing.z+12],[cave.x+4,cave.z-7],[cave.x,cave.z],[ridge.x+12,ridge.z-18],[ridge.x,ridge.z]]);
 path([[cave.x,cave.z],[cave.x+12,cave.z+17],[-61,85],[petra.x-6,petra.z],[petra.x,petra.z]]);
 function boat(x,z,scale=1,sail=true){const g=new THREE.Group();g.position.set(x,.1,z);scene.add(g);const hull=mesh(geo.ball,mats.wood,[0,.25,0],[1.1*scale,.38*scale,2.6*scale],g);hull.rotation.z=Math.PI;box(mats.dark,[0,.46*scale,0],[1.3*scale,.05,3.6*scale],g);for(let i=-1;i<=1;i++)box(mats.lightStone,[0,.52*scale,i*.85*scale],[1.5*scale,.09,.2],g);if(sail){mesh(geo.pole,mats.wood,[0,2.35*scale,0],[.7*scale,4.2*scale,.7*scale],g);const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute([0,.9,0,0,4.2,0,2.1,1.05,0],3));sg.computeVertexNormals();const sm=mats.cloth.clone();sm.side=THREE.DoubleSide;mesh(sg,sm,[0,0,0],[scale,scale,scale],g);}boats.push({g,base:new THREE.Vector3(x,.1,z),phase:rand(x,z)*6});return g;}
 // Place vessels only over the contemporary water mask, not on land.
 function waterNear(p,minR=4){for(let r=minR;r<32;r+=1.2)for(let i=0;i<24;i++){const a=i*Math.PI/12,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r,h=ground(x,z);if(!h||h.height<-.01)return new THREE.Vector3(x,0,z);}return new THREE.Vector3(p.x+15,0,p.z);}
 const waterLanding=waterNear(landing);
 harbor=createHarbor({scene,ground,shore:waterLanding,land:landing.point});colliders.push(...harbor.colliders);
 const offshore=waterLanding.clone().sub(landing.point).setY(0).normalize();sunDirection.copy(offshore).applyAxisAngle(new THREE.Vector3(0,1,0),-.38).setY(.17).normalize();
 // Local shadows retain plank/rope contact while the island remains freely explorable.
 sun.target.position.copy(harbor.focus);sun.position.copy(harbor.focus).addScaledVector(sunDirection,260);Object.assign(sun.shadow.camera,{left:-43,right:43,top:43,bottom:-43,near:1,far:460});sun.shadow.camera.updateProjectionMatrix();
 if(sea.uniforms.sunDirection)sea.uniforms.sunDirection.value.copy(sunDirection);if(sea.uniforms.fogColor)sea.uniforms.fogColor.value.copy(hazeColor);if(sea.uniforms.fogDensity)sea.uniforms.fogDensity.value=.0055;
 const waterPetra=waterNear(petra,9);
 const white=new THREE.MeshStandardMaterial({color:'#fff5d7',roughness:.85,side:THREE.DoubleSide});
 const wingGeometry=new THREE.BufferGeometry();wingGeometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1.2,.15,.25,.35,0,-.26],3));wingGeometry.computeVertexNormals();
 for(let i=0;i<15;i++){const g=new THREE.Group(),l=new THREE.Mesh(wingGeometry,white),r=new THREE.Mesh(wingGeometry,white);r.scale.x=-1;g.add(l,r);g.scale.setScalar(.32+rand(i,62)*.16);scene.add(g);gulls.push({g,l,r,phase:i*.7,center:i<8?waterPetra:waterLanding,radius:5+rand(i,63)*13,height:5+rand(i,64)*9});}
 for(let i=0;i<8;i++){const g=new THREE.Group();scene.add(g);mesh(geo.ball,mats.goat,[0,.58,0],[.62,.38,.28],g);const head=mesh(geo.rough,mats.goat,[.63,.66,0],[.24,.3,.21],g);const legs=[];for(const x of [-.37,.37])for(const z of [-.18,.18])legs.push(mesh(geo.pole,mats.wood,[x,.22,z],[.6,.46,.6],g));for(const z of [-.13,.13])mesh(geo.cone,mats.wood,[.64,1,z],[.06,.25,.06],g);goats.push({g,head,legs,phase:i*.9,center:new THREE.Vector2(north.x-6+rand(i,72)*13,north.z+rand(i,73)*6)});}
 const fishMat=new THREE.MeshBasicMaterial({color:'#335e54',transparent:true,opacity:.48});
 for(let i=0;i<22;i++){const g=new THREE.Group();mesh(geo.rough,fishMat,[0,0,0],[.14,.045,.38],g);const tail=mesh(geo.cone,fishMat,[0,0,.4],[.19,.3,.06],g);tail.rotation.x=Math.PI/2;g.position.y=-.02;scene.add(g);fish.push({g,phase:i*.8,center:i<12?waterPetra:waterLanding});}
 const rainGeometry=new THREE.BufferGeometry(),rainPositions=new Float32Array(600*6);rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));const rainLines=new THREE.LineSegments(rainGeometry,new THREE.LineBasicMaterial({color:'#ddeae1',transparent:true,opacity:.42,depthWrite:false}));rainLines.visible=false;rainLines.frustumCulled=false;scene.add(rainLines);
 const points=Object.fromEntries(places.map(p=>[p.id,p.point]));
 const sanctuaries=createSanctuaries({scene,ground,points});
 const coastHubs=createCoastalHubs({scene,ground,points});
 const voyage=createVoyage(scene);
 const seaPoint=new THREE.Vector3(-20,0,7);
 const views={landing:harbor.view,...sanctuaries.views,...coastHubs.views,sea:{target:new THREE.Vector3(-19,1.5,-2),position:new THREE.Vector3(3,5.5,22)}};
 const seaPlace={id:'sea',name:'섬 앞의 바다',point:seaPoint,note:'밧모섬으로 다가가는 바다. 향유고래의 숨과 수평선을 관찰합니다.'};places.push(seaPlace);placeById.sea=seaPlace;
 const fullRadius=()=>1.27*Math.max(360/camera.aspect,340)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
 const orbit={target:harbor.view.target.clone(),radius:18,theta:0,phi:1.25};
 const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
 let episodeIndex=1,activePlace='landing',mode='observe',trip=null,paused=reducedMotion,elapsed=0,currentLook=harbor.view.target.clone(),drag=null;
 const atmosphere={...JOURNEY[1].atmosphere},fogColor=new THREE.Color(atmosphere.fogColor),targetFog=fogColor.clone();
 let atmosphereGoal=JOURNEY[1].atmosphere;
 const visited=new Set();try{for(const id of JSON.parse(localStorage.getItem('patmos-visited-v1')||'[]'))visited.add(id);}catch{}
 const projected=new THREE.Vector3(),pointer=new Map(),boatDock=harbor.boatSpawn.clone(),boatDockYaw=harbor.heroBoat.rotation.y;
 const boatDestination=boatDock.clone();let boatYawGoal=boatDockYaw;
 const labelFor=e=>e.id==='P'?'프롤로그':e.id==='E'?'에필로그':`${e.chapter}장`;
 const currentEpisode=()=>episodeIndex>=0?JOURNEY[episodeIndex]:null;
 const updateWeatherText=e=>{$('scene-weather').textContent=e?`${e.environment.time} · ${e.environment.weather}`:'늦은 오후 · 바람이 머무는 들판';};
 function fitView(view){return {target:view.target.clone(),position:view.position.clone()};}
 function setOrbit(view){orbit.target.copy(view.target);const offset=view.position.clone().sub(view.target);orbit.radius=offset.length();orbit.phi=clamp(Math.acos(offset.y/orbit.radius),.18,1.51);orbit.theta=Math.atan2(offset.x,offset.z);}
 function orbitPosition(){return new THREE.Vector3(orbit.target.x+Math.sin(orbit.theta)*Math.sin(orbit.phi)*orbit.radius,orbit.target.y+Math.cos(orbit.phi)*orbit.radius,orbit.target.z+Math.cos(orbit.theta)*Math.sin(orbit.phi)*orbit.radius);}
 function keepAboveTerrain(p){const g=ground(p.x,p.z);p.y=Math.max(p.y,g?g.height+1.2:.65);return p;}
 function updateUI(){
  const e=currentEpisode(),p=placeById[activePlace];
  $('place-kicker').textContent=e?`${labelFor(e)} · ${p.name}`:'섬의 풍경 · 북쪽의 작은 만';
  $('place-name').textContent=e?e.title:p.name;$('place-description').textContent=e?e.meaning:'돌담과 올리브 그늘 사이, 바람에 흔들리는 풀과 쉬어 가는 염소를 바라보세요.';
  $('chapter-position').textContent=e?`${String(episodeIndex+1).padStart(2,'0')} / 24`:'섬의 풍경';
  $('chapter-current').textContent=e?`${labelFor(e)} · ${p.name}`:p.name;
  $('previous').disabled=episodeIndex<=0;
  $('next').textContent=episodeIndex===JOURNEY.length-1?'처음으로 ↺':episodeIndex<0?'여정으로 돌아가기 →':`${labelFor(JOURNEY[episodeIndex+1])}으로 →`;
  $('next').disabled=mode==='travel';$('previous').disabled=episodeIndex<=0||mode==='travel';
  $('journal-open').textContent=e?.sketch?'그림과 장면 해설':'장면 해설';
  updateWeatherText(e);
  for(const [i,b]of [...$('chapter-list').children].entries()){b.setAttribute('aria-current',i===episodeIndex?'step':'false');b.classList.toggle('visited',visited.has(JOURNEY[i].id));}
  for(const p2 of places)p2.label?.setAttribute('aria-pressed',String(p2.id===activePlace));
 }
 function remember(){const e=currentEpisode();if(e){visited.add(e.id);try{localStorage.setItem('patmos-visited-v1',JSON.stringify([...visited]));}catch{}}}
 function arrive(){if(!trip)return;harbor.heroBoat.position.copy(boatDestination);harbor.heroBoat.rotation.y=boatYawGoal;setOrbit(trip.end);camera.position.copy(keepAboveTerrain(trip.end.position.clone()));currentLook.copy(trip.end.target);camera.lookAt(currentLook);trip=null;mode='observe';$('travel').hidden=true;$('observation-state').textContent='도착 · 자유롭게 둘러보세요';$('help').textContent='드래그로 둘러보기 · 휠로 가까이 · 다음 장은 원할 때';remember();updateUI();}
 function goToPlace(id,instant=false){
  pointer.clear();drag=null;activePlace=id;const end=fitView(views[id]);keepAboveTerrain(end.position);const from=camera.position.clone(),lookFrom=currentLook.clone();
  const length=from.distanceTo(end.position),same=length<16;
  const points=[from];for(const t of [.22,.5,.78]){const p=from.clone().lerp(end.position,t);const g=ground(p.x,p.z);p.y=Math.max(p.y,(g?.height||0)+(same?4:10)+Math.sin(t*Math.PI)*Math.min(10,length*.06));points.push(p);}points.push(end.position);
  trip={end,curve:new THREE.CatmullRomCurve3(points,false,'centripetal'),lookFrom,started:performance.now(),duration:clamp(3.4+length*.015,3.4,7.5)*1000};mode='travel';
  $('travel').hidden=false;$('travel-title').textContent=`${placeById[id].name}로 이동 중`;$('travel-progress').value=0;$('observation-state').textContent='자동 이동';$('help').textContent='풍경을 따라 이동합니다. 도착하면 자유롭게 둘러보세요.';
  if(id==='sea'){boatDestination.copy(seaPoint);boatYawGoal=-Math.PI/2;}else{boatDestination.copy(boatDock);boatYawGoal=boatDockYaw;}
  updateUI();if(instant||reducedMotion)arrive();
 }
 function selectEpisode(index,{instant=false}={}){
  if(!Number.isInteger(index)||index<0||index>=JOURNEY.length)return;
  episodeIndex=index;const e=JOURNEY[index];atmosphereGoal=e.atmosphere;targetFog.set(e.atmosphere.fogColor);
  $('chapters').close();$('journal').close();goToPlace(e.place,instant);
  const url=new URL(location.href);url.hash=`chapter-${e.id}`;history.replaceState(null,'',url);
 }
 function overview(){trip=null;mode='overview';$('travel').hidden=true;const v={target:new THREE.Vector3(-5,1,0),position:new THREE.Vector3()};orbit.target.copy(v.target);orbit.radius=fullRadius();orbit.theta=.15;orbit.phi=.88;$('observation-state').textContent='섬 전체 · 장소 이름을 눌러 이동';$('help').textContent='드래그로 섬 둘러보기 · 휠로 확대 · 장소 이름으로 자동 이동';$('next').disabled=false;$('previous').disabled=episodeIndex<=0;}
 function resetView(){if(mode==='travel')return;setOrbit(fitView(views[activePlace]));mode='observe';$('observation-state').textContent='자유롭게 둘러보세요';$('help').textContent='드래그로 둘러보기 · 휠로 가까이 · 다음 장은 원할 때';}
 function clean(){document.body.classList.toggle('clean');$('restore-ui').hidden=!document.body.classList.contains('clean');}
 for(const [i,e]of JOURNEY.entries()){
  const b=document.createElement('button');b.className='chapter-card';b.type='button';const number=document.createElement('span');number.className='chapter-number';number.textContent=e.id==='P'?'시작':e.id==='E'?'귀환':e.id;
  const text=document.createElement('span'),title=document.createElement('strong'),sub=document.createElement('small');title.textContent=e.title;sub.textContent=`${placeById[e.place].name} · ${e.environment.time}`;text.append(title,sub);b.append(number,text);b.onclick=()=>selectEpisode(i);$('chapter-list').append(b);
 }
 for(const p of places){const label=document.createElement('button');label.className='map-label';label.textContent=p.name;label.type='button';label.onclick=()=>{const index=JOURNEY.findIndex(e=>e.place===p.id);if(index>=0)selectEpisode(index);else{episodeIndex=-1;atmosphereGoal=JOURNEY[1].atmosphere;targetFog.set(atmosphereGoal.fogColor);goToPlace(p.id);}};$('labels').append(label);p.label=label;}
 $('overview').onclick=overview;$('reset-view').onclick=resetView;$('hide-ui').onclick=clean;$('restore-ui').onclick=clean;$('skip-travel').onclick=arrive;
 $('chapters-open').onclick=()=>{$('chapters').showModal();};$('chapters-close').onclick=()=>$('chapters').close();
 $('previous').onclick=()=>selectEpisode(Math.max(0,episodeIndex-1));$('next').onclick=()=>selectEpisode(episodeIndex<0?1:(episodeIndex+1)%JOURNEY.length);
 $('journal-open').onclick=()=>{const e=currentEpisode();$('journal-title').textContent=e?`${labelFor(e)} · ${e.title}`:placeById[activePlace].name;$('journal-meaning').textContent=e?.meaning||placeById[activePlace].note;$('journal-atmosphere').textContent=e?`${e.environment.time} / ${e.environment.weather} / ${e.environment.wind}`:'늦은 오후의 들판';$('journal-observations').textContent=e?.observations?.join(' · ')||'돌담 · 풀 · 올리브 그늘';$('journal-source').textContent=e?.chapter===19?'19장 묵상 원문은 아직 비어 있습니다. 현재는 성경 본문의 맥락에 따른 공간 해설이며, 원문을 추가할 예정입니다.':'이 해설은 작가의 묵상과 장면 구성을 바탕으로 정리한 공간 해석입니다. 묵상 원문과 구분됩니다.';const img=$('journal-sketch');img.hidden=!e?.sketch;if(e?.sketch){img.src=e.sketch;img.alt=`${labelFor(e)}의 원작 여행 스케치`;}$('journal-caption').hidden=!e?.sketch;$('journal').showModal();};$('journal-close').onclick=()=>$('journal').close();
 $('info-toggle').onclick=()=>$('info-panel').showModal();$('info-close').onclick=()=>$('info-panel').close();
 for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 function setPaused(){ $('motion').textContent=paused?'▶':'Ⅱ';$('motion').setAttribute('aria-pressed',String(paused));$('motion').setAttribute('aria-label',paused?'환경 움직임 재생':'환경 움직임 멈추기'); }setPaused();$('motion').onclick=()=>{paused=!paused;setPaused();};
 const canvas=renderer.domElement;canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('pointerdown',e=>{if(mode==='travel')return;canvas.setPointerCapture(e.pointerId);pointer.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={button:e.button};});
 canvas.addEventListener('pointermove',e=>{if(!pointer.has(e.pointerId)||mode==='travel')return;const before=pointer.get(e.pointerId);pointer.set(e.pointerId,{x:e.clientX,y:e.clientY});const dx=e.clientX-before.x,dy=e.clientY-before.y;
  if(pointer.size===2){const other=[...pointer.entries()].find(([id])=>id!==e.pointerId)[1];orbit.radius=clamp(orbit.radius+(Math.hypot(before.x-other.x,before.y-other.y)-Math.hypot(e.clientX-other.x,e.clientY-other.y))*.08,5,mode==='overview'?1200:80);return;}
  if(drag?.button===2||e.shiftKey){const speed=orbit.radius*.001;orbit.target.x-=dx*speed*Math.cos(orbit.theta)+dy*speed*Math.sin(orbit.theta);orbit.target.z+=dx*speed*Math.sin(orbit.theta)-dy*speed*Math.cos(orbit.theta);if(mode!=='overview'){const c=views[activePlace].target;orbit.target.x=clamp(orbit.target.x,c.x-12,c.x+12);orbit.target.z=clamp(orbit.target.z,c.z-12,c.z+12);}}else{orbit.theta-=dx*.0045;orbit.phi=clamp(orbit.phi+dy*.0035,.15,1.51);}});
 const release=e=>{pointer.delete(e.pointerId);if(!pointer.size)drag=null;};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);addEventListener('blur',()=>pointer.clear());
 canvas.addEventListener('wheel',e=>{e.preventDefault();if(mode!=='travel')orbit.radius=clamp(orbit.radius*Math.exp(e.deltaY*.001),5,mode==='overview'?1200:80);},{passive:false});
 addEventListener('keydown',e=>{if(e.target.matches('input,textarea')||document.querySelector('dialog[open]'))return;if(e.code==='KeyH')clean();if(e.code==='KeyR')resetView();if(mode==='travel')return;if(e.code==='ArrowLeft'){orbit.theta+=.10;e.preventDefault();}if(e.code==='ArrowRight'){orbit.theta-=.10;e.preventDefault();}if(e.code==='ArrowUp'){orbit.phi=clamp(orbit.phi-.08,.15,1.51);e.preventDefault();}if(e.code==='ArrowDown'){orbit.phi=clamp(orbit.phi+.08,.15,1.51);e.preventDefault();}if(e.code==='Equal')orbit.radius=Math.max(5,orbit.radius*.9);if(e.code==='Minus')orbit.radius=Math.min(mode==='overview'?1200:80,orbit.radius*1.1);});
 addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<.85?52:42;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(mode==='overview')orbit.radius=fullRadius();});
 addEventListener('hashchange',()=>{const id=location.hash.replace('#chapter-',''),index=JOURNEY.findIndex(e=>e.id===id);if(index>=0&&index!==episodeIndex)selectEpisode(index);});
 const hashId=location.hash.replace('#chapter-','');const initial=JOURNEY.findIndex(e=>e.id===hashId);const initialIndex=initial<0?1:initial;
 camera.position.copy(harbor.view.position);$('loading').hidden=true;selectEpisode(initialIndex,{instant:true});Object.assign(atmosphere,atmosphereGoal);fogColor.copy(targetFog);
 if(document.modelContext?.registerTool)document.modelContext.registerTool({name:'observe_patmos_journey',description:'Select one of the24 authored Patmos scenes and take the same automatic journey as the chapter menu. Query arrival state, fixed weather and observation camera.',inputSchema:{type:'object',properties:{chapter:{type:'string',enum:JOURNEY.map(e=>e.id)},overview:{type:'boolean'},skipTravel:{type:'boolean'},rotate:{type:'number',minimum:-3.14,maximum:3.14}},additionalProperties:false},annotations:{readOnlyHint:false},execute:async({chapter,overview:showAll,skipTravel,rotate}={})=>{if(chapter)selectEpisode(JOURNEY.findIndex(e=>e.id===chapter));if(showAll)overview();if(skipTravel)arrive();if(typeof rotate==='number'&&mode!=='travel')orbit.theta+=rotate;return {chapter:currentEpisode()?.id??null,place:activePlace,mode,weather:currentEpisode()?.environment??null,atmosphere:{...atmosphere,fogColor:fogColor.getStyle()},camera:camera.position.toArray(),target:currentLook.toArray(),boat:harbor.heroBoat.position.toArray(),visited:[...visited],drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}});
 let last=performance.now(),frames=0,fpsTime=0,frame=0;const look=new THREE.Vector3(),mirroredLook=new THREE.Vector3(),clipPlane=new THREE.Plane(new THREE.Vector3(0,1,0),.1),clip=new THREE.Vector4(),q=new THREE.Vector4();
 const numericAtmosphere=['sunHeight','sunIntensity','hemiIntensity','exposure','fogDensity','cloud','wind','rain','night'];
 const warmLight=new THREE.Color('#ffe0a2'),moonLight=new THREE.Color('#a8c5ea'),dayHemi=new THREE.Color('#b5c4c4'),nightHemi=new THREE.Color('#8ca4c4');
 const sunAzimuth=offshore.clone().applyAxisAngle(new THREE.Vector3(0,1,0),-.38).normalize();
 function animate(now){requestAnimationFrame(animate);const raw=(now-last)/1000,dt=Math.min(.05,raw);last=now;if(!paused)elapsed+=dt;frame++;frames++;fpsTime+=raw;if(fpsTime>1){$('status').textContent=`${Math.round(frames/fpsTime)} fps`;frames=0;fpsTime=0;}
  if(trip){const linear=clamp((now-trip.started)/trip.duration,0,1),t=linear*linear*(3-2*linear);camera.position.copy(keepAboveTerrain(trip.curve.getPoint(t)));currentLook.copy(trip.lookFrom).lerp(trip.end.target,t);$('travel-progress').value=linear*100;if(linear>=1)arrive();}
  else{camera.position.copy(keepAboveTerrain(orbitPosition()));currentLook.copy(orbit.target);}camera.up.set(0,1,0);camera.lookAt(currentLook);look.copy(currentLook);
  const blend=1-Math.exp(-dt*1.6);for(const k of numericAtmosphere)atmosphere[k]=THREE.MathUtils.lerp(atmosphere[k],atmosphereGoal[k],blend);fogColor.lerp(targetFog,blend);
  const wind=atmosphere.wind;const sh=atmosphere.sunHeight,horizontal=Math.sqrt(Math.max(0,1-sh*sh));sunDirection.set(sunAzimuth.x*horizontal,sh,sunAzimuth.z*horizontal);
  sun.intensity=atmosphere.sunIntensity;sun.color.copy(warmLight).lerp(moonLight,atmosphere.night);hemi.intensity=atmosphere.hemiIntensity;hemi.color.copy(dayHemi).lerp(nightHemi,atmosphere.night);renderer.toneMappingExposure=atmosphere.exposure;
  sun.target.position.lerp(mode==='overview'?placeById[activePlace].point:currentLook,Math.min(1,dt*3));const lightDir=sunDirection.clone();if(sh<0)lightDir.setY(.38).normalize();sun.position.copy(sun.target.position).addScaledVector(lightDir,260);
  scene.fog.color.copy(fogColor);scene.background.copy(fogColor);scene.fog.density=THREE.MathUtils.lerp(atmosphere.fogDensity,.0006,clamp((camera.position.y-25)/130,0,1));
  sky.update(elapsed,sunDirection,atmosphere.cloud);sky.mesh.position.copy(camera.position);
  sea.uniforms.fogColor.value.copy(fogColor);sea.uniforms.fogDensity.value=scene.fog.density;sea.uniforms.sunDirection.value.copy(sunDirection);sea.uniforms.sunColor.value.setRGB(1,.77,.48).multiplyScalar(1-atmosphere.night*.985);sea.uniforms.time.value=elapsed;sea.uniforms.wind.value=wind;sea.uniforms.rain.value=atmosphere.rain;sea.uniforms.night.value=atmosphere.night;sea.uniforms.eye.value.copy(camera.position);
  harbor.heroBoat.position.lerp(boatDestination,Math.min(1,dt*.65));harbor.heroBoat.rotation.y=THREE.MathUtils.lerp(harbor.heroBoat.rotation.y,boatYawGoal,Math.min(1,dt*.65));harbor.update(elapsed,wind,sea.waveHeight);sanctuaries.update(elapsed,wind);coastHubs.update(elapsed,wind);voyage.update(elapsed,activePlace==='sea');
  timeUniform.value=elapsed;windUniform.value=wind;for(const a of sway){a.node.rotation.z=Math.sin(elapsed*1.4+a.phase)*a.amount*wind;a.node.rotation.x=Math.cos(elapsed+a.phase)*a.amount*.5*wind;}
  for(const b of boats){b.g.position.y=b.base.y+Math.sin(elapsed*1.7+b.phase)*(.06+wind*.08);b.g.rotation.z=Math.sin(elapsed*1.2+b.phase)*.04*wind;b.g.rotation.y=.5+b.phase*.2;}
  for(const b of gulls){const a=elapsed*.16+b.phase;b.g.position.set(b.center.x+Math.cos(a)*b.radius,b.height+Math.sin(a*2),b.center.z+Math.sin(a)*b.radius*.65);b.g.rotation.y=-a;b.l.rotation.z=Math.sin(elapsed*5+b.phase)*.27;b.r.rotation.z=-b.l.rotation.z;b.g.visible=atmosphere.night<.65;}
  for(const a of goats){const t=elapsed*.18+a.phase,x=a.center.x+Math.sin(t)*1.7,z=a.center.y+Math.cos(t*.7)*1.7,h=ground(x,z);a.g.visible=!!(h&&h.height>.1);if(a.g.visible)a.g.position.set(x,h.height,z);a.g.rotation.y=t*.7;a.head.rotation.z=Math.sin(elapsed*.8+a.phase)*.25-.2;for(let i=0;i<4;i++)a.legs[i].rotation.z=Math.sin(elapsed*2+a.phase+i%2*Math.PI)*.13;}
  for(const f of fish){const a=elapsed*.4+f.phase,x=f.center.x+Math.cos(a)*3.2,z=f.center.z+Math.sin(a*1.1)*2.3,h=ground(x,z);f.g.visible=(!h||h.height<0)&&atmosphere.night<.5;f.g.position.set(x,-.025,z);f.g.rotation.y=-a+Math.PI/2;}
  rainLines.visible=atmosphere.rain>.025;rainLines.material.opacity=atmosphere.rain*.40;rainLines.geometry.setDrawRange(0,Math.floor(600*atmosphere.rain)*2);
  if(rainLines.visible){for(let i=0;i<600;i++){const x=camera.position.x+(rand(i,91)-.5)*50-wind*(elapsed%2),z=camera.position.z+(rand(i,92)-.5)*50,y=camera.position.y+18-((elapsed*14+rand(i,93)*40)%40);rainPositions.set([x,y,z,x-.1-wind*.3,y-.65,z],i*6);}rainGeometry.attributes.position.needsUpdate=true;}
  for(const p of places){projected.copy(p.point);projected.y+=4;projected.project(camera);p.label.hidden=mode!=='overview'||projected.z>1||Math.abs(projected.x)>.94||Math.abs(projected.y)>.9;p.label.style.left=(projected.x*.5+.5)*innerWidth+'px';p.label.style.top=(-projected.y*.5+.5)*innerHeight+'px';}
  if(frame%(mode==='overview'?3:mobile?2:1)===0){mirror.copy(camera);mirror.position.y=-camera.position.y-.16;mirroredLook.copy(look);mirroredLook.y=-look.y-.16;mirror.up.set(0,-1,0);mirror.lookAt(mirroredLook);mirror.updateMatrixWorld();const plane=clipPlane.clone().applyMatrix4(mirror.matrixWorldInverse);clip.set(plane.normal.x,plane.normal.y,plane.normal.z,plane.constant);const pm=mirror.projectionMatrix.elements;q.set((Math.sign(clip.x)+pm[8])/pm[0],(Math.sign(clip.y)+pm[9])/pm[5],-1,(1+pm[10])/pm[14]);clip.multiplyScalar(2/clip.dot(q));pm[2]=clip.x;pm[6]=clip.y;pm[10]=clip.z+1-.003;pm[14]=clip.w;sea.uniforms.reflectionMatrix.value.copy(bias).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);sea.mesh.visible=false;rainLines.visible=false;const shadows=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;sky.mesh.position.copy(mirror.position);renderer.setRenderTarget(reflectionTarget);renderer.render(scene,mirror);renderer.setRenderTarget(null);renderer.shadowMap.autoUpdate=shadows;sea.mesh.visible=true;rainLines.visible=atmosphere.rain>.025;}
  sky.mesh.position.copy(camera.position);renderer.render(scene,camera);
 }requestAnimationFrame(animate);
}
start().catch(error=>{console.error(error);$('loading').hidden=false;$('load-detail').textContent='화면을 불러오지 못했습니다. '+error.message;});
