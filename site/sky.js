import * as THREE from 'three';

// A shared sky for each chapter's fixed weather. Stars stay anchored to the world.
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
      float stars(vec3 d){
        // Angular coordinates avoid camera-dependent or animated star noise.
        vec2 p=vec2(atan(d.z,d.x),asin(clamp(d.y,-1.,1.)))*90.;
        vec2 cell=floor(p),uv=fract(p);
        vec2 point=vec2(hash(cell+vec2(3.1,9.7)),hash(cell+vec2(47.2,11.3)))*.7+.15;
        float seed=hash(cell+vec2(71.3,19.1));
        float radius=.024+pow(hash(cell+vec2(13.9,82.4)),4.)*.058;
        float aa=max(.016,length(fwidth(p))*.48);
        float disc=1.-smoothstep(radius,radius+aa,length(uv-point));
        // The energy compensation keeps tiny stars steady when the view widens.
        float energy=min(1.,radius/max(aa,.001));
        return disc*energy*step(.972,seed)*(.5+pow(seed,45.)*3.4);
      }
      void main(){
        vec3 d=normalize(direction),s=normalize(sun);float h=max(d.y,0.);
        float day=smoothstep(-.16,.09,s.y),lowSun=1.-smoothstep(.16,.48,s.y);
        float night=1.-smoothstep(-.21,-.055,s.y);
        float facing=max(0.,dot(d,s));
        vec3 horizon=mix(vec3(.35,.415,.45),vec3(.49,.435,.335),lowSun*.62);
        vec3 zenith=mix(vec3(.075,.145,.205),vec3(.135,.19,.225),lowSun*.6);
        vec3 sky=mix(horizon,zenith,pow(h,.39));
        sky+=vec3(.35,.245,.115)*lowSun*pow(facing,12.)*.58;
        sky=mix(sky,vec3(.245,.29,.31),cloud*.37);
        vec3 nightHorizon=vec3(.010,.019,.033);
        vec3 nightZenith=vec3(.0018,.0042,.013);
        vec3 nightSky=mix(nightHorizon,nightZenith,pow(h,.40));
        nightSky=mix(nightSky,vec3(.012,.018,.027),cloud*.28);
        sky=mix(nightSky,sky,day);
        horizon=mix(nightHorizon,horizon,day);
        vec2 p=d.xz/max(.15,d.y+.14)*2.6+vec2(time*.0017,time*.0004);
        float low=fbm(p*vec2(.65,1.8)),wisps=fbm(p*vec2(.9,3.5)+vec2(17.,4.));
        float amount=smoothstep(.53-cloud*.22,.78-cloud*.18,low*.72+wisps*.28);
        amount*=smoothstep(.012,.16,h)*(.25+cloud*.65);
        vec3 cloudColor=mix(vec3(.26,.30,.32),vec3(.57,.53,.43),pow(facing,5.)*.6+low*.22);
        cloudColor+=vec3(.19,.135,.06)*pow(facing,24.)*(1.-amount);
        cloudColor=mix(vec3(.011,.017,.029),cloudColor,day);
        sky=mix(sky,cloudColor,amount);
        float visibility=(1.-amount*.87)*(1.-cloud*.48);
        float sunVisibility=visibility*smoothstep(-.025,.015,s.y);
        sky+=vec3(1.0,.71,.37)*pow(facing,300.)*.24*sunVisibility;
        sky+=vec3(2.5,1.9,1.15)*smoothstep(.99991,.99997,facing)*sunVisibility;
        float starVisibility=night*smoothstep(.04,.24,h)*(1.-smoothstep(.10,.48,amount));
        starVisibility*=1.-cloud*.7;
        sky+=vec3(.76,.85,1.)*stars(d)*starVisibility;
        sky=mix(sky,horizon,1.-smoothstep(-.08,.005,d.y));
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
