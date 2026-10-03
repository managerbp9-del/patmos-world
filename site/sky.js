import * as THREE from 'three';

// Atmospheric backdrop; layers of haze and wisps replace opaque cloud sculptures.
export function createSky(){
  const uniforms={sun:{value:new THREE.Vector3(.4,.16,-.85).normalize()},cloud:{value:.26},time:{value:0}};
  const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,depthTest:false,uniforms,
    vertexShader:`
      varying vec3 direction;
      void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}
    `,
    fragmentShader:`
      precision highp float;
      varying vec3 direction;uniform vec3 sun;uniform float cloud,time;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      float fbm(vec2 p){float n=0.;float a=.55;for(int i=0;i<5;i++){n+=noise(p)*a;p=mat2(.80,-.60,.60,.80)*p*2.05+7.1;a*=.47;}return n;}
      void main(){
        vec3 d=normalize(direction),s=normalize(sun);float h=max(d.y,0.);
        float day=smoothstep(-.09,.10,s.y),lowSun=1.-smoothstep(.16,.48,s.y);
        float facing=max(0.,dot(d,s));
        vec3 horizon=mix(vec3(.35,.415,.45),vec3(.49,.435,.335),lowSun*.62);
        vec3 zenith=mix(vec3(.075,.145,.205),vec3(.135,.19,.225),lowSun*.6);
        vec3 sky=mix(horizon,zenith,pow(h,.39));
        sky+=vec3(.35,.245,.115)*lowSun*pow(facing,12.)*.58;
        sky=mix(sky,vec3(.245,.29,.31),cloud*.37);
        vec2 p=d.xz/max(.15,d.y+.14)*2.6+vec2(time*.0017,time*.0004);
        float low=fbm(p*vec2(.65,1.8)),wisps=fbm(p*vec2(.9,3.5)+vec2(17.,4.));
        float amount=smoothstep(.53-cloud*.22,.78-cloud*.18,low*.72+wisps*.28);
        amount*=smoothstep(.012,.16,h)*(.25+cloud*.65);
        vec3 cloudColor=mix(vec3(.26,.30,.32),vec3(.57,.53,.43),pow(facing,5.)*.6+low*.22);
        cloudColor+=vec3(.19,.135,.06)*pow(facing,24.)*(1.-amount);
        sky=mix(sky,cloudColor,amount);
        float visibility=(1.-amount*.87)*(1.-cloud*.48);
        sky+=vec3(1.0,.71,.37)*pow(facing,300.)*.24*visibility;
        sky+=vec3(2.5,1.9,1.15)*smoothstep(.99991,.99997,facing)*visibility;
        sky=mix(sky,horizon,1.-smoothstep(-.08,.005,d.y));
        sky*=mix(.075,1.,day);
        gl_FragColor=vec4(sky,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `});
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(1200,32,16),material);
  mesh.name='Aegean atmospheric sky';mesh.renderOrder=-100;mesh.frustumCulled=false;
  return {mesh,uniforms,update(time,sunDirection,cloud=.26){
    uniforms.time.value=time;uniforms.sun.value.copy(sunDirection).normalize();uniforms.cloud.value=cloud;
  }};
}
