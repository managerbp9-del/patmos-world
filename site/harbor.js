import * as THREE from 'three';

// An authored, explorable shoreline. All materials and geometry are generated
// locally; the landing's position and direction follow the island's ground mask.
export function createHarbor({scene, ground, shore, land}) {
  const seaDirection = new THREE.Vector3().subVectors(shore, land).setY(0).normalize();
  if (seaDirection.lengthSq() < .5) seaDirection.set(1, 0, 0);
  const yaw = Math.atan2(seaDirection.x, seaDirection.z);
  const right = new THREE.Vector3(seaDirection.z, 0, -seaDirection.x);
  const world = (x, y, z) => land.clone().addScaledVector(right, x).addScaledVector(seaDirection, z).setY(y);
  const root = new THREE.Group(); root.name = 'Ancient fishing landing';
  root.position.copy(land).setY(0); root.rotation.y = yaw; scene.add(root);
  const colliders = [], walkSurfaces = [], leaves = [];
  const random = (a, b=0) => {const v=Math.sin(a*127.1+b*311.7)*43758.5453123;return v-Math.floor(v);};
  const color = n => new THREE.Color(n);

  function texture(kind) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = kind==='sail' ? '#d9c9a0' : kind==='stone' ? '#b6a388' : '#9c7853';
    ctx.fillRect(0,0,512,512);
    if (kind==='wood') {
      for(let i=0;i<400;i++) {
        const y=random(i,1)*512; ctx.beginPath();ctx.moveTo(0,y);
        for(let x=0;x<=512;x+=24)ctx.lineTo(x,y+Math.sin(x*.02+i)*(.4+random(i,2)*2));
        ctx.strokeStyle=`rgba(${i%3?44:210},${i%3?32:187},${i%3?20:136},${.02+random(i,3)*.16})`;
        ctx.lineWidth=.3+random(i,4)*1.6;ctx.stroke();
      }
      for(let i=0;i<11;i++) {
        const x=random(i,5)*512,y=random(i,6)*512;
        for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(x,y,3+j*4,1+j*1.5,0,0,Math.PI*2);ctx.strokeStyle='rgba(48,31,19,.15)';ctx.lineWidth=.8;ctx.stroke();}
      }
    } else {
      for(let i=0;i<5000;i++) {
        ctx.fillStyle=`rgba(${i%2?36:255},${i%2?31:248},${i%2?24:224},${.015+random(i,7)*.05})`;
        ctx.fillRect(random(i,8)*512,random(i,9)*512,kind==='sail'?1.2:2.5,kind==='sail'?1.2:2.5);
      }
      if(kind==='sail') {
        for(let x=64;x<512;x+=96){ctx.fillStyle='rgba(100,76,44,.17)';ctx.fillRect(x,0,2,512);ctx.fillStyle='rgba(247,230,189,.3)';ctx.fillRect(x+2,0,2,512);}
        ctx.strokeStyle='rgba(98,72,41,.32)';ctx.lineWidth=5;ctx.strokeRect(4,4,504,504);
        for(let i=0;i<15;i++){const x=random(i,18)*512,y=random(i,19)*512;const g=ctx.createRadialGradient(x,y,1,x,y,24+random(i,20)*60);g.addColorStop(0,'rgba(116,93,57,.035)');g.addColorStop(1,'rgba(116,93,57,0)');ctx.fillStyle=g;ctx.fillRect(0,0,512,512);}
      }
    }
    const map = new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;return map;
  }
  const woodMap=texture('wood'),sailMap=texture('sail'),stoneMap=texture('stone');
  const mat = {
    timber:new THREE.MeshStandardMaterial({color:'#a68359',map:woodMap,bumpMap:woodMap,bumpScale:.012,roughness:.83}),
    darkWood:new THREE.MeshStandardMaterial({color:'#655341',map:woodMap,bumpMap:woodMap,bumpScale:.009,roughness:.78}),
    hull:new THREE.MeshStandardMaterial({color:'#72604c',map:woodMap,bumpMap:woodMap,bumpScale:.009,roughness:.66}),
    inner:new THREE.MeshStandardMaterial({color:'#a9916a',map:woodMap,roughness:.83,side:THREE.DoubleSide}),
    edge:new THREE.MeshStandardMaterial({color:'#483e30',map:woodMap,roughness:.65}),
    rope:new THREE.MeshStandardMaterial({color:'#a88f65',roughness:1}),
    stone:new THREE.MeshStandardMaterial({color:'#c3b094',map:stoneMap,bumpMap:stoneMap,bumpScale:.04,roughness:1}),
    plaster:new THREE.MeshStandardMaterial({color:'#d0c3a5',map:stoneMap,roughness:1}),
    pottery:new THREE.MeshStandardMaterial({color:'#a76e49',roughness:.91}),
    dark:new THREE.MeshStandardMaterial({color:'#292b27',roughness:1}),
    leaf:new THREE.MeshStandardMaterial({color:'#70794f',roughness:.88,side:THREE.DoubleSide}),
    leafSilver:new THREE.MeshStandardMaterial({color:'#94996d',roughness:.89,side:THREE.DoubleSide}),
    sail:new THREE.MeshStandardMaterial({color:'#efe5c9',map:sailMap,emissive:'#70542d',emissiveIntensity:.06,roughness:.94,side:THREE.DoubleSide}),
    bronze:new THREE.MeshStandardMaterial({color:'#7f6840',metalness:.5,roughness:.65}),
    flame:new THREE.MeshStandardMaterial({color:'#ffbf56',emissive:'#ffae39',emissiveIntensity:2,roughness:.8})
  };
  const cube = new THREE.BoxGeometry(1,1,1), stoneGeo = new THREE.IcosahedronGeometry(1,1);
  const cylinder = new THREE.CylinderGeometry(1,1,1,8);
  const matrix=new THREE.Matrix4(),dummy=new THREE.Object3D();
  function mesh(geometry,material,parent=root) {
    const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  // Merge repeated pieces by material, preserving individual planks and stones
  // without a draw call per piece.
  class Batch {
    constructor(parent) {this.parent=parent;this.parts=new Map();}
    add(geometry, material, position, scale=[1,1,1], rotation=[0,0,0]) {
      dummy.position.set(...position);dummy.scale.set(...scale);dummy.rotation.set(...rotation);dummy.updateMatrix();
      const geo=geometry.index?geometry.toNonIndexed():geometry.clone();geo.applyMatrix4(dummy.matrix);
      if(!this.parts.has(material))this.parts.set(material,[]);this.parts.get(material).push(geo);
    }
    box(material,position,scale,rotation) {this.add(cube,material,position,scale,rotation);}
    rod(material,a,b,radius=.05) {
      const pa=new THREE.Vector3(...a),pb=new THREE.Vector3(...b),delta=pb.clone().sub(pa);
      const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
      matrix.compose(pa.add(pb).multiplyScalar(.5),q,new THREE.Vector3(radius,delta.length(),radius));
      const geo=cylinder.toNonIndexed();geo.applyMatrix4(matrix);
      if(!this.parts.has(material))this.parts.set(material,[]);this.parts.get(material).push(geo);
    }
    tube(material,points,radius=.028,segments=22) {
      const curve=new THREE.CatmullRomCurve3(points.map(v=>Array.isArray(v)?new THREE.Vector3(...v):v));
      const g=new THREE.TubeGeometry(curve,segments,radius,5,false);this.add(g,material,[0,0,0]);g.dispose();
    }
    finish() {
      for(const [material,parts] of this.parts) {
        const total=parts.reduce((n,g)=>n+g.attributes.position.count,0);
        const p=new Float32Array(total*3),n=new Float32Array(total*3),uv=new Float32Array(total*2);let offset=0;
        for(const g of parts) {const a=g.attributes; p.set(a.position.array,offset*3);n.set(a.normal.array,offset*3);if(a.uv)uv.set(a.uv.array,offset*2);offset+=a.position.count;g.dispose();}
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('normal',new THREE.BufferAttribute(n,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.computeBoundingSphere();mesh(g,material,this.parent);
      }
      this.parts.clear();
    }
  }
  const staticBatch=new Batch(root);
  const distance=Math.hypot(shore.x-land.x,shore.z-land.z);
  const length=Math.min(22,Math.max(8,distance+5));
  const deckHeight=Math.max(.95,Math.min(2.8,land.y+.15));
  for(let z=0;z<length-2.05;z+=.32)staticBatch.box(Math.floor(z*100)%3?mat.timber:mat.darkWood,[0,deckHeight-.1,z],[3.35,.19,.295],[0,random(z,4)*.008,random(z,3)*.007]);
  for(const x of [-1.15,1.15])staticBatch.box(mat.darkWood,[x,deckHeight-.32,length*.5],[.22,.33,length+.1]);
  for(let z=.4;z<=length;z+=3)for(const x of [-1.3,1.3]){
    staticBatch.rod(mat.darkWood,[x,-1.3,z],[x,deckHeight+.55,z],.13);
    staticBatch.tube(mat.rope,Array.from({length:30},(_,i)=>[x+Math.cos(i*.64)*.16,deckHeight+.22+i*.006,z+Math.sin(i*.64)*.16]),.025,30);
    if(z<length-3)staticBatch.rod(mat.timber,[x,deckHeight-.7,z],[x,deckHeight-.05,z+2.8],.065);
  }
  // The head of the jetty is broad enough to linger or turn around.
  for(let z=length-2;z<length+.9;z+=.32)staticBatch.box(mat.timber,[0,deckHeight-.1,z],[5.5,.2,.295]);
  for(const x of [-2.48,2.48])for(const z of [length-1.8,length+.65])staticBatch.rod(mat.darkWood,[x,-1.3,z],[x,deckHeight+.3,z],.16);
  walkSurfaces.push({center:world(0,deckHeight,length*.5),halfWidth:1.66,halfLength:length*.5,yaw,height:deckHeight});
  walkSurfaces.push({center:world(0,deckHeight,length-.55),halfWidth:2.75,halfLength:1.45,yaw,height:deckHeight});
  for(let i=0;i<3;i++) {
    const h=THREE.MathUtils.lerp(land.y,deckHeight,(i+1)/3),z=-1.2+i*.4;
    staticBatch.box(mat.timber,[0,h-.1,z],[2.65,.19,.4]);
    walkSurfaces.push({center:world(0,h,z),halfWidth:1.32,halfLength:.2,yaw,height:h});
  }
  // Rope coils, spare oars, mooring bollards and a creel add scale cues.
  for(let k=0;k<3;k++) {
    const x=k===2?1.8:1.0,z=length-2.2+k*.7;
    const pts=Array.from({length:100},(_,i)=>{const a=i*.37,r=.12+i*.0036;return[x+Math.cos(a)*r,deckHeight+.035+i*.0005,z+Math.sin(a)*r];});
    staticBatch.tube(mat.rope,pts,.021,100);
  }
  for(let i=0;i<2;i++) {
    staticBatch.rod(mat.timber,[-.9+i*.22,deckHeight+.08,1.5],[-.6+i*.22,deckHeight+.1,5.4],.045);
    staticBatch.box(mat.timber,[-.62+i*.22,deckHeight+.12,5.1],[.18,.06,.65],[0,.07,0]);
  }
  for(let j=0;j<9;j++)staticBatch.tube(mat.rope,Array.from({length:20},(_,i)=>{const a=i/19*Math.PI*2;return[1+Math.cos(a)*.37,deckHeight+.08+j*.062,2.1+Math.sin(a)*.28];}),.018,20);
  for(let j=0;j<12;j++){const a=j/12*Math.PI*2;staticBatch.rod(mat.rope,[1+Math.cos(a)*.37,deckHeight+.08,2.1+Math.sin(a)*.28],[1+Math.cos(a)*.28,deckHeight+.65,2.1+Math.sin(a)*.21],.018);}

  function buildBoat(scale=1,sail=true) {
    const boat=new THREE.Group();boat.name=sail?'Quiet sailboat':'Fishing skiff';scene.add(boat);boat.scale.setScalar(scale);
    const b=new Batch(boat);
    const sections=[[-4.25,.025,.42,1.45],[-3.7,.65,-.1,1.1],[-2.8,1.13,-.43,.92],[-1.5,1.37,-.62,.87],[0,1.44,-.69,.85],[1.5,1.36,-.6,.87],[2.9,1.03,-.32,.98],[4.15,.03,.4,1.48]];
    const cross=(s,inset=0)=>{const[z,w,k,t]=s,W=Math.max(.008,w-inset),K=k+inset;return[[-W,t-inset,z],[-W*.985,t-.22-inset,z],[-W*.8,K+.26,z],[-W*.42,K+.065,z],[0,K,z],[W*.42,K+.065,z],[W*.8,K+.26,z],[W*.985,t-.22-inset,z],[W,t-inset,z]];};
    function shell(inset,material,reverse=false){
      const p=[],uv=[];for(let i=0;i<sections.length-1;i++){const a=cross(sections[i],inset),c=cross(sections[i+1],inset);for(let j=0;j<8;j++){const q=[a[j],a[j+1],c[j],c[j+1]],order=reverse?[0,2,1,2,3,1]:[0,1,2,2,1,3];for(const k of order){p.push(...q[k]);uv.push((i+(k>1?1:0))/7*3,(j+(k%2))/8);}}}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();const m=mesh(g,material,boat);m.material.side=THREE.DoubleSide;
    }
    shell(0,mat.hull);shell(.085,mat.inner,true);
    for(const side of [-1,1]) {
      b.tube(mat.edge,sections.map(s=>[side*s[1],s[3],s[0]]),.075,44);
      for(let j=1;j<=4;j++) b.tube(j===2?mat.darkWood:mat.hull,sections.map(s=>[side*s[1]*(.98-j*.08),THREE.MathUtils.lerp(s[3]-.13,s[2]+.04,j/5),s[0]]),.018,36);
    }
    for(const z of [-2.5,-1.4,0,1.4,2.6]) {
      const nearest=sections.reduce((a,c)=>Math.abs(c[0]-z)<Math.abs(a[0]-z)?c:a),points=cross([z,...nearest.slice(1)],.1);
      b.tube(mat.darkWood,points,.043,20);
    }
    for(let x=-.8;x<.9;x+=.2)b.box(mat.timber,[x,.1,0],[.18,.085,5.5]);
    for(const z of [-2.5,-1,1.25,2.65])b.box(mat.timber,[0,.58,z],[z===-2.5||z===2.65?1.75:2.46,.13,.33]);
    b.tube(mat.darkWood,sections.map(s=>[0,s[2]-.04,s[0]]),.075,40);
    b.rod(mat.darkWood,[0,.4,3.85],[0,1.75,4.17],.09);
    b.rod(mat.darkWood,[0,.4,-3.9],[0,1.6,-4.23],.09);
    b.rod(mat.timber,[.48,.73,-2.5],[.7,.69,2.25],.045);
    b.box(mat.timber,[.68,.68,2.01],[.3,.07,.86],[0,.045,0]);
    let cloth=null,clothBase=null;
    if(sail) {
      b.rod(mat.timber,[0,.08,.25],[0,7.05,.25],.1);
      b.rod(mat.darkWood,[-2.65,6.35,.25],[2.65,6.35,.25],.065);
      b.rod(mat.darkWood,[-1.98,2.47,.3],[1.98,2.47,.3],.045);
      const positions=[],uvs=[],idx=[],cols=22,rows=18;
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++) {
        const u=i/cols,v=j/rows,w=THREE.MathUtils.lerp(2.1,2.45,v),x=(u*2-1)*w;
        const y=2.45+v*3.8+.13*(1-v)*Math.cos((u-.5)*Math.PI);
        const z=.25+Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*.62+Math.sin(v*Math.PI)*.05;
        positions.push(x,y,z);uvs.push(u,v);
      }
      for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i;idx.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(idx);g.computeVertexNormals();cloth=mesh(g,mat.sail,boat);clothBase=new Float32Array(positions);cloth.name='Linen square sail';
      for(const x of [-1,1]) {
        b.tube(mat.rope,[[x*1.22,.91,-2.95],[x*.65,3.8,-1.4],[0,6.85,.25]],.021,20);
        b.tube(mat.rope,[[x*1.18,.91,2.9],[x*.6,3.75,1.4],[0,6.85,.25]],.021,20);
        b.tube(mat.rope,[[x*2.45,6.35,.25],[x*2.2,2.6,.32],[x*1.23,.95,1.7]],.018,16);
      }
      for(let i=0;i<12;i++)b.tube(mat.rope,[[-2.4+i*.435,6.35,.24],[-2.4+i*.435,6.22,.25]],.022,2);
      b.tube(mat.rope,[[2.65,6.35,.25],[1.1,6.68,.25],[0,7.01,.25],[-1.1,6.68,.25],[-2.65,6.35,.25]],.018,18);
      b.box(mat.darkWood,[-.6,.8,-2.55],[.32,.1,.3]);
      b.add(new THREE.SphereGeometry(.09,8,5),mat.flame,[-.6,.96,-2.55],[1,1.7,1]);
      b.add(new THREE.TorusGeometry(.13,.025,5,12),mat.bronze,[-.6,.88,-2.55],[1,1,1],[Math.PI/2,0,0]);
    }
    b.finish();return{boat,cloth,clothBase};
  }
  const hero=buildBoat(1,true),heroBoat=hero.boat;
  const boatSpawn=world(-4.8,0,length-1.5);heroBoat.position.copy(boatSpawn);heroBoat.rotation.y=yaw+.13;
  heroBoat.userData.harborAsset=true;
  // A second, smaller vessel remains moored and supplies depth beyond the sail.
  const skiff=buildBoat(.52,false);skiff.boat.position.copy(world(4.6,.04,length+3.1));skiff.boat.rotation.y=yaw-.5;
  // Mooring lines belong to the dock, so they disappear once the player sails off.
  const mooring=new THREE.Group();root.add(mooring);const ropes=new Batch(mooring);
  ropes.tube(mat.rope,[[-2.48,deckHeight+.18,length-1.8],[-3.55,.72,length-3.35],[-4.28,1.12,length-4.7]],.027,18);
  ropes.tube(mat.rope,[[-2.48,deckHeight+.18,length+.65],[-3.55,.6,length+1.5],[-4.2,1.11,length+1.8]],.027,18);ropes.finish();

  function landSpot(x,z,min=.12) {
    for(let r=0;r<=5;r+=1)for(let i=0;i<(r?12:1);i++) {
      const xx=x+Math.cos(i*Math.PI/6)*r,zz=z+Math.sin(i*Math.PI/6)*r,p=world(xx,0,zz),g=ground(p.x,p.z);
      if(g&&g.height>min&&g.slope>.65)return{x:xx,z:zz,y:g.height,world:p.setY(g.height)};
    }return null;
  }
  const shelter=landSpot(5,-4);
  if(shelter) {
    const {x,z,y}=shelter,w=3.4,d=2.6,h=2.7;
    staticBatch.box(mat.dark,[x,y+.03,z],[w,.07,d]);
    staticBatch.box(mat.plaster,[x-w/2,y+h/2,z],[.32,h,d]);
    staticBatch.box(mat.plaster,[x+w/2,y+h/2,z],[.32,h,d]);
    staticBatch.box(mat.plaster,[x,y+h/2,z-d/2],[w,h,.32]);
    for(const dx of [-1.1,1.1])staticBatch.box(mat.plaster,[x+dx,y+h/2,z+d/2],[1.25,h,.32]);
    staticBatch.box(mat.plaster,[x,y+h-.3,z+d/2],[w,.6,.32]);
    staticBatch.box(mat.darkWood,[x,y+h+.04,z],[w+.38,.18,d+.35]);
    staticBatch.box(mat.plaster,[x,y+h+.18,z],[w+.35,.16,d+.33]);
    for(let i=0;i<8;i++)staticBatch.box(mat.darkWood,[x-1.65+i*.48,y+h-.12,z+1.65],[.075,.09,1.0]);
    for(const dx of [-1.65,1.65])staticBatch.rod(mat.darkWood,[x+dx,y,z+2.2],[x+dx,y+2.42,z+2.2],.06);
    staticBatch.rod(mat.darkWood,[x-1.65,y+2.4,z+2.2],[x+1.65,y+2.4,z+2.2],.065);
    for(let i=0;i<18;i++)staticBatch.rod(mat.timber,[x-1.7+i*.2,y+h-.08,z+1],[x-1.7+i*.2,y+2.4,z+2.27],.043);
    for(let i=0;i<18;i++){const a=i%7,side=i<7?-1:1;staticBatch.add(stoneGeo,mat.stone,[x+side*(w/2+.04),y+.14+Math.floor(i/7)*.21,z-1.1+a*.36],[.26,.18,.25],[.1*i,.7*i,.2]);}
    colliders.push({x:shelter.world.x,z:shelter.world.z,r:2.05});
    // Amphorae retain a neck and an open dark mouth instead of being balls.
    for(let i=0;i<4;i++) {
      const xx=x-1.7+i*.54,zz=z+1.95,hh=y+.35,s=.34+random(i,90)*.1;
      const points=[[.12,0],[.3,.18],[.4,.45],[.33,.66],[.13,.81],[.12,.96],[.17,.98]].map(([r,h])=>new THREE.Vector2(r*s*2,h*s*2));
      const g=new THREE.LatheGeometry(points,12);staticBatch.add(g,mat.pottery,[xx,y,zz]);g.dispose();
      staticBatch.add(new THREE.CylinderGeometry(.09,.09,.035,12),mat.dark,[xx,y+s*1.91,zz]);
      for(const side of [-1,1])staticBatch.tube(mat.pottery,[[xx+side*.1,y+s*1.62,zz],[xx+side*.3,y+s*1.57,zz],[xx+side*.29,y+s*1.17,zz]],.035,12);
    }
    // Fishing net hung on the shaded outside wall, modelled as fine rope.
    for(let i=0;i<10;i++){
      const pts=[];for(let j=0;j<12;j++)pts.push([x-1.38+i*.19,y+2.3-j*.13-Math.sin(i*.36)*.15,z+d/2+.18+Math.sin(j*.28)*.07]);staticBatch.tube(mat.rope,pts,.009,12);
    }
    for(let j=0;j<12;j++)staticBatch.tube(mat.rope,Array.from({length:10},(_,i)=>[x-1.38+i*.19,y+2.3-j*.13-Math.sin(i*.36)*.15,z+d/2+.18+Math.sin(j*.28)*.07]),.009,12);
  }
  // A low, uneven dry stone edge; each piece is sampled against actual ground.
  for(let i=0;i<32;i++) {
    const x=-9+i*.62,z=-2.2+Math.sin(i*.31)*.65,p=world(x,0,z),g=ground(p.x,p.z);
    if(!g||g.height<.05)continue;
    for(let j=0;j<2;j++)staticBatch.add(stoneGeo,mat.stone,[x,g.height+.18+j*.28,z],[.37+random(i,j)*.1,.21,.32],[random(i,24)*.3,random(i,25)*3,.12]);
  }

  // Fine narrow leaves, not spherical crowns. A few authored olives frame the
  // landing, while the main scene's island vegetation continues beyond it.
  const leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.038,0,0,0,.24,.023,.038,0,0,0,-.24,-.01],3));leafGeo.setAttribute('uv',new THREE.Float32BufferAttribute([0,.5,.5,1,1,.5,.5,0],2));leafGeo.setIndex([0,1,2,0,2,3]);leafGeo.computeVertexNormals();
  for(let k=0;k<5;k++) {
    const p=landSpot(k<2?-6-k*3:6+(k-2)*3,-5-(k%2)*4);if(!p)continue;
    const s=.8+random(k,70)*.35,height=3.8*s;
    staticBatch.rod(mat.darkWood,[p.x,p.y,p.z],[p.x+.17,p.y+height*.67,p.z+.12],.14*s);
    const crown=new THREE.Group();crown.position.set(p.x,p.y+height*.72,p.z);root.add(crown);leaves.push({node:crown,phase:k});
    const branches=new Batch(crown);
    for(let j=0;j<7;j++){const a=j*2.4,r=1.05*s;branches.rod(mat.darkWood,[0,-.4,0],[Math.sin(a)*r,.3+random(j,k)*.5,Math.cos(a)*r],.035*s);}
    branches.finish();
    for(let shade=0;shade<2;shade++) {
      const count=190,inst=new THREE.InstancedMesh(leafGeo,shade?mat.leafSilver:mat.leaf,count);inst.castShadow=true;inst.receiveShadow=true;
      for(let i=0;i<count;i++) {
        const a=random(i,k+100+shade)*Math.PI*2,r=Math.sqrt(random(i,k+112+shade))*1.65*s;
        dummy.position.set(Math.cos(a)*r,.1+random(i,k+123)*1.2*s,Math.sin(a)*r*.76);dummy.rotation.set(random(i,130)*2.4,random(i,131)*6.28,random(i,132)*6.28);dummy.scale.setScalar(.8+random(i,k+140));dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);
      }crown.add(inst);
    }
    colliders.push({x:p.world.x,z:p.world.z,r:.25*s});
  }
  // Shore-scale dressing breaks the smooth miniature terrain into quiet layers
  // of weathered rock, pale dry stalks and compact Mediterranean scrub.
  const clearForDressing=(x,z,pad=.3)=>{
    if(Math.abs(x)<2.2+pad&&z>-3.3&&z<length+1)return false;
    const p=world(x,0,z);
    return !colliders.some(c=>Math.hypot(c.x-p.x,c.z-p.z)<c.r+pad);
  };
  const coastalRock=stoneGeo.clone(),rockPos=coastalRock.attributes.position;
  for(let i=0;i<rockPos.count;i++){
    const x=rockPos.getX(i),y=rockPos.getY(i),z=rockPos.getZ(i);
    // Coordinate noise keeps shared vertices together, giving rounded fractures.
    const n=.91+random(Math.round(x*100)+Math.round(z*50),Math.round(y*100))*.17;
    rockPos.setXYZ(i,x*n,y*n,z*n);
  }
  coastalRock.computeVertexNormals();
  const rockInstances=new THREE.InstancedMesh(coastalRock,mat.stone,190);
  rockInstances.castShadow=true;rockInstances.receiveShadow=true;let rockCount=0;
  for(let i=0;i<125&&rockCount<185;i++){
    const a=random(i,201)*Math.PI*2,r=3.2+Math.sqrt(random(i,202))*19;
    const x=Math.cos(a)*r,z=Math.sin(a)*r,p=world(x,0,z),g=ground(p.x,p.z);
    if(!g||g.height<.035||!clearForDressing(x,z,.65))continue;
    const nearWater=[[-1.8,0],[1.8,0],[0,-1.8],[0,1.8]].some(([dx,dz])=>{const h=ground(p.x+dx,p.z+dz);return !h||h.height<.025;});
    if(!nearWater&&random(i,203)>.3)continue;
    for(let j=0;j<(nearWater?4:2)&&rockCount<190;j++){
      const xx=x+(random(i,j+204)-.5)*2.1,zz=z+(random(i,j+209)-.5)*2.1,q=world(xx,0,zz),h=ground(q.x,q.z);
      if(!h||h.height<.018||!clearForDressing(xx,zz,.45))continue;
      const s=(j===0?.55:.19)+random(i,j+215)*(j===0?.86:.34),sy=s*(.43+random(i,j+220)*.25);
      dummy.position.set(xx,h.height+sy*.44,zz);dummy.rotation.set((random(i,j+224)-.5)*.35,random(i,j+230)*Math.PI*2,(random(i,j+236)-.5)*.3);dummy.scale.set(s,sy,s*(.69+random(i,j+240)*.36));dummy.updateMatrix();rockInstances.setMatrixAt(rockCount,dummy.matrix);
      rockInstances.setColorAt(rockCount,color('#d4c2a1').lerp(color('#8c8d77'),random(i,j+245)*.46));rockCount++;
    }
  }
  rockInstances.count=rockCount;root.add(rockInstances);
  const grassPositions=[],grassUVs=[];
  for(let j=0;j<7;j++){
    const a=j*2.4,x=Math.cos(a)*.075,z=Math.sin(a)*.075,h=.27+random(j,251)*.3,w=.012+random(j,252)*.009;
    grassPositions.push(x-w,0,z,x+w,0,z,x+Math.cos(a)*.1,h,z+Math.sin(a)*.09);
    grassUVs.push(0,0,1,0,.5,1);
  }
  const grassGeo=new THREE.BufferGeometry();grassGeo.setAttribute('position',new THREE.Float32BufferAttribute(grassPositions,3));grassGeo.setAttribute('uv',new THREE.Float32BufferAttribute(grassUVs,2));grassGeo.computeVertexNormals();
  const dryMat=new THREE.MeshStandardMaterial({color:'#b0a36e',roughness:1,side:THREE.DoubleSide});
  const smallGrass=new THREE.InstancedMesh(grassGeo,dryMat,650);smallGrass.receiveShadow=true;let grassCount=0;
  const scrubLeafGeo=leafGeo.clone(),smallScrub=new THREE.InstancedMesh(scrubLeafGeo,mat.leafSilver,1600);smallScrub.receiveShadow=true;smallScrub.castShadow=true;let scrubCount=0;
  for(let i=0;i<210;i++){
    const a=random(i,260)*Math.PI*2,r=3+Math.sqrt(random(i,261))*19.5,x=Math.cos(a)*r,z=Math.sin(a)*r,p=world(x,0,z),g=ground(p.x,p.z);
    if(!g||g.height<.08||g.slope<.7||!clearForDressing(x,z,.45))continue;
    for(let j=0;j<8&&grassCount<650;j++){
      const xx=x+(random(i,j+262)-.5)*1.4,zz=z+(random(i,j+273)-.5)*1.4,q=world(xx,0,zz),h=ground(q.x,q.z);
      if(!h||h.height<.035||!clearForDressing(xx,zz,.25))continue;
      dummy.position.set(xx,h.height+.015,zz);dummy.rotation.set(0,random(i,j+285)*6.28,0);dummy.scale.setScalar(.65+random(i,j+295)*.6);dummy.updateMatrix();smallGrass.setMatrixAt(grassCount,dummy.matrix);smallGrass.setColorAt(grassCount,color('#dfcd90').lerp(color('#8d986c'),random(i,j+305)));grassCount++;
    }
    if(i%3===0)for(let j=0;j<28&&scrubCount<1600;j++){
      const aa=j*2.4,rr=Math.sqrt(random(i,j+316))*.42;
      dummy.position.set(x+Math.cos(aa)*rr,g.height+.12+random(i,j+347)*.37,z+Math.sin(aa)*rr);
      dummy.rotation.set(random(i,j+377)*1.5,aa,random(i,j+406)*3);dummy.scale.setScalar(.5+random(i,j+438)*.55);dummy.updateMatrix();smallScrub.setMatrixAt(scrubCount++,dummy.matrix);
    }
  }
  smallGrass.count=grassCount;smallScrub.count=scrubCount;root.add(smallGrass,smallScrub);
  staticBatch.finish();
  const focus=world(-2,2.1,length-1.3);
  const view={target:world(-3.8,2.3,length-.2),position:world(6.5,4.7,length-15.5)};
  const walkSpawn=world(0,deckHeight,length-4);
  let lastClothTime=-1;
  function update(time,wind=.35,waveHeightFn) {
    const sample=(x,z)=>waveHeightFn?waveHeightFn(x,z,time):Math.sin(time*1.1+x*.3+z*.22)*.075;
    // x/z and yaw are owned by the caller, so this boat can actually be sailed.
    heroBoat.position.y=.13+sample(heroBoat.position.x,heroBoat.position.z)*.68;
    heroBoat.rotation.z=Math.sin(time*.73+.5)*(.013+wind*.035);
    heroBoat.rotation.x=Math.sin(time*.89)*(.01+wind*.018);
    skiff.boat.position.y=.07+sample(skiff.boat.position.x,skiff.boat.position.z)*.75;
    skiff.boat.rotation.z=Math.sin(time*.83+2)*.025;skiff.boat.rotation.x=Math.cos(time*.7)*.018;
    mooring.visible=heroBoat.position.distanceToSquared(boatSpawn)<9;
    for(const a of leaves){a.node.rotation.z=Math.sin(time*.7+a.phase)*wind*.018;a.node.rotation.x=Math.cos(time*.6+a.phase)*wind*.012;}
    if(hero.cloth&&Math.abs(time-lastClothTime)>.055) {
      const p=hero.cloth.geometry.attributes.position,uv=hero.cloth.geometry.attributes.uv;
      for(let i=0;i<p.count;i++){const u=uv.getX(i),v=uv.getY(i);p.setZ(i,hero.clothBase[i*3+2]+Math.sin(time*1.3+u*5+v*3)*Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*(.018+wind*.055));}
      p.needsUpdate=true;hero.cloth.geometry.computeVertexNormals();lastClothTime=time;
    }
  }
  return {root,heroBoat,colliders,walkSurfaces,focus,view,boatSpawn,seaDirection,walkSpawn,update};
}
