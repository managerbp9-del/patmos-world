import * as THREE from 'three';
// Analytic sky for changing light; cloud shapes are illustrative weather.
export function createSky(){
  const uniforms={sun:{value:new THREE.Vector3(0,1,0)},cloud:{value:0},time:{value:0}};
  const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms,
    vertexShader:`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}`,
    fragmentShader:`varying vec3 direction;uniform vec3 sun;uniform float cloud,time;
    float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+1.),f.x),f.y);}
    float fbm(vec2 p){return noise(p)*.56+noise(p*2.03)*.27+noise(p*4.09)*.12+noise(p*8.1)*.05;}
    void main(){vec3 d=normalize(direction);float h=max(d.y,0.);float day=smoothstep(-.06,.28,sun.y);float dusk=(1.-smoothstep(.04,.37,sun.y));
      vec3 horizon=mix(vec3(.35,.51,.59),vec3(.56,.36,.22),dusk*.65);
      vec3 zenith=vec3(.035,.145,.285);
      vec3 sky=mix(horizon,zenith,pow(h,.48));sky=mix(sky,vec3(.28,.34,.38),cloud*.65);
      vec2 p=d.xz/max(.10,d.y)*1.5+vec2(time*.0009,0.);float shape=fbm(p);
      float amount=smoothstep(.62-cloud*.3,.81-cloud*.22,shape)*smoothstep(.12,.32,h);
      vec3 cc=mix(vec3(.55,.61,.64),vec3(.95,.94,.87),smoothstep(.51,.8,shape));
      cc=mix(cc,vec3(.29,.34,.37),cloud*.55);sky=mix(sky,cc,amount*(.3+cloud*.65));
      float s=max(dot(d,sun),0.);sky+=vec3(1.,.75,.4)*pow(s,150.)*.35*(1.-cloud);sky+=vec3(5.,4.5,3.5)*smoothstep(.99982,.99994,s)*(1.-cloud);
      sky*=mix(.18,1.,day);gl_FragColor=vec4(sky,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(45000,32,16),material);mesh.renderOrder=-100;
  return {mesh,update(time,sun,cloud){uniforms.time.value=time;uniforms.sun.value.copy(sun);uniforms.cloud.value=cloud;}};
}
