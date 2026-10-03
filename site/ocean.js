import * as THREE from 'three';

// Lightweight surface animation + an actual planar scene-reflection texture.
// This is raster rendering, not ray tracing or a fluid dynamics solver.
export function createMiniSea(shoreTexture, bounds) {
  const uniforms={time:{value:0},wind:{value:.45},rain:{value:0},sunset:{value:0},eye:{value:new THREE.Vector3()},shore:{value:shoreTexture},bounds:{value:new THREE.Vector4(bounds.minX*.035,bounds.minZ*.035,bounds.width*.035,bounds.height*.035)},reflection:{value:null},reflectionMatrix:{value:new THREE.Matrix4()}};
  const material=new THREE.ShaderMaterial({uniforms,vertexShader:`
    varying vec3 world; varying vec4 reflected; uniform mat4 reflectionMatrix;
    void main(){world=(modelMatrix*vec4(position,1.)).xyz;reflected=reflectionMatrix*vec4(world,1.);gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
  fragmentShader:`
    precision highp float; varying vec3 world; varying vec4 reflected;
    uniform float time,wind,rain,sunset;uniform vec3 eye;uniform sampler2D shore,reflection;uniform vec4 bounds;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    void main(){
      vec2 p=world.xz;vec2 uv=(p-bounds.xy)/bounds.zw;
      bool inside=all(greaterThanEqual(uv,vec2(0)))&&all(lessThanEqual(uv,vec2(1)));
      float signedD=inside?(texture2D(shore,uv).r-.5)*71.68:-60.;float coast=max(0.,-signedD);
      float t=time*(.6+wind*.7);float a=sin(p.x*.9+p.y*.65-t*1.6),b=sin(p.x*.4-p.y*1.25+t*1.1);
      vec2 ripples=vec2(a,b)*(.015+wind*.035);vec3 N=normalize(vec3(ripples.x,1.,ripples.y));
      vec3 V=normalize(eye-world);float fresnel=.08+.55*pow(1.-max(0.,dot(N,V)),4.);
      vec3 deep=mix(vec3(.047,.33,.40),vec3(.11,.29,.32),rain*.5);
      vec3 shallow=vec3(.22,.69,.61);vec3 col=mix(shallow,deep,smoothstep(.2,16.,coast));
      float caustic=pow(max(0.,sin(p.x*3.1+sin(p.y*2.7+t)*.8+t)*sin(p.y*3.3-t*.7)),5.);
      col+=vec3(.14,.23,.14)*caustic*(1.-smoothstep(1.,9.,coast));
      vec2 refUV=reflected.xy/reflected.w+ripples*.018;
      if(all(greaterThan(refUV,vec2(.001)))&&all(lessThan(refUV,vec2(.999))))col=mix(col,texture2D(reflection,refUV).rgb,fresnel);
      vec3 L=normalize(vec3(-.45,.8,.35));float sparkle=pow(max(0.,dot(reflect(-L,N),V)),150.);
      col+=mix(vec3(1.,.94,.65),vec3(1.,.61,.23),sunset)*sparkle*(1.-rain*.8)*1.3;
      float breaker=smoothstep(.55,.95,sin(coast*4.-t*2.3+noise(p*.7)*2.));
      float foam=breaker*(1.-smoothstep(.2,1.8,coast))*smoothstep(-.6,.1,-signedD);
      foam*=smoothstep(.2,.55,noise(p*2.8+t*.15));col=mix(col,vec3(.9,.96,.82),foam*.8);
      float rainRing=pow(max(0.,sin(length(fract(p*1.5)-.5)*30.-time*10.)),15.);col+=rainRing*.07*rain;
      col=mix(col,col*vec3(1.09,.89,.69),sunset*.6);gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000,1,1),material);mesh.rotation.x=-Math.PI/2;mesh.position.y=-.08;mesh.name='Animated sea with planar reflection';
  return {mesh,uniforms};
}
