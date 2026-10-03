import * as THREE from 'three';

// A distant, stylized sperm whale. A quiet observation, not a combat creature.
export function createVoyage(scene) {
  const group=new THREE.Group(); group.name='Whale passage'; scene.add(group);
  const skin=new THREE.MeshStandardMaterial({color:'#526061',roughness:.32,metalness:.08});
  const rings=[[-6,.06,.07],[-5,.22,.22],[-4,.43,.42],[-2,.86,.7],[0,1.14,.91],[2,1.36,1.03],[3.6,1.39,1.08],[4.4,1.24,.98],[4.75,.82,.72],[4.8,.02,.03]];
  const pos=[],uv=[],idx=[],segments=28;
  for(let r=0;r<rings.length;r++)for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2,[z,rx,ry]=rings[r];pos.push(Math.cos(a)*rx,Math.sin(a)*ry,z);uv.push(j/segments,r/(rings.length-1));if(r&&j){let n=r*(segments+1)+j;idx.push(n,n-1,n-segments-1,n-1,n-segments-2,n-segments-1);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
  const body=new THREE.Mesh(geo,skin);body.castShadow=true;group.add(body);
  const fluke=new THREE.Shape();fluke.moveTo(0,0);fluke.bezierCurveTo(-.55,-.6,-2.2,-.5,-2.6,.6);fluke.bezierCurveTo(-1.3,.58,-.5,1.1,0,.72);fluke.bezierCurveTo(.5,1.1,1.3,.58,2.6,.6);fluke.bezierCurveTo(2.2,-.5,.55,-.6,0,0);
  const tail=new THREE.Mesh(new THREE.ExtrudeGeometry(fluke,{depth:.10,bevelEnabled:true,bevelSize:.08,bevelThickness:.04,bevelSegments:2,steps:1,curveSegments:10}),skin);tail.rotation.x=-Math.PI/2;tail.position.set(0,0,-5.95);group.add(tail);
  for(const side of [-1,1]){const fin=new THREE.Mesh(new THREE.SphereGeometry(1,14,8),skin);fin.scale.set(.35,.10,1.16);fin.position.set(side*1.12,-.40,.7);fin.rotation.y=side*-.65;group.add(fin);const eye=new THREE.Mesh(new THREE.SphereGeometry(.072,10,8),new THREE.MeshStandardMaterial({color:'#0d1617',roughness:.1}));eye.position.set(side*1.30,-.16,2.6);group.add(eye);}
  const hump=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),skin);hump.scale.set(.42,.28,.65);hump.position.set(0,.64,-2.4);group.add(hump);
  const sprayGeometry=new THREE.BufferGeometry(),sprayPositions=new Float32Array(60*3);sprayGeometry.setAttribute('position',new THREE.BufferAttribute(sprayPositions,3));
  const spray=new THREE.Points(sprayGeometry,new THREE.PointsMaterial({color:'#e2e4dd',size:.14,transparent:true,opacity:.6,depthWrite:false}));group.add(spray);
  const waterline=new THREE.Mesh(new THREE.RingGeometry(1.9,2.0,48),new THREE.MeshBasicMaterial({color:'#c4d0c9',transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));waterline.rotation.x=-Math.PI/2;scene.add(waterline);
  return {update(time,visible){
    group.visible=waterline.visible=visible;if(!visible)return;
    const cycle=time%24,breath=(time%10)/10;
    group.position.set(-22+Math.sin(time*.07)*10,-.55-(cycle>18?Math.sin((cycle-18)/6*Math.PI)*2.3:0),-4+Math.cos(time*.07)*2);
    group.rotation.set(Math.sin(time*.3)*.025,Math.PI/2+Math.sin(time*.07)*.15,0);tail.rotation.z=Math.sin(time*.65)*.10;
    spray.visible=breath<.3;for(let i=0;i<60;i++){const t=(breath/.3+i/150)%1,a=i*2.399;sprayPositions.set([-.42+t*.9+Math.cos(a)*t*.36,1+t*2.5,3.4+Math.sin(a)*t*.4],i*3);}sprayGeometry.attributes.position.needsUpdate=true;
    spray.material.opacity=(1-breath/.3)*.58;waterline.position.set(group.position.x,-.035,group.position.z);waterline.scale.set(2.4,1,.8);waterline.material.opacity=cycle>18?.025:.10;
  }};
}
