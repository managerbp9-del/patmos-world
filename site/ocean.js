import * as THREE from 'three';

// Shared long waves keep hull flotation in the rhythm of the rendered surface.
// Fine ripples and planar reflections are raster effects, not a fluid simulation.
const waves = [
  {x:.932,z:.362,k:.235,speed:.72,amplitude:.092,phase:0},
  {x:-.43,z:.903,k:.408,speed:.91,amplitude:.042,phase:1.7},
  {x:.61,z:-.792,k:.713,speed:1.13,amplitude:.019,phase:3.4}
];
const waveGLSL=waves.map(w=>`{
  vec2 axis=vec2(${w.x.toFixed(3)},${w.z.toFixed(3)});
  float phase=dot(p,axis)*${w.k.toFixed(3)}-t*${w.speed.toFixed(3)}+${w.phase.toFixed(3)};
  float amplitude=${w.amplitude.toFixed(3)}*(.55+wind*.8);
  height+=sin(phase)*amplitude;
  gradient+=axis*cos(phase)*amplitude*${w.k.toFixed(3)};
}`).join('\n');

export function createMiniSea(shoreTexture, bounds) {
  const uniforms={
    time:{value:0},wind:{value:.32},rain:{value:0},sunset:{value:0},
    eye:{value:new THREE.Vector3()},shore:{value:shoreTexture},
    bounds:{value:new THREE.Vector4(bounds.minX*.035,bounds.minZ*.035,bounds.width*.035,bounds.height*.035)},
    reflection:{value:null},reflectionMatrix:{value:new THREE.Matrix4()},
    sunDirection:{value:new THREE.Vector3(.4,.16,-.85).normalize()},
    sunColor:{value:new THREE.Color().setRGB(1.0,.77,.48)},
    fogColor:{value:new THREE.Color().setRGB(.39,.405,.38)},fogDensity:{value:.0018}
  };
  const material=new THREE.ShaderMaterial({uniforms,vertexShader:`
    varying vec3 world; varying vec4 reflected;
    uniform mat4 reflectionMatrix; uniform float time,wind;
    void main(){
      world=(modelMatrix*vec4(position,1.)).xyz;
      vec2 p=world.xz;float t=time;float height=0.;vec2 gradient=vec2(0.);
      ${waveGLSL}
      world.y+=height;
      reflected=reflectionMatrix*vec4(world.x,-.08,world.z,1.);
      gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
    }`,fragmentShader:`
    precision highp float;
    varying vec3 world; varying vec4 reflected;
    uniform float time,wind,rain,sunset,fogDensity;
    uniform vec3 eye,sunDirection,sunColor,fogColor;
    uniform sampler2D shore,reflection;uniform vec4 bounds;
    const float PI=3.14159265;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    void main(){
      vec2 p=world.xz;float t=time;float height=0.;vec2 gradient=vec2(0.);
      ${waveGLSL}
      // Crossing ripple trains break reflections into gently moving shards.
      float detail=(.55+wind*.65);
      float q=dot(p,vec2(.86,.51))*1.63-t*1.22+sin(p.y*.32+t*.24)*.45;
      gradient+=vec2(.86,.51)*cos(q)*.054*detail;
      q=dot(p,vec2(-.32,.948))*2.83-t*1.78+sin(p.x*.41)*.55;
      gradient+=vec2(-.32,.948)*cos(q)*.033*detail;
      float distanceToEye=length(eye-world);
      float nearDetail=1.-smoothstep(32.,110.,distanceToEye);
      float capillaryDetail=1.-smoothstep(14.,50.,distanceToEye);
      // Short, crossing wind ripples keep the foreground from looking like glass.
      float phaseWarp=noise(p*.43+vec2(t*.035,-t*.022))*2.7;
      q=dot(p,vec2(.98,-.20))*5.17+t*2.15+phaseWarp;
      gradient+=vec2(.98,-.20)*cos(q)*.074*detail*nearDetail;
      q=dot(p,vec2(.37,.929))*9.71-t*2.63+phaseWarp*.7;
      gradient+=vec2(.37,.929)*cos(q)*.042*detail*nearDetail;
      q=dot(p,vec2(-.81,.586))*16.33+t*3.1+sin(p.y*.81+t*.3)*.7;
      gradient+=vec2(-.81,.586)*cos(q)*.022*detail*capillaryDetail;
      gradient*=mix(1.,.32,smoothstep(70.,850.,distanceToEye));
      vec3 N=normalize(vec3(-gradient.x,1.,-gradient.y));
      vec3 V=normalize(eye-world),L=normalize(sunDirection),H=normalize(V+L);
      float nv=max(.015,dot(N,V)),nl=max(0.,dot(N,L)),nh=max(0.,dot(N,H));
      float fresnel=.025+.975*pow(1.-nv,5.);

      vec2 uv=(p-bounds.xy)/bounds.zw;
      bool inside=all(greaterThanEqual(uv,vec2(0)))&&all(lessThanEqual(uv,vec2(1)));
      float signedD=inside?(texture2D(shore,uv).r-.5)*71.68:-60.;
      float coast=max(0.,-signedD);
      vec3 deep=vec3(.009,.038,.043),shallow=vec3(.034,.089,.079);
      vec3 col=mix(shallow,deep,smoothstep(.5,10.,coast));
      col*=.86+.14*noise(p*.13+time*.008);
      float caustic=pow(max(0.,sin(p.x*2.8+sin(p.y*2.4+t*.6))*sin(p.y*3.1-t*.7)),7.);
      col+=vec3(.055,.075,.045)*caustic*(1.-smoothstep(.6,4.5,coast));

      vec3 skyFallback=mix(fogColor,vec3(.115,.17,.20),clamp(reflect(-V,N).y,0.,1.));
      vec3 reflectedColor=skyFallback;
      vec2 refUV=reflected.xy/max(reflected.w,.001);
      refUV+=vec2(gradient.x,-gradient.y)*(.065+.035*fresnel);
      if(reflected.w>0.&&all(greaterThan(refUV,vec2(.003)))&&all(lessThan(refUV,vec2(.997)))){
        vec2 blur=vec2(.00065,.00025)*(1.+wind);
        reflectedColor=texture2D(reflection,refUV).rgb*.5;
        reflectedColor+=texture2D(reflection,refUV+vec2(blur.x,0.)).rgb*.125;
        reflectedColor+=texture2D(reflection,refUV-vec2(blur.x,0.)).rgb*.125;
        reflectedColor+=texture2D(reflection,refUV+vec2(0.,blur.y)).rgb*.125;
        reflectedColor+=texture2D(reflection,refUV-vec2(0.,blur.y)).rgb*.125;
        float border=min(min(refUV.x,1.-refUV.x),min(refUV.y,1.-refUV.y));
        reflectedColor=mix(skyFallback,reflectedColor,smoothstep(.003,.026,border));
      }
      // Preserve clear reflections at grazing angles while retaining depth nearby.
      reflectedColor*=mix(vec3(.76,.88,.865),vec3(1.),fresnel);
      col=mix(col,reflectedColor,clamp(.075+fresnel*.89,0.,.97));

      // A broad microfacet highlight forms the broken path of low sunlight.
      float roughness=.135+wind*.065+rain*.07;
      float alpha2=pow(roughness,4.);
      float denominator=nh*nh*(alpha2-1.)+1.;
      float D=alpha2/(PI*denominator*denominator);
      float k=roughness*roughness*.5;
      float G=(nv/(nv*(1.-k)+k))*(nl/(nl*(1.-k)+k));
      float F=.025+.975*pow(1.-max(dot(H,V),0.),5.);
      float specular=min(5.,D*G*F/max(.05,4.*nv));
      col+=sunColor*specular*1.25*(1.-rain*.85);

      float breaker=smoothstep(.72,.98,sin(coast*3.8-t*.85+noise(p*.7)*2.));
      float foam=breaker*(1.-smoothstep(.12,1.1,coast))*smoothstep(-.25,.12,-signedD);
      foam*=smoothstep(.3,.75,noise(p*3.1+vec2(t*.03,0.)));
      col=mix(col,vec3(.39,.43,.38),foam*.36);
      float rainRing=pow(max(0.,sin(length(fract(p*1.3)-.5)*30.-time*11.)),18.);
      col+=rainRing*.022*rain*(1.-smoothstep(20.,85.,distanceToEye));
      col*=mix(vec3(1.),vec3(1.055,.96,.85),sunset*.25);
      float fog=1.-exp(-pow(distanceToEye*fogDensity,2.));
      col=mix(col,fogColor,min(.98,fog));
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  // Dense near the island, sparse toward the horizon: one renderable surface.
  const geometry=new THREE.PlaneGeometry(2,2,224,224);
  const positions=geometry.attributes.position;
  const expand=v=>Math.sign(v)*(80*Math.abs(v)+2420*Math.pow(Math.abs(v),3));
  for(let i=0;i<positions.count;i++)positions.setXYZ(i,expand(positions.getX(i)),expand(positions.getY(i)),0);
  positions.needsUpdate=true;geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.position.y=-.08;
  mesh.name='Deep Aegean water · waves and planar reflections';mesh.frustumCulled=false;
  function waveHeight(x,z,time=uniforms.time.value){
    let height=-.08;const strength=.55+uniforms.wind.value*.8;
    for(const w of waves)height+=Math.sin((x*w.x+z*w.z)*w.k-time*w.speed+w.phase)*w.amplitude*strength;
    return height;
  }
  return {mesh,uniforms,waveHeight};
}
