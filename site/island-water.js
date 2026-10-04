import * as THREE from 'three';

// World geometry and wave distances share the island's metre conversion.
export function createIslandWater(shoreTexture,bounds,scale=.035){
 const uniforms={time:{value:0},scale:{value:scale},eye:{value:new THREE.Vector3()},shore:{value:shoreTexture},bounds:{value:new THREE.Vector4(bounds.minX*scale,bounds.minZ*scale,bounds.width*scale,bounds.height*scale)},reflection:{value:null},reflectionMatrix:{value:new THREE.Matrix4()},fogColor:{value:new THREE.Color('#71818b')},fogDensity:{value:.018},sunDirection:{value:new THREE.Vector3(-.6,.45,-.5).normalize()}};
 const material=new THREE.ShaderMaterial({uniforms,vertexShader:`
 varying vec3 world; varying vec4 reflected; uniform mat4 reflectionMatrix;
 void main(){world=(modelMatrix*vec4(position,1.)).xyz;reflected=reflectionMatrix*vec4(world,1.);gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
 fragmentShader:`
 precision highp float;varying vec3 world;varying vec4 reflected;
 uniform float time,scale,fogDensity;uniform vec3 eye,fogColor,sunDirection;uniform vec4 bounds;uniform sampler2D shore,reflection;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 void main(){
 vec2 p=world.xz/scale;float t=time;vec2 grad=vec2(0.);
 grad+=vec2(.91,.41)*cos(dot(p,vec2(.91,.41))*.65-t*.7)*.032;
 grad+=vec2(-.3,.95)*cos(dot(p,vec2(-.3,.95))*1.27-t*.9)*.021;
 float detail=1.-smoothstep(4.,18.,length(eye-world));
 grad+=vec2(.52,.85)*cos(dot(p,vec2(.52,.85))*5.1-t*1.4+noise(p*.23))*.012*detail;
 grad*=2.1;vec3 N=normalize(vec3(-grad.x,1.,-grad.y)),V=normalize(eye-world),H=normalize(V+sunDirection);
 float fresnel=.035+.965*pow(1.-max(0.,dot(N,V)),5.);
 vec2 uv=(world.xz-bounds.xy)/bounds.zw;bool inside=all(greaterThanEqual(uv,vec2(0)))&&all(lessThanEqual(uv,vec2(1)));
 float shoreDistance=inside?(texture2D(shore,uv).r-.5)*2048.:-200.;
 float coast=max(0.,-shoreDistance);
 vec3 col=mix(vec3(.049,.105,.11),vec3(.022,.061,.079),smoothstep(1.,40.,coast));
 col*=.89+.11*noise(p*.15+time*.02);col+=vec3(.022,.029,.027)*pow(max(0.,sin(p.x*1.27+p.y*.41-time*.8)*sin(p.y*1.12-time*.65)),5.);
 vec2 ruv=reflected.xy/reflected.w+grad*.045;
 vec3 reflectedColor=vec3(.23,.29,.31);
 if(all(greaterThan(ruv,vec2(0)))&&all(lessThan(ruv,vec2(1))))reflectedColor=texture2D(reflection,ruv).rgb;
 col=mix(col,reflectedColor,.18+fresnel*.62);
 col+=vec3(.9,.66,.37)*pow(max(dot(N,H),0.),180.)*.23;
 float foam=(1.-smoothstep(1.,7.,coast))*smoothstep(-1.,1.,-shoreDistance);
 foam*=smoothstep(.79,.99,sin(coast*1.3-time*.75+noise(p*.32)*2.));
 col=mix(col,vec3(.37,.43,.41),foam*.3);
 float fog=1.-exp(-pow(length(eye-world)*fogDensity,2.));col=mix(col,fogColor,min(.94,fog));
 gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1800,1800),material);mesh.rotation.x=-Math.PI/2;mesh.position.y=-.004;mesh.name='Aegean · human-scale ripples';
 return {mesh,uniforms};
}
