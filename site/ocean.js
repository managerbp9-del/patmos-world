/**
 * Procedural surface water, in metres. No seabed or scene-raytracing claim.
 * The coast distance is a visual mask, not bathymetry. Land is never displaced.
 * update: seconds, world-space vectors, cloud/wind normalized to [0, 1].
 */
export function createOcean(THREE, { shoreTexture, shoreBounds } = {}) {
  let fallbackTexture;
  if (!shoreTexture) {
    fallbackTexture = new THREE.DataTexture(
      new Uint8Array([0, 0, 0, 255]), 1, 1, THREE.RGBAFormat,
      THREE.UnsignedByteType,
    );
    fallbackTexture.needsUpdate = true;
    shoreTexture = fallbackTexture;
  }
  // Interpolation avoids visible 8 m steps in the supplied 8-bit distance field.
  shoreTexture.minFilter = THREE.LinearFilter;
  shoreTexture.magFilter = THREE.LinearFilter;
  shoreTexture.generateMipmaps = false;
  shoreTexture.colorSpace = THREE.NoColorSpace;
  shoreTexture.needsUpdate = true;
  const bounds = shoreBounds || { minX: 0, minZ: 0, width: 1, height: 1 };
  const uniforms = {
    uShore: { value: shoreTexture },
    uBounds: { value: new THREE.Vector4(
      bounds.minX, bounds.minZ, Math.max(1, bounds.width), Math.max(1, bounds.height),
    ) },
    uTime: { value: 0 },
    uSun: { value: new THREE.Vector3(-0.35, 0.65, -0.4).normalize() },
    uEye: { value: new THREE.Vector3(0, 6, 0) },
    uCloud: { value: 0.18 },
    uWind: { value: 0.55 },
    uDeep: { value: new THREE.Color('#073348') },
    uCoastal: { value: new THREE.Color('#247f82') },
    uHorizon: { value: new THREE.Color('#b5d0db') },
    uZenith: { value: new THREE.Color('#497eac') },
  };
  const material = new THREE.ShaderMaterial({
    name: 'Patmos procedural water — analytic sky reflections',
    uniforms,
    toneMapped: true,
    depthWrite: true,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      #include <common>
      #include <logdepthbuf_pars_vertex>
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
        #include <logdepthbuf_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uShore;
      uniform vec4 uBounds;
      uniform float uTime, uCloud, uWind;
      uniform vec3 uSun, uEye, uDeep, uCoastal, uHorizon, uZenith;
      varying vec3 vWorld;
      #include <logdepthbuf_pars_fragment>
      const float TAU = 6.28318530718;
      const float WATER_F0 = 0.02037;

      float hash21(vec2 p) {
        vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
        q += dot(q, q.yzx + 33.33);
        return fract((q.x + q.y) * q.z);
      }
      float noise2(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
                   mix(hash21(i + vec2(0.0, 1.0)), hash21(i + 1.0), f.x), f.y);
      }
      float brokenNoise(vec2 p) {
        return noise2(p) * 0.57 + noise2(p * 2.07 + 17.3) * 0.29
             + noise2(p * 4.13 - 8.9) * 0.14;
      }
      void wave(inout vec2 slope, inout float crest, vec2 p, vec2 direction,
                float lengthM, float amplitude, float rate, float footprint) {
        vec2 d = normalize(direction);
        float k = TAU / lengthM;
        // Remove frequencies smaller than a screen pixel before they shimmer.
        float filterWeight = 1.0 - smoothstep(0.65, 2.8, k * footprint);
        float phase = dot(p, d) * k + uTime * rate * (0.6 + uWind * 0.8);
        float a = amplitude * filterWeight;
        slope += d * (cos(phase) * a * k);
        crest += sin(phase) * a;
      }
      vec3 skyReflection(vec3 ray, float daylight, float sunVisibility) {
        float elevation = clamp(ray.y, 0.0, 1.0);
        vec3 sky = mix(uHorizon, uZenith, pow(elevation, 0.46));
        vec2 cloudUV = ray.xz / max(0.24, ray.y + 0.30);
        float clouds = smoothstep(0.58 - uCloud * 0.35, 0.81,
          brokenNoise(cloudUV * 1.45 + vec2(uTime * 0.002, 0.0)));
        vec3 cloudSky = mix(vec3(0.38, 0.43, 0.47), vec3(0.73, 0.76, 0.76), elevation);
        sky = mix(sky, cloudSky, clouds * uCloud * 0.76);
        float glow = pow(max(dot(ray, uSun), 0.0), 18.0);
        sky += vec3(0.7, 0.58, 0.40) * glow * 0.28 * sunVisibility;
        return mix(vec3(0.009, 0.016, 0.029), sky, daylight);
      }
      void main() {
        #include <logdepthbuf_fragment>
        vec2 uv = (vWorld.xz - uBounds.xy) / uBounds.zw;
        float signedCoast = -2048.0;
        if (all(greaterThanEqual(uv, vec2(0.0))) && all(lessThanEqual(uv, vec2(1.0)))) {
          signedCoast = (texture2D(uShore, uv).r - 0.5) * 2048.0;
        }
        // The full-resolution terrain depth occludes water. The coarse distance
        // field is only a surf cue and must not cut holes in the actual coast.
        float coast = max(0.0, -signedCoast);
        vec2 p = vWorld.xz;
        float footprint = max(length(dFdx(p)), length(dFdy(p)));
        float slowVariation = noise2(p * 0.012 + vec2(uTime * 0.003, 0.0));
        vec2 warped = p + vec2(slowVariation, noise2(p * 0.009 + 8.0)) * 3.7;
        vec2 slope = vec2(0.0);
        float crest = 0.0;
        wave(slope, crest, warped, vec2(0.34, 0.94), 37.0, 0.42, 0.72, footprint);
        wave(slope, crest, warped, vec2(-0.24, 0.97), 21.7, 0.25, 0.91, footprint);
        wave(slope, crest, warped, vec2(0.79, 0.62), 11.3, 0.12, 1.28, footprint);
        wave(slope, crest, p, vec2(0.12, 0.99), 4.1, 0.046, 2.18, footprint);
        wave(slope, crest, p, vec2(-0.64, 0.76), 1.34, 0.017, 3.37, footprint);
        wave(slope, crest, p, vec2(0.82, 0.57), 0.43, 0.006, 5.15, footprint);
        wave(slope, crest, p, vec2(-0.36, 0.93), 0.17, 0.002, 7.03, footprint);
        slope *= mix(0.36, 1.32, uWind) * mix(0.48, 1.0, smoothstep(0.0, 45.0, coast));
        vec3 N = normalize(vec3(-slope.x, 1.0, -slope.y));
        vec3 V = normalize(uEye - vWorld);
        float NoV = clamp(dot(N, V), 0.03, 1.0);
        float fresnel = WATER_F0 + (1.0 - WATER_F0) * pow(1.0 - NoV, 5.0);
        float daylight = smoothstep(-0.15, 0.16, uSun.y);
        float sunVisibility = smoothstep(-0.015, 0.13, uSun.y) * (1.0 - uCloud * 0.90);
        vec3 R = reflect(-V, N);
        vec3 reflected = skyReflection(R, daylight, sunVisibility);

        // Coastal colour is an artistic distance cue, never measured water depth.
        float coastalTint = exp(-coast / 58.0) * 0.64;
        vec3 body = mix(uDeep, uCoastal, coastalTint);
        body *= mix(0.09, 0.90, daylight) * (1.0 - uCloud * 0.20);
        body += vec3(0.006, 0.026, 0.025) * max(crest, 0.0) * daylight;
        vec3 color = mix(body, reflected, fresnel);

        // Water Fresnel and a bounded GGX sun lobe; this is not scene ray tracing.
        vec3 H = normalize(V + uSun + vec3(0.0, 0.00001, 0.0));
        float NoL = max(dot(N, uSun), 0.0);
        float NoH = max(dot(N, H), 0.0);
        float VoH = clamp(dot(V, H), 0.0, 1.0);
        float roughness = mix(0.12, 0.25, uWind);
        // Pixel-scale variance broadens distant glints instead of aliasing them.
        roughness = min(0.42, roughness + smoothstep(1.0, 35.0, footprint) * 0.13);
        float alpha = roughness * roughness;
        float alpha2 = alpha * alpha;
        float denominator = NoH * NoH * (alpha2 - 1.0) + 1.0;
        float distribution = alpha2 / max(0.00001, 3.14159265 * denominator * denominator);
        float k = (roughness + 1.0) * (roughness + 1.0) * 0.125;
        float visibility = (NoV / (NoV * (1.0 - k) + k))
                         * (NoL / (NoL * (1.0 - k) + k));
        float F = WATER_F0 + (1.0 - WATER_F0) * pow(1.0 - VoH, 5.0);
        float sunSpecular = distribution * visibility * F / max(0.04, 4.0 * NoV);
        color += vec3(1.0, 0.88, 0.68) * min(sunSpecular, 6.0) * sunVisibility * 3.5;

        // Irregular breakers run towards the shore and dissolve into porous foam.
        float foamPatch = brokenNoise(p * 0.105 + vec2(uTime * 0.035, -uTime * 0.027));
        float shorePhase = coast * 0.40 + uTime * (0.64 + uWind * 0.42) + foamPatch * 2.7;
        float bandAA = max(0.035, fwidth(shorePhase) * 0.75);
        float breaker = smoothstep(0.73 - bandAA, 0.91 + bandAA, sin(shorePhase));
        float reach = mix(9.0, 24.0, uWind);
        float envelope = (1.0 - smoothstep(2.0, reach, coast));
        float lace = smoothstep(0.24, 0.69, foamPatch);
        float shoreWash = (breaker * 0.77 + exp(-coast / 2.9) * 0.24) * envelope * lace;
        float whitecap = smoothstep(0.47, 0.72, crest) * smoothstep(0.67, 0.98, uWind)
                       * smoothstep(0.61, 0.82, foamPatch) * smoothstep(20.0, 100.0, coast);
        float foam = clamp(shoreWash + whitecap * 0.45, 0.0, 0.80);
        vec3 foamColor = mix(vec3(0.035, 0.045, 0.055), vec3(0.73, 0.79, 0.76), daylight);
        foamColor *= 1.0 - uCloud * 0.14;
        color = mix(color, foamColor, foam);
        float distanceToEye = length(uEye.xz - p);
        float haze = 1.0 - exp(-distanceToEye * mix(0.000055, 0.000115, uCloud));
        vec3 horizon = skyReflection(vec3(0.0, 0.035, 1.0), daylight, 0.0);
        color = mix(color, horizon, clamp(haze, 0.0, 0.96));
        gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const geometry = new THREE.PlaneGeometry(100000, 100000, 128, 128);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'Aegean procedural ocean';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.15;
  // The 100 km water plane should not disappear during near-shore camera turns.
  mesh.frustumCulled = false;
  mesh.userData.isProceduralOcean = true;
  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  return {
    mesh,
    update({ time, sunDirection, cameraPosition, cloud, wind } = {}) {
      if (Number.isFinite(time)) uniforms.uTime.value = time;
      if (sunDirection && sunDirection.lengthSq() > 1e-8) {
        uniforms.uSun.value.copy(sunDirection).normalize();
      }
      if (cameraPosition) uniforms.uEye.value.copy(cameraPosition);
      if (Number.isFinite(cloud)) uniforms.uCloud.value = clamp01(cloud);
      if (Number.isFinite(wind)) uniforms.uWind.value = clamp01(wind);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      fallbackTexture?.dispose();
    },
  };
}
