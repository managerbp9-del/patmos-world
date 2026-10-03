import * as THREE from 'three';

// Authored places within the existing terrain, rather than separate scene rooms.
// Ancient domestic details are visual reconstructions, not archaeological claims.
export function createCoastalHubs({scene, ground, points}) {
  const root = new THREE.Group(); root.name = 'Coastal places of Patmos'; scene.add(root);
  const views = {}, moving = [], timeUniform = {value:0}, windUniform = {value:.35};
  const random=(a,b=0)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453123;return n-Math.floor(n);};
  const dummy=new THREE.Object3D(), up=new THREE.Vector3(0,1,0);
  const cube=new THREE.BoxGeometry(1,1,1), cylinder=new THREE.CylinderGeometry(1,1,1,7);
  const pebble=new THREE.IcosahedronGeometry(1,1);
  for(let i=0;i<pebble.attributes.position.count;i++){
    const a=pebble.attributes.position,x=a.getX(i),y=a.getY(i),z=a.getZ(i);
    const n=.86+.2*random(Math.round(x*200)+Math.round(z*500),Math.round(y*200));
    a.setXYZ(i,x*n,y*n,z*n);
  }
  pebble.computeVertexNormals();

  function texture(kind) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
    const c=canvas.getContext('2d');c.fillStyle=kind==='wood'?'#b6a086':'#c0b39b';c.fillRect(0,0,512,512);
    for(let i=0;i<4400;i++){
      const light=i%3===0;c.fillStyle=`rgba(${light?'244,238,215':'44,43,32'},${.02+random(i,14)*.06})`;
      c.fillRect(random(i,15)*512,random(i,16)*512,kind==='wood'?12+random(i,12)*22:1+random(i,12)*4,kind==='wood'?.5:1+random(i,17)*4);
    }
    if(kind==='stone')for(let i=0;i<25;i++){
      const y=i*21+random(i,91)*6;c.beginPath();c.moveTo(0,y);
      for(let x=0;x<540;x+=20)c.lineTo(x,y+Math.sin(x*.018+i)*3+random(x,i)*2);
      c.strokeStyle='rgba(72,62,43,.11)';c.lineWidth=.5+random(i,92)*2;c.stroke();
    }
    else for(let i=0;i<280;i++){
      const y=random(i,22)*512;c.beginPath();c.moveTo(0,y);
      for(let x=0;x<540;x+=20)c.lineTo(x,y+Math.sin(x*.014+i)*1.2);
      c.strokeStyle='rgba(43,35,25,.1)';c.lineWidth=.4+random(i,23);c.stroke();
    }
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;return map;
  }
  const stoneMap=texture('stone'),woodMap=texture('wood');
  const mat={
    stone:new THREE.MeshStandardMaterial({color:'#aeaa90',map:stoneMap,bumpMap:stoneMap,bumpScale:.045,roughness:.96}),
    pale:new THREE.MeshStandardMaterial({color:'#c1b391',map:stoneMap,bumpMap:stoneMap,bumpScale:.06,roughness:1}),
    darkStone:new THREE.MeshStandardMaterial({color:'#777865',map:stoneMap,bumpMap:stoneMap,bumpScale:.04,roughness:1}),
    floor:new THREE.MeshStandardMaterial({color:'#b4a686',map:stoneMap,bumpMap:stoneMap,bumpScale:.025,roughness:.94}),
    wood:new THREE.MeshStandardMaterial({color:'#877450',map:woodMap,bumpMap:woodMap,bumpScale:.016,roughness:.91}),
    bark:new THREE.MeshStandardMaterial({color:'#574f39',map:woodMap,bumpMap:woodMap,bumpScale:.05,roughness:1}),
    leaf:new THREE.MeshStandardMaterial({color:'#697451',roughness:.88,side:THREE.DoubleSide}),
    silver:new THREE.MeshStandardMaterial({color:'#a0a27d',roughness:.91,side:THREE.DoubleSide}),
    vine:new THREE.MeshStandardMaterial({color:'#6b8050',roughness:.76,side:THREE.DoubleSide}),
    fig:new THREE.MeshStandardMaterial({color:'#526744',roughness:.88,side:THREE.DoubleSide}),
    grass:new THREE.MeshStandardMaterial({color:'#c5b378',roughness:1,side:THREE.DoubleSide}),
    clay:new THREE.MeshStandardMaterial({color:'#b5835b',roughness:.93}),
    dark:new THREE.MeshStandardMaterial({color:'#373b2e',roughness:1}),
    fruit:new THREE.MeshStandardMaterial({color:'#554a3f',roughness:.7}),
    water:new THREE.MeshStandardMaterial({color:'#567e70',metalness:.3,roughness:.21,transparent:true,opacity:.82}),
    cloth:new THREE.MeshStandardMaterial({color:'#d6c7a3',roughness:1,side:THREE.DoubleSide})
  };
  for(const material of [mat.leaf,mat.silver,mat.vine,mat.fig,mat.grass]){
    material.onBeforeCompile=shader=>{
      shader.uniforms.hubTime=timeUniform;shader.uniforms.hubWind=windUniform;
      shader.vertexShader='uniform float hubTime;uniform float hubWind;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        #ifdef USE_INSTANCING
          float leafPhase=instanceMatrix[3].x*.71+instanceMatrix[3].z*.38;
          transformed.x+=sin(hubTime*1.3+leafPhase)*hubWind*.075*uv.y;
          transformed.z+=cos(hubTime*.91+leafPhase)*hubWind*.035*uv.y;
        #endif`);
    };
    material.customProgramCacheKey=()=> 'patmos-hub-foliage-v1';
  }
  function addMesh(g,m,parent=root){const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  class Batch {
    constructor(parent){this.parent=parent;this.parts=new Map();}
    put(g,m,pos,scale=[1,1,1],rotation=[0,0,0]){
      dummy.position.set(...pos);dummy.scale.set(...scale);dummy.rotation.set(...rotation);dummy.updateMatrix();
      const copy=g.index?g.toNonIndexed():g.clone();copy.applyMatrix4(dummy.matrix);
      if(!this.parts.has(m))this.parts.set(m,[]);this.parts.get(m).push(copy);
    }
    box(m,pos,scale,rot){this.put(cube,m,pos,scale,rot);}
    rod(m,a,b,r=.05){
      const pa=new THREE.Vector3(...a),pb=new THREE.Vector3(...b),dir=pb.clone().sub(pa);
      dummy.position.copy(pa).add(pb).multiplyScalar(.5);dummy.scale.set(r,dir.length(),r);
      dummy.quaternion.setFromUnitVectors(up,dir.normalize());dummy.updateMatrix();
      const g=cylinder.toNonIndexed();g.applyMatrix4(dummy.matrix);
      if(!this.parts.has(m))this.parts.set(m,[]);this.parts.get(m).push(g);
    }
    tube(m,pts,r=.05,segments=12){
      const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),segments,r,5,false);
      this.put(g,m,[0,0,0]);g.dispose();
    }
    finish(){
      for(const [material,parts] of this.parts){
        const total=parts.reduce((n,g)=>n+g.attributes.position.count,0),p=new Float32Array(total*3),n=new Float32Array(total*3),uv=new Float32Array(total*2);let i=0;
        for(const g of parts){p.set(g.attributes.position.array,i*3);n.set(g.attributes.normal.array,i*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,i*2);i+=g.attributes.position.count;g.dispose();}
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('normal',new THREE.BufferAttribute(n,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.computeBoundingSphere();addMesh(g,material,this.parent);
      }
      this.parts.clear();
    }
  }
  function leafGeometry(broad=false){
    const positions=broad?[0,0,0,-.22,.13,.018,-.3,.34,0,-.14,.33,.02,-.13,.57,0,0,.47,.026,.13,.57,0,.14,.33,.02,.3,.34,0,.22,.13,.018]:[0,0,0,-.035,.16,.015,0,.36,0,.035,.16,.015];
    const uv=[];for(let i=0;i<positions.length;i+=3)uv.push(positions[i]+.5,positions[i+1]*1.6);
    const idx=[];for(let i=1;i<positions.length/3-1;i++)idx.push(0,i,i+1);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
  }
  const narrowLeaf=leafGeometry(),broadLeaf=leafGeometry(true);
  const grassGeometry=new THREE.BufferGeometry(),gp=[],gu=[];
  for(let i=0;i<8;i++){
    const a=i*2.4,x=Math.cos(a)*.09,z=Math.sin(a)*.09,h=.32+random(i,78)*.4,w=.012;
    gp.push(x-w,0,z,x+w,0,z,x+Math.cos(a)*.12,h,z+Math.sin(a)*.09);gu.push(0,0,1,0,.5,1);
  }
  grassGeometry.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));grassGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(gu,2));grassGeometry.computeVertexNormals();
  function instances(g,m,transforms,parent){
    const mesh=new THREE.InstancedMesh(g,m,transforms.length);mesh.castShadow=m!==mat.grass;mesh.receiveShadow=true;
    transforms.forEach((t,i)=>{dummy.position.set(...t.p);dummy.rotation.set(...(t.r||[0,0,0]));dummy.scale.set(...(Array.isArray(t.s)?t.s:[t.s||1,t.s||1,t.s||1]));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(t.c)mesh.setColorAt(i,new THREE.Color(t.c));});parent.add(mesh);return mesh;
  }
  function place(id){
    const anchor=points[id];if(!anchor)return null;const group=new THREE.Group();group.name=id+' observation place';group.position.set(anchor.x,0,anchor.z);root.add(group);
    const h=(x,z)=>ground(anchor.x+x,anchor.z+z)?.height;
    const y=h(0,0)??anchor.y, batch=new Batch(group);
    return {id,anchor,group,h,y,batch};
  }
  function world(p,x,y,z){return new THREE.Vector3(p.anchor.x+x,y,p.anchor.z+z);}
  function view(p,target,position){
    const pos=world(p,...position),g=ground(pos.x,pos.z);if(g)pos.y=Math.max(pos.y,g.height+2.1);
    views[p.id]={target:world(p,...target),position:pos};
  }
  function rock(p,x,z,s=1,seed=0){const y=p.h(x,z);if(y===undefined||y<-.12)return;p.batch.put(pebble,seed%3?mat.stone:mat.pale,[x,y+s*.25,z],[s,s*(.42+random(seed,7)*.22),s*(.6+random(seed,8)*.3)],[random(seed,5)*.25,random(seed,6)*6.28,random(seed,9)*.2]);}
  function dryWall(p,a,b,height=.7,width=.65,base=null){
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(length/.52),rows=Math.ceil(height/.25);
    for(let i=0;i<=steps;i++){
      const t=i/steps,x=THREE.MathUtils.lerp(a[0],b[0],t),z=THREE.MathUtils.lerp(a[1],b[1],t),y=base??p.h(x,z);if(y===undefined||y<-.1)continue;
      for(let j=0;j<rows;j++)p.batch.put(pebble,(i+j)%4?mat.stone:mat.pale,[x+Math.sin(i*2+j)*.05,y+.13+j*.23,z+Math.cos(i*1.3+j)*.05],[.34+random(i,j)*.11,.17+random(i,j+12)*.035,width*.6],[random(i,j+13)*.12,random(i,j+14)*3.14,random(i,j+15)*.1]);
    }
  }
  function tree(p,x,z,size=1,lean=0,fig=false){
    const y=p.h(x,z);if(y===undefined||y<.08)return;
    const h=3.4*size,tx=x+lean*h,tz=z+.17*size;
    p.batch.tube(mat.bark,[[x,y-.1,z],[x+.1*size,y+h*.3,z],[x+lean*h*.42,y+h*.67,z+.11],[tx,y+h*.87,tz]],.15*size,11);
    // The branching silhouette remains visible through individual leaves.
    const crown=new THREE.Group();crown.position.set(tx,y+h*.86,tz);p.group.add(crown);moving.push({node:crown,phase:x*.3+z,amount:lean?.025:.014});
    const b=new Batch(crown),spread=fig?2.15:1.7;
    for(let i=0;i<9;i++){
      const a=i*2.399,r=(.7+random(i,x)*.6)*size;
      b.tube(mat.bark,[[0,-.5*size,0],[Math.cos(a)*r*.55,-.04*size,Math.sin(a)*r*.55],[Math.cos(a)*r,.15+random(i,z)*.5,Math.sin(a)*r]],.035*size,6);
    }b.finish();
    const leaves=[[],[]];
    for(let i=0;i<(fig?250:620);i++){
      const a=random(i,x+91)*6.28,r=Math.sqrt(random(i,z+89))*spread*size;
      leaves[i%2].push({p:[Math.cos(a)*r+lean*.45,.12+random(i,x+90)*.75*size,Math.sin(a)*r*.7],r:[-.9+random(i,z+91)*2.7,random(i,x+94)*6.28,random(i,z+94)*6.28],s:(fig?.7:1.05)*( .65+random(i,x+96)*.7)*size});
    }
    instances(fig?broadLeaf:narrowLeaf,fig?mat.fig:mat.leaf,leaves[0],crown);instances(fig?broadLeaf:narrowLeaf,fig?mat.vine:mat.silver,leaves[1],crown);
    if(fig)for(let i=0;i<11;i++){const a=i*2.4,r=.6+random(i,z)*.7;p.batch.put(pebble,mat.fruit,[tx+Math.cos(a)*r,y+h*.91,tz+Math.sin(a)*r],[.06,.075,.06]);}
  }
  function dress(p,radius,count,exclude=(x,z)=>false){
    const grass=[],leaves=[],rocks=[];
    for(let i=0;i<count;i++){
      const a=random(i,p.anchor.x)*6.28,r=Math.sqrt(random(i,p.anchor.z))*radius,x=Math.cos(a)*r,z=Math.sin(a)*r,y=p.h(x,z);
      if(y===undefined||y<.045||exclude(x,z))continue;
      if(i%3===0){const s=.12+random(i,152)*.48;rocks.push({p:[x,y+s*.16,z],r:[random(i,157)*.3,a,0],s:[s,s*.42,s*.8]});}
      const scale=.32+random(i,153)*.6;
      for(let j=0;j<3;j++)grass.push({p:[x+(random(i,j+163)-.5)*.7,y+.015,z+(random(i,j+172)-.5)*.7],r:[0,a+j,0],s:scale});
      if(i%4===0)for(let j=0;j<24;j++){
        const aa=j*2.4,rr=Math.sqrt(random(i,j+181))*.5;leaves.push({p:[x+Math.cos(aa)*rr,y+.06+random(i,j+191)*.34,z+Math.sin(aa)*rr],r:[random(i,j+201)*2,aa,random(i,j+211)*6.28],s:.55+random(i,j+222)*.55});
      }
    }
    instances(grassGeometry,mat.grass,grass,p.group);instances(narrowLeaf,mat.silver,leaves,p.group);instances(pebble,mat.stone,rocks,p.group);
  }
  function pottery(p,x,y,z,s=.48){
    const profile=[[.12,0],[.31,.16],[.38,.42],[.31,.7],[.12,.85],[.13,1.05],[.17,1.06]].map(([r,h])=>new THREE.Vector2(r*s,h*s));
    const g=new THREE.LatheGeometry(profile,12);p.batch.put(g,mat.clay,[x,y,z]);g.dispose();
    p.batch.put(cylinder,mat.dark,[x,y+s*1.035,z],[.12*s,.008,.12*s]);
    for(const side of [-1,1])p.batch.tube(mat.clay,[[x+side*s*.14,y+s*.93,z],[x+side*s*.34,y+s*.82,z],[x+side*s*.31,y+s*.61,z]],.026*s,8);
  }

  const petra=place('petra');
  if(petra){
    const {y,batch}=petra;
    // A continuous eroded monolith, with a sloping crown and broad vertical face.
    const ringCount=18,sides=30,verts=[],uv=[],indices=[];
    for(let j=0;j<=ringCount;j++)for(let i=0;i<=sides;i++){
      const t=j/ringCount,a=i/sides*Math.PI*2;
      const bulge=.78+Math.sin(t*Math.PI)*.27;
      const facet=1+.08*Math.sin(a*5+.7)+.035*Math.sin(a*11+t*3);
      const strata=1+.019*Math.sin(t*73)+.011*Math.sin(t*181+a*2);
      const x=Math.cos(a)*4.8*bulge*facet*strata+(t*t)*.8;
      const z=Math.sin(a)*3.7*bulge*facet*strata+Math.sin(t*4)*.16;
      const top=8.9+Math.sin(a*2)*.25+Math.cos(a)*.8;
      verts.push(x,y-.25+t*top,z);uv.push(i/sides*3,t*2);
    }
    for(let j=0;j<ringCount;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i;indices.push(a,a+sides+1,a+1,a+1,a+sides+1,a+sides+2);}
    // Close the irregular crown; the base is embedded in the sampled terrain.
    const center=verts.length/3;verts.push(.8,y+8.65,0);uv.push(.5,.5);
    for(let i=0;i<sides;i++)indices.push(center,ringCount*(sides+1)+i+1,ringCount*(sides+1)+i);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();addMesh(geo,mat.pale,petra.group);
    // Thin bedding seams, softened by the same mineral texture.
    for(let j=0;j<9;j++){
      const t=.12+j*.091,pts=[];
      for(let i=0;i<=32;i++){
        const a=i/32*Math.PI*2,bulge=.78+Math.sin(t*Math.PI)*.27,facet=1+.08*Math.sin(a*5+.7)+.035*Math.sin(a*11+t*3);
        pts.push([Math.cos(a)*4.81*bulge*facet+t*t*.8,y-.22+t*(8.9+Math.sin(a*2)*.25+Math.cos(a)*.8),Math.sin(a)*3.71*bulge*facet+Math.sin(t*4)*.16]);
      }batch.tube(j%3?mat.stone:mat.darkStone,pts,.022,54);
    }
    for(let i=0;i<48;i++){const a=i*2.4,r=5.1+random(i,50)*7;rock(petra,Math.cos(a)*r,Math.sin(a)*r,.35+random(i,51)*1.1,i);}
    // A quiet low ledge opposite the outer face gives an inviting scale cue.
    const ly=petra.h(-6,4)??y;
    batch.put(pebble,mat.stone,[-6,ly+.32,4],[2.0,.4,.75],[0,-.45,0]);
    tree(petra,-8,-3,.69,.17);tree(petra,7,-4,.58,.23);
    dress(petra,16,235,(x,z)=>x*x/35+z*z/23<1.2);
    view(petra,[.1,y+3.8,0],[-14,y+6.4,17]);batch.finish();
  }

  const ridge=place('ridge');
  if(ridge){
    const {y,batch}=ridge;
    tree(ridge,-3.6,-1,1.48,.39);tree(ridge,4,-4.2,1.04,.33);tree(ridge,-9,-6,.72,.3);
    const by=Math.max(ridge.h(1.8,1.4)??y,ridge.h(4.5,1.4)??y)+.12;
    for(const x of [2,4.1])batch.put(pebble,mat.stone,[x,by+.3,1.4],[.43,.45,.5]);
    batch.box(mat.pale,[3.05,by+.76,1.4],[3.05,.27,.98],[0,.045,0]);
    for(let i=0;i<34;i++){const a=i*2.4,r=3+random(i,411)*10;rock(ridge,Math.cos(a)*r,Math.sin(a)*r,.35+random(i,413)*.75,i);}
    dryWall(ridge,[-7,4.6],[5.5,6],.4,.65);
    dress(ridge,18,350,(x,z)=>Math.hypot(x-3,z-1.4)<2||Math.hypot(x+3.6,z+1)<.5);
    view(ridge,[-1.4,y+2.2,-1],[10,y+4.4,15]);batch.finish();
  }

  const garden=place('garden');
  if(garden){
    const {batch}=garden;
    // The modest retaining terrace keeps the courtyard readable on real slopes.
    const corners=[[-4.5,-4],[4.5,-4],[-4.5,4],[4.5,4]],floor=Math.max(garden.y,...corners.map(([x,z])=>garden.h(x,z)??garden.y))+.18;
    for(let z=-3.7;z<3.9;z+=.65)for(let x=-4.25;x<4.5;x+=.7){
      const y= garden.h(x,z)??garden.y,depth=Math.max(.14,floor-y);
      batch.box(mat.darkStone,[x,floor-depth*.5,z],[.7,depth,.65]);
      batch.put(pebble,(Math.round((x+z)*10)%3)?mat.floor:mat.pale,[x,floor+.025,z],[.37,.045,.345],[0,random(x,z)*.17,0]);
    }
    // Rubble masonry expresses the retaining terrace at eye level. The core
    // stays behind these overlapping courses; individual stones continue down
    // to the terrain so the slope does not become a single smooth block face.
    const edges=[{along:'x',at:3.82,start:-4.45,end:4.48,seed:731},
      {along:'x',at:-4.02,start:-4.45,end:4.48,seed:752},
      {along:'z',at:-4.62,start:-4.05,end:3.85,seed:783},
      {along:'z',at:4.55,start:-4.05,end:3.85,seed:804}];
    for(const edge of edges){
      for(let row=0;row<28;row++){
        const cy=floor-.1-row*.26;
        for(let s=edge.start+(row%2?.27:0),i=0;s<=edge.end+.1;s+=.55,i++){
          const x=edge.along==='x'?s:edge.at,z=edge.along==='z'?s:edge.at;
          const groundY=garden.h(x,z)??garden.y;if(cy<groundY-.13)continue;
          const shade=random(i+row*29,edge.seed),material=shade<.18?mat.pale:shade>.79?mat.darkStone:mat.stone;
          const width=.32+random(i+row*19,edge.seed+1)*.09;
          const height=.17+random(i+row*23,edge.seed+2)*.055;
          const depth=.29+random(i+row*31,edge.seed+3)*.105;
          batch.put(pebble,material,[x,cy+(random(i,row+edge.seed)-.5)*.048,z],
            edge.along==='x'?[width,height,depth]:[depth,height,width],
            [(random(i+row,edge.seed+4)-.5)*.09,(random(i+row*11,edge.seed+5)-.5)*.16,(random(i+row*17,edge.seed+6)-.5)*.09]);
        }
      }
    }
    // A short, irregular stair interrupts the long south retaining wall and
    // makes the elevated court feel reachable from the surrounding ground.
    const stairX=.7,stairEndZ=8.1,stairBottom=garden.h(stairX,stairEndZ)??garden.y;
    const drops=Math.max(1,Math.ceil((floor-stairBottom)/.29));
    for(let i=0;i<drops;i++){
      const z=3.65+(stairEndZ-3.65)*(i+.5)/drops,top=THREE.MathUtils.lerp(floor,stairBottom,(i+.4)/drops);
      const support=garden.h(stairX,z)??stairBottom,depth=Math.max(.13,top-support);
      if(top<support-.08)continue;
      const tread=(stairEndZ-3.65)/drops+.055;
      batch.box(mat.darkStone,[stairX,top-depth*.5,z],[1.86,depth,tread]);
      for(let j=0;j<4;j++)batch.put(pebble,j%3?mat.stone:mat.pale,[stairX-.72+j*.47,top-.045,z],[.29,.1,tread*.61],[0,random(j,i+831)*.055,0]);
      for(const side of [-1,1]){
        for(let y=support+.12;y<top;y+=.23)batch.put(pebble,mat.stone,[stairX+side*.92,y,z],[.2,.16,tread*.58],[.05,random(i,side+844)*.15,0]);
      }
    }
    for(const [a,b] of [[[-4.7,-4.15],[4.7,-4.15]],[[-4.7,-4.15],[-4.7,4.2]],[[4.7,-4.15],[4.7,4.2]]])dryWall(garden,a,b,.7,.72,floor);
    const roof=floor+3.22;
    for(const x of [-3.5,3.5])for(const z of [-2.5,2.5]){
      batch.tube(mat.bark,[[x,floor,z],[x+.045,floor+1.2,z-.06],[x-.035,roof,z]],.105,7);
      batch.rod(mat.wood,[x,floor+2.5,z],[x-Math.sign(x)*.65,roof,z],.065);
      batch.tube(mat.bark,[[x+.12,floor,z],[x-.12,floor+1,z+.05],[x+.15,floor+2.1,z],[x,roof,z-.06]],.035,10);
    }
    for(const z of [-2.5,2.5])batch.rod(mat.wood,[-3.9,roof,z],[3.9,roof,z],.085);
    for(let x=-3.7;x<3.9;x+=.55)batch.rod(mat.wood,[x,roof+.03,-2.85],[x,roof+.03,2.85],.045);
    for(let i=0;i<9;i++){
      const x=-3.6+i*.9;batch.tube(mat.bark,[[x,roof+.08,-2.8],[x+.4,roof+.16,-1],[x-.18,roof+.13,1],[x+.3,roof+.06,2.85]],.023,13);
    }
    const vineLeaves=[];
    for(let i=0;i<1180;i++){
      const x=-3.85+random(i,601)*7.7,z=-2.88+random(i,602)*5.76;
      if(Math.hypot(x-.7,z+.4)<.67&&i%4)continue;
      vineLeaves.push({p:[x,roof+.08+random(i,604)*.2,z],r:[Math.PI*.47+(random(i,605)-.5)*.8,random(i,606)*6.28,random(i,607)*6.28],s:.66+random(i,608)*.65});
    }
    // Hanging tendrils and leaves let the rain read against a dark foreground.
    for(let i=0;i<18;i++){
      const x=-3.5+i*.41,z=i%2?2.64:-2.66,len=.3+random(i,622)*.95;
      batch.tube(mat.bark,[[x,roof,z],[x+.08,roof-len*.5,z+.06],[x-.04,roof-len,z]],.012,9);
      for(let j=0;j<6;j++)vineLeaves.push({p:[x+(j%2?.12:-.12),roof-j/6*len,z],r:[.3+j*.2,j,Math.sin(j)*.8],s:.65});
    }
    instances(broadLeaf,mat.vine,vineLeaves,garden.group);
    // Shared table, plain dishes and linen; it can be revisited for chapter 19.
    for(const x of [-1.55,1.55])for(const z of [-.5,.5])batch.rod(mat.wood,[x,floor,z],[x,floor+.94,z],.065);
    for(let z=-.7;z<.8;z+=.24)batch.box(mat.wood,[0,floor+1,z],[3.55,.105,.222]);
    batch.box(mat.cloth,[-.55,floor+1.06,0],[.72,.014,1.6]);
    for(const z of [-1.25,1.25]){
      batch.box(mat.wood,[0,floor+.53,z],[3.45,.14,.4]);
      for(const x of [-1.35,1.35])batch.box(mat.wood,[x,floor+.25,z],[.19,.5,.22]);
    }
    for(const x of [-1.1,.1,1.18]){
      const bowlGeo=new THREE.LatheGeometry([new THREE.Vector2(.07,0),new THREE.Vector2(.13,.035),new THREE.Vector2(.21,.1),new THREE.Vector2(.22,.16),new THREE.Vector2(.19,.16),new THREE.Vector2(.15,.06),new THREE.Vector2(.055,.035)],16);
      batch.put(bowlGeo,mat.clay,[x,floor+1.062,.25]);bowlGeo.dispose();
    }
    pottery(garden,1.0,floor+1.06,-.3,.48);pottery(garden,-3.05,floor,-1.9,.92);pottery(garden,-2.45,floor,-2.1,.68);
    // A narrow seasonal rill, rather than a permanent large river.
    const rill=[];for(let i=0;i<21;i++){
      const z=3.4+i*.39,x=-1.8+Math.sin(i*.23)*.3,y= Math.min(floor-.05,garden.h(x,z)??floor-.05);
      rill.push([x,y+.035,z]);for(const side of [-1,1])batch.put(pebble,mat.darkStone,[x+side*.28,y+.05,z],[.19,.12,.25],[0,i*.7,0]);
    }
    const rp=[],ru=[];for(let i=0;i<rill.length-1;i++){
      const a=rill[i],b=rill[i+1],q=[[a[0]-.18,a[1],a[2]],[a[0]+.18,a[1],a[2]],[b[0]-.18,b[1],b[2]],[b[0]+.18,b[1],b[2]]];
      for(const k of [0,2,1,1,2,3]){rp.push(...q[k]);ru.push(k%2,i*.2+(k>1?.2:0));}
    }
    const waterGeo=new THREE.BufferGeometry();waterGeo.setAttribute('position',new THREE.Float32BufferAttribute(rp,3));waterGeo.setAttribute('uv',new THREE.Float32BufferAttribute(ru,2));waterGeo.computeVertexNormals();const rillMesh=addMesh(waterGeo,mat.water,garden.group);rillMesh.castShadow=false;
    tree(garden,-6,-1.5,1.18,.06,true);tree(garden,6,-4.5,1.22,.1);tree(garden,7,4.5,.8,.12);
    dress(garden,18,330,(x,z)=>Math.abs(x)<5.1&&Math.abs(z)<4.6);
    view(garden,[0,floor+1.55,-.1],[-12,floor+4.3,15]);batch.finish();
    garden.group.userData.courtyardHeight=floor;
  }

  const north=place('north');
  if(north){
    const {y,batch}=north;
    const floor=Math.max(y,north.h(-4,-4)??y,north.h(2,-4)??y)+.1;
    for(let z=-4.4;z<-.45;z+=.8)for(let x=-3.8;x<2.1;x+=.8){
      const groundY=north.h(x,z)??y,depth=Math.max(.12,floor-groundY);
      batch.box(mat.stone,[x,floor-depth*.5,z],[.81,depth,.81]);
    }
    // Open-front shepherd's refuge; no modern windows or white domed buildings.
    dryWall(north,[-4,-4.6],[2,-4.6],2.3,.78,floor);
    dryWall(north,[-4,-4.6],[-4,-.5],2.3,.78,floor);
    dryWall(north,[2,-4.6],[2,-.5],2.3,.78,floor);
    batch.box(mat.floor,[-1,floor+.04,-2.5],[5.8,.09,4.0]);
    for(let x=-4.2;x<2.4;x+=.43)batch.rod(mat.wood,[x,floor+2.46,-4.9],[x,floor+2.18,.6],.055);
    for(let z=-4.75;z<.7;z+=.19)batch.rod(mat.bark,[-4.2,floor+2.47+(z+4.9)*(-.28/5.5),z],[2.3,floor+2.47+(z+4.9)*(-.28/5.5),z],.035);
    for(const x of [-3.9,1.9])batch.rod(mat.bark,[x,floor,.35],[x,floor+2.28,.35],.095);
    batch.box(mat.wood,[-1,floor+.55,-3.7],[3.0,.2,.65]);
    for(const x of [-2.15,.15])batch.box(mat.wood,[x,floor+.27,-3.7],[.22,.55,.45]);
    pottery(north,-3.2,floor,-2.9,.97);pottery(north,-2.5,floor,-3.2,.72);
    for(const [a,b] of [[[-6,1],[-6,8]],[[-6,8],[4.7,8]],[[4.7,8],[4.7,2]],[[4.7,2],[1.8,2]]])dryWall(north,a,b,.78,.75);
    // The gate's rough horizontals reinforce domestic scale at close range.
    for(const x of [-1.9,1.75])batch.rod(mat.bark,[x,north.h(x,2)??y,2],[x,(north.h(x,2)??y)+1.4,2],.085);
    for(const h of [.35,.72,1.09])batch.rod(mat.wood,[-1.9,(north.h(-1.9,2)??y)+h,2],[1.75,(north.h(1.75,2)??y)+h,2],.047);
    for(const [x,z,s] of [[-8,-3,1.3],[7,-5,1.15],[7,8,1.1],[-10,7,.9]])tree(north,x,z,s,.12);
    dress(north,22,430,(x,z)=>x>-4.6&&x<2.8&&z>-5.3&&z<1);
    view(north,[-1,floor+1.4,-.7],[13,floor+4.7,16]);batch.finish();
  }

  function update(time,wind=.35){
    timeUniform.value=time;windUniform.value=wind;
    for(const item of moving){item.node.rotation.z=Math.sin(time*.67+item.phase)*wind*item.amount;item.node.rotation.x=Math.cos(time*.53+item.phase)*wind*item.amount*.6;}
  }
  return {root,views,update};
}
