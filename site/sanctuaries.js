import * as THREE from 'three';

// Two quiet places on the same island. Their details are authored at the
// supplied terrain anchors; these are artistic settings, not surveyed ruins.
export function createSanctuaries({scene, ground, points}) {
  const rand=(i,j=0)=>{const v=Math.sin(i*127.1+j*311.7)*43758.5453123;return v-Math.floor(v);};
  const movingLeaves=[], flames=[];
  const dummy=new THREE.Object3D(), matrix=new THREE.Matrix4();
  function tex(kind) {
    const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
    x.fillStyle=kind==='wood'?'#aa9472':kind==='path'?'#c2b99c':'#bdb5a0';x.fillRect(0,0,512,512);
    for(let i=0;i<5400;i++) {
      const v=rand(i,12),q=Math.floor(26+v*80);x.fillStyle=`rgba(${q},${q*.91},${q*.76},${.015+rand(i,13)*.12})`;
      x.fillRect(rand(i,1)*512,rand(i,2)*512,kind==='wood'?.7:1.2+rand(i,3)*3,kind==='wood'?4+rand(i,4)*26:1.3+rand(i,4)*3);
    }
    if(kind==='stone') for(let i=0;i<36;i++) {
      let px=rand(i,34)*512,py=rand(i,35)*512;x.beginPath();x.moveTo(px,py);
      for(let j=0;j<9;j++){px+=8+rand(i*10+j,36)*14;py+=rand(i*10+j,37)*13-6.5;x.lineTo(px,py);}
      x.strokeStyle='rgba(65,60,47,.11)';x.lineWidth=.5+rand(i,38);x.stroke();
    }
    if(kind==='wood') for(let i=0;i<76;i++) {
      const px=i*7;x.beginPath();x.moveTo(px,0);for(let py=0;py<=512;py+=12)x.lineTo(px+Math.sin(py*.034+i)*2.2,py);
      x.strokeStyle='rgba(48,38,27,.15)';x.lineWidth=.4+rand(i,6)*1.5;x.stroke();
    }
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
  }
  const stoneMap=tex('stone'),woodMap=tex('wood'),pathMap=tex('path');
  const material={
    stone:new THREE.MeshStandardMaterial({color:'#aba48d',map:stoneMap,bumpMap:stoneMap,bumpScale:.07,roughness:.98}),
    pale:new THREE.MeshStandardMaterial({color:'#cac0a3',map:stoneMap,bumpMap:stoneMap,bumpScale:.035,roughness:.97}),
    dark:new THREE.MeshStandardMaterial({color:'#797568',map:stoneMap,bumpMap:stoneMap,bumpScale:.07,roughness:1}),
    moss:new THREE.MeshStandardMaterial({color:'#797d60',map:stoneMap,roughness:1}),
    wood:new THREE.MeshStandardMaterial({color:'#776c50',map:woodMap,bumpMap:woodMap,bumpScale:.03,roughness:.94}),
    cutWood:new THREE.MeshStandardMaterial({color:'#b3a481',map:woodMap,bumpMap:woodMap,bumpScale:.013,roughness:.92}),
    earth:new THREE.MeshStandardMaterial({color:'#a69874',map:pathMap,bumpMap:pathMap,bumpScale:.02,roughness:1}),
    leaf:new THREE.MeshStandardMaterial({color:'#777f59',roughness:.92,side:THREE.DoubleSide}),
    silver:new THREE.MeshStandardMaterial({color:'#9b9e75',roughness:.9,side:THREE.DoubleSide}),
    grass:new THREE.MeshStandardMaterial({color:'#777b52',roughness:1,side:THREE.DoubleSide}),
    straw:new THREE.MeshStandardMaterial({color:'#9d946c',roughness:1,side:THREE.DoubleSide}),
    clay:new THREE.MeshStandardMaterial({color:'#a88761',roughness:.91}),
    potteryDark:new THREE.MeshStandardMaterial({color:'#685a43',roughness:.92}),
    paper:new THREE.MeshStandardMaterial({color:'#cdbd93',map:pathMap,roughness:1,side:THREE.DoubleSide}),
    ink:new THREE.MeshStandardMaterial({color:'#685d46',roughness:1}),
    flame:new THREE.MeshStandardMaterial({color:'#ffcd6c',emissive:'#ffb642',emissiveIntensity:2.6,roughness:.85}),
    lizard:new THREE.MeshStandardMaterial({color:'#727854',roughness:.88}),
    eye:new THREE.MeshStandardMaterial({color:'#282920',roughness:.25}),
  };
  const cube=new THREE.BoxGeometry(1,1,1), stone=new THREE.IcosahedronGeometry(1,1),sphere=new THREE.SphereGeometry(1,10,7),rod=new THREE.CylinderGeometry(1,1,1,7);
  const leaf=new THREE.Shape();leaf.moveTo(0,0);leaf.quadraticCurveTo(.085,.13,0,.38);leaf.quadraticCurveTo(-.07,.15,0,0);
  const leafGeo=new THREE.ShapeGeometry(leaf,3);leafGeo.translate(0,-.19,0);
  const blade=new THREE.BufferGeometry();blade.setAttribute('position',new THREE.Float32BufferAttribute([-.035,0,0,.035,0,0,.12,.75,0],3));blade.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1],2));blade.computeVertexNormals();

  function mesh(g,m,parent){const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  class Batch {
    constructor(parent){this.parent=parent;this.parts=new Map();}
    add(g,m,p,s=[1,1,1],r=[0,0,0]){
      dummy.position.set(...p);dummy.scale.set(...s);dummy.rotation.set(...r);dummy.updateMatrix();const c=g.index?g.toNonIndexed():g.clone();c.applyMatrix4(dummy.matrix);this.append(c,m);
    }
    append(g,m){if(!this.parts.has(m))this.parts.set(m,[]);this.parts.get(m).push(g);}
    box(m,p,s,r){this.add(cube,m,p,s,r);}
    tube(m,pts,r=.1,segments=16){const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),segments,r,7,false);this.add(g,m,[0,0,0]);g.dispose();}
    rod(m,a,b,r=.04){const p=new THREE.Vector3(...a),v=new THREE.Vector3(...b).sub(p);matrix.compose(p.addScaledVector(v,.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize()),new THREE.Vector3(r,v.length(),r));const g=rod.toNonIndexed();g.applyMatrix4(matrix);this.append(g,m);}
    finish(){for(const[m,parts]of this.parts){const count=parts.reduce((n,g)=>n+g.attributes.position.count,0),p=new Float32Array(count*3),n=new Float32Array(count*3),uv=new Float32Array(count*2);let i=0;for(const g of parts){p.set(g.attributes.position.array,i*3);n.set(g.attributes.normal.array,i*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,i*2);i+=g.attributes.position.count;g.dispose();}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('normal',new THREE.BufferAttribute(n,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.computeBoundingSphere();mesh(g,m,this.parent);}this.parts.clear();}
  }
  function site(anchor,name,yaw=0){const root=new THREE.Group();root.name=name;root.position.set(anchor.x,0,anchor.z);root.rotation.y=yaw;scene.add(root);const c=Math.cos(yaw),s=Math.sin(yaw),world=(x,h,z)=>new THREE.Vector3(anchor.x+c*x+s*z,h,anchor.z-s*x+c*z),y=(x,z)=>{const p=world(x,0,z);return ground(p.x,p.z)?.height??anchor.y;};return{root,y,b:new Batch(root),world};}
  function rocks(s,number,radius,seed){for(let i=0;i<number;i++){const a=rand(i,seed)*Math.PI*2,r=2+rand(i,seed+1)*radius,x=Math.cos(a)*r,z=Math.sin(a)*r,h=.12+rand(i,seed+2)*.35;if(s.y(x,z)<.2)continue;s.b.add(stone,i%6===0?material.moss:material.pale,[x,s.y(x,z)+h*.2,z],[h*(1.4+rand(i,seed+3)),h,h*1.3],[rand(i,seed+5)*3,rand(i,seed+6)*6,rand(i,seed+7)]);}}
  function grass(s,number,radius,seed){for(let i=0;i<number;i++){const a=rand(i,seed)*Math.PI*2,r=2+rand(i,seed+1)*radius,x=Math.cos(a)*r,z=Math.sin(a)*r,h=s.y(x,z);if(h<.2)continue;for(let j=0;j<4;j++)s.b.add(blade,i%3?material.grass:material.straw,[x+rand(i*7+j,4)*.2,h+.04,z+rand(i*7+j,5)*.2],[.7+rand(i,j),.3+rand(i,j+1)*.75,1],[0,rand(i*7+j,6)*Math.PI*2,(rand(i,j+2)-.5)*.2]);}}
  function wall(s,pts,layers=3){for(let k=0;k<pts.length-1;k++){const a=new THREE.Vector2(...pts[k]),b=new THREE.Vector2(...pts[k+1]),d=a.distanceTo(b),n=Math.ceil(d/.64);for(let j=0;j<n;j++){const t=j/n,x=THREE.MathUtils.lerp(a.x,b.x,t),z=THREE.MathUtils.lerp(a.y,b.y,t),h=s.y(x,z);for(let row=0;row<layers;row++)s.b.add(stone,row===layers-1?material.pale:material.stone,[x+(row%2)*.16,h+.18+row*.3,z],[.43+rand(j,k)*.08,.19+rand(j,row)*.05,.3],[rand(j,k+1)*.2,Math.atan2(b.x-a.x,b.y-a.y),rand(j,k+2)*.1]);}}}
  function lamp(s,x,y,z){s.b.add(sphere,material.clay,[x,y,z],[.22,.105,.16]);s.b.add(sphere,material.potteryDark,[x,y+.068,z],[.115,.018,.09]);s.b.add(sphere,material.clay,[x+.19,y+.025,z],[.1,.048,.065]);const f=mesh(sphere,material.flame,s.root);f.position.set(x+.23,y+.13,z);f.scale.set(.033,.11,.033);flames.push(f);const l=new THREE.PointLight('#ffc978',1.25,6,1.8);l.position.set(x+.23,y+.28,z);s.root.add(l);return l;}
  function jar(s,x,y,z,scale=1){const g=new THREE.LatheGeometry([[0,0],[.14,0],[.22,.12],[.25,.4],[.14,.62],[.1,.67],[.1,.78],[.13,.8]].map(p=>new THREE.Vector2(...p)),12);s.b.add(g,material.clay,[x,y,z],[scale,scale,scale]);s.b.add(new THREE.TorusGeometry(.115,.022,5,12),material.potteryDark,[x,y+.8*scale,z],[scale,scale,scale],[Math.PI*.5,0,0]);g.dispose();}

  // CAVE: a genuine open rock volume, with a weathered lip and a lit inner
  // ledge. Facets and fissures break the silhouette instead of a black decal.
  const cave=site(points.cave,'Shelter beneath the island rock',Math.PI),cy=cave.y(0,0);
  const segments=20,zRings=[2.7,1,-1.5,-4.2],verts=[],uvs=[],inside=[],outside=[],lip=[];
  for(let ring=0;ring<zRings.length;ring++)for(let outer=0;outer<2;outer++)for(let j=0;j<=segments;j++){
    const a=j/segments*Math.PI,jitter=(rand(j,ring+70)-.5)*.22;
    const rx=(outer?6.7:4.8)+jitter,ry=(outer?5.8:3.7)+jitter;
    verts.push(Math.cos(a)*rx,cy+.3+Math.sin(a)*ry+(outer?.1:0),zRings[ring]+(rand(j,ring+80)-.5)*.35);uvs.push(j/segments*3,ring*.8+outer*.1);
  }
  const stride=(segments+1)*2,ix=(r,o,j)=>r*stride+o*(segments+1)+j;
  for(let r=0;r<zRings.length-1;r++)for(let o=0;o<2;o++)for(let j=0;j<segments;j++){const a=ix(r,o,j),b=ix(r,o,j+1),c=ix(r+1,o,j),d=ix(r+1,o,j+1);(o?outside:inside).push(a,b,c,b,d,c);}
  for(let j=0;j<segments;j++){const a=ix(0,0,j),b=ix(0,0,j+1),c=ix(0,1,j),d=ix(0,1,j+1);lip.push(a,c,b,b,c,d);}
  for(const [indices,mat] of [[outside,material.stone],[inside,material.dark],[lip,material.pale]]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();mat.side=THREE.DoubleSide;mesh(g,mat,cave.root);}
  for(let i=0;i<16;i++){const a=i/15*Math.PI,x=Math.cos(a)*6.15,z=2.3+(rand(i,99)-.5)*.7,y=cy+.4+Math.sin(a)*4.75;cave.b.add(stone,i%3?material.stone:material.pale,[x,y,z],[.8+rand(i,94)*.75,.55+rand(i,95)*.7,.55+rand(i,96)*.6],[rand(i,97)*.2,rand(i,98)*.8,rand(i,99)*.35]);}
  for(let i=0;i<10;i++){const x=-5+i*1.07;cave.b.add(stone,i%3?material.dark:material.stone,[x,Math.max(cy,cave.y(x,-4.5))+1.5,-4.3],[1.2,2.1+rand(i,91)*1.1,1.1],[rand(i,90)*.4,rand(i,92),rand(i,93)*.2]);}
  for(let i=0;i<6;i++)cave.b.add(stone,material.stone,[-6.9+(i%2)*13.8,cave.y(i%2?6.9:-6.9,i*.7-1)+.7,i*.7-1],[1.6,1.3+rand(i,87),1.5],[rand(i,84),rand(i,85),rand(i,86)]);
  // A softly irregular stone floor covers the raw terrain under the shelter.
  for(let z=-2.9;z<4.8;z+=.86)for(let x=-3.7;x<3.9;x+=.96){const terrainY=cave.y(x,z),gy=Math.max(cy-.06,terrainY);cave.b.add(stone,material.dark,[x,(gy+terrainY)*.5-.09,z],[.62,(gy-terrainY)*.5+.16,.58],[0,rand(x,z)*.2,0]);}
  const by=Math.max(cy,cave.y(-2,-1.5));
  for(let x=-3;x<-.8;x+=.24)cave.b.box(material.cutWood,[x,by+.95,-1.1],[.225,.11,.72]);
  for(const x of [-2.85,-1.05])for(const z of [-1.36,-.85])cave.b.rod(material.wood,[x,by+.02,z],[x,by+.92,z],.065);
  cave.b.rod(material.wood,[-2.85,by+.4,-1.1],[-1.05,by+.4,-1.1],.045);
  // Two rolled ends and a narrow writing surface suggest work left in quiet.
  cave.b.box(material.paper,[-2,by+1.025,-1.1],[.9,.014,.49]);
  for(const x of [-2.44,-1.56])cave.b.add(rod,material.paper,[x,by+1.066,-1.1],[.055,.56,.055],[Math.PI*.5,0,0]);
  for(let i=0;i<7;i++)cave.b.box(material.ink,[-2.02,by+1.035,-1.29+i*.055],[.38+rand(i,81)*.21,.005,.005]);
  lamp(cave,-2.92,by+1.055,-1.06);lamp(cave,2.4,Math.max(cy,cave.y(2.4,-1.5))+.2,-1.5);
  const sy=Math.max(cy,cave.y(-1.7,.45));cave.b.add(rod,material.cutWood,[-1.7,sy+.56,.45],[.4,.11,.35]);
  for(let i=0;i<3;i++){const a=i/3*Math.PI*2;cave.b.rod(material.wood,[-1.7+Math.cos(a)*.27,sy+.52,.45+Math.sin(a)*.27],[-1.7+Math.cos(a)*.35,sy,.45+Math.sin(a)*.35],.055);}
  jar(cave,2.8,Math.max(cy,cave.y(2.8,-.5)),-.5,1.1);jar(cave,3.3,Math.max(cy,cave.y(3.3,-.2)),-.2,.7);
  wall(cave,[[-7,4],[-5.9,5.1],[-4.2,5.5]],3);wall(cave,[[4.8,5.4],[6.5,5],[7.3,3.8]],3);
  for(let i=0;i<9;i++){const x=(rand(i,113)-.5)*6,z=4+i*.65;cave.b.add(stone,material.pale,[x,cave.y(x,z)+.04,z],[.5+rand(i,111)*.55,.11,.5],[0,rand(i,112)*3,0]);}
  rocks(cave,65,9,100);grass(cave,90,10,130);
  const liz=new THREE.Group();liz.name='A lizard warming on the shelter stone';cave.root.add(liz);liz.position.set(4.9,cave.y(4.9,5.9)+.28,5.9);liz.rotation.y=-.6;
  const lb=new Batch(liz);lb.add(sphere,material.lizard,[0,.035,0],[.105,.06,.25]);lb.add(sphere,material.lizard,[0,.06,.26],[.07,.045,.1]);
  lb.tube(material.lizard,[[0,.035,-.18],[-.04,.035,-.36],[-.16,.02,-.5],[-.12,.02,-.65]],.028,13);
  for(const side of [-1,1])for(const z of [-.13,.13])lb.tube(material.lizard,[[0,.04,z],[side*.15,.025,z-.02],[side*.22,0,z+.08]],.024,6);
  for(const x of [-.053,.053])lb.add(sphere,material.eye,[x,.079,.282],[.011,.011,.011]);lb.finish();cave.b.finish();

  // OLIVE PATH: long narrow leaves, twisted exposed wood, dry walls and a
  // curving walk create a place to watch wind at human scale.
  const olive=site(points.olive,'Old olive path');
  const pathCenters=Array.from({length:48},(_,i)=>{const z=-19+i/47*29,x=Math.sin(z*.16)*2;return[x,z];}),pathPositions=[],pathUV=[];
  for(let i=0;i<pathCenters.length-1;i++){
    const[x,z]=pathCenters[i],[nx,nz]=pathCenters[i+1],dx=nx-x,dz=nz-z,len=Math.hypot(dx,dz),wx=dz/len*1.05,wz=-dx/len*1.05;
    const q=[[x-wx,z-wz],[x+wx,z+wz],[nx-wx,nz-wz],[nx+wx,nz+wz]];
    for(const k of [0,2,1,1,2,3]){const[p,r]=q[k];pathPositions.push(p,olive.y(p,r)+.065,r);pathUV.push(k%2,i*.2+(k>1?.2:0));}
  }
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(pathPositions,3));pg.setAttribute('uv',new THREE.Float32BufferAttribute(pathUV,2));pg.computeVertexNormals();mesh(pg,material.earth,olive.root);
  wall(olive,[[-4,8],[-5,4],[-5,0],[-6,-4],[-5,-8],[-4,-13],[-4,-18]],2);
  wall(olive,[[5,-17],[6,-13],[7,-9],[7,-5]],3);

  function oliveTree(x,z,height,seed){
    const y=olive.y(x,z),lean=(rand(seed,1)-.5)*.9;
    // The swollen roots and intertwined trunk tubes leave natural dark gaps.
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;olive.b.tube(material.wood,[[x+Math.cos(a)*.95,y+.03,z+Math.sin(a)*.65],[x+Math.cos(a)*.37,y+.45,z+Math.sin(a)*.33],[x+lean*.4,y+height*.36,z],[x+lean,y+height*.63,z+.13]],.15+rand(seed,i)*.09,13);}
    const crown=[];
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2+rand(seed,3),bx=x+Math.cos(a)*(1.3+rand(i,seed)) + lean,bz=z+Math.sin(a)*(1.2+rand(i,seed+1)),by=y+height*(.8+rand(i,seed+2)*.17);
      olive.b.tube(material.wood,[[x+lean*.45,y+height*.42,z],[x+Math.cos(a)*.7,y+height*.67,z+Math.sin(a)*.5],[bx,by,bz]],.09+rand(seed,i+4)*.03,12);crown.push([bx-x,by-y,bz-z]);
      for(let j=0;j<3;j++){const aa=a+(j-1)*.8,ex=bx+Math.cos(aa)*.8,ez=bz+Math.sin(aa)*.65;olive.b.rod(material.wood,[bx,by,bz],[ex,by+.28,ez],.026);crown.push([ex-x,by-y+.3,ez-z]);}
    }
    const foliage=new THREE.Group();foliage.position.set(x,y,z);olive.root.add(foliage);movingLeaves.push({g:foliage,seed});
    for(let tint=0;tint<2;tint++){
      const count=380,inst=new THREE.InstancedMesh(leafGeo,tint?material.silver:material.leaf,count);inst.castShadow=true;inst.receiveShadow=true;foliage.add(inst);
      for(let i=0;i<count;i++){const k=i+tint*count,c=crown[k%crown.length],a=rand(k,seed+22)*Math.PI*2,r=Math.sqrt(rand(k,seed+24))*.95;
        dummy.position.set(c[0]+Math.cos(a)*r,c[1]+(rand(k,seed+25)-.5)*1.1,c[2]+Math.sin(a)*r*.8);dummy.rotation.set(rand(k,seed+26)*Math.PI,rand(k,seed+27)*Math.PI*2,rand(k,seed+28)*Math.PI*2);dummy.scale.setScalar(.65+rand(k,seed+29)*.6);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);}
      inst.instanceMatrix.needsUpdate=true;inst.computeBoundingSphere();
    }
  }
  [[-7,-13,4.3],[-6,-4,4.7],[-7,4,4.1],[5,-16,3.5],[6,-8,4.2],[5,-.5,4.8],[6,7,3.8],[-5,-19,3.3]].forEach((p,i)=>oliveTree(...p,210+i*17));
  // One younger tree grows beside the old path, a quiet scene-specific cue.
  oliveTree(2.8,-5.5,2.2,513);
  rocks(olive,125,14,370);grass(olive,250,15,400);
  for(let i=0;i<48;i++){const z=-18+rand(i,480)*27,x=Math.sin(z*.16)*2+(rand(i,481)>.5?1:-1)*(1.25+rand(i,482)*.6),h=.05+rand(i,483)*.11;olive.b.add(stone,material.pale,[x,olive.y(x,z)+h*.2,z],[h*2,h,h*1.6],[0,rand(i,484)*6,0]);}
  // A low stone seat, with wear polished into its upper face.
  const seatY=olive.y(-3,2);olive.b.add(stone,material.stone,[-3,seatY+.32,2],[1.15,.42,.56]);olive.b.add(stone,material.pale,[-3,seatY+.63,2],[1.19,.13,.62]);
  olive.b.finish();

  const views={
    cave:{target:cave.world(0,cy+2,0.4),position:cave.world(-10,Math.max(cy+4.1,cave.y(-10,18)+2.1),18)},
    olive:{target:olive.world(0,olive.y(0,-5)+1.7,-5),position:olive.world(0,Math.max(olive.y(0,-5)+5,olive.y(0,9)+2.5),9)},
  };
  return {views,update(time,wind=.3){
    for(const {g,seed}of movingLeaves){g.rotation.z=Math.sin(time*.7+seed)*(.003+wind*.012);g.rotation.x=Math.sin(time*.51+seed*.7)*(.002+wind*.007);}
    for(let i=0;i<flames.length;i++){flames[i].scale.y=.09+Math.sin(time*9+i*2)*.014+Math.sin(time*17+i)*.012;flames[i].rotation.z=Math.sin(time*7+i)*.16;}
    liz.rotation.y=-.6+Math.sin(time*.27)*.055;
  }};
}
