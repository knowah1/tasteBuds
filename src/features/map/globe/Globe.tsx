import { useEffect, useMemo } from 'react';
import { Outlines } from '@react-three/drei';
import { BackSide, Color, NormalBlending, ShaderMaterial } from 'three';
import { GLOBE_RADIUS } from './sphere';
import { createGlobeTexture, createToonRamp } from './textures';
import { GLOBE_COLORS } from './theme';

const INK = GLOBE_COLORS.ink;

/** Ocean + continents: one toon-shaded sphere wearing the painted texture, inked outline. */
function Earth() {
  const map = useMemo(() => createGlobeTexture(), []);
  const ramp = useMemo(() => createToonRamp(), []);
  useEffect(
    () => () => {
      map.dispose();
      ramp.dispose();
    },
    [map, ramp],
  );

  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 96, 64]} />
      <meshToonMaterial map={map} gradientMap={ramp} />
      <Outlines thickness={0.022} color={INK} />
    </mesh>
  );
}

const GLOW_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const GLOW_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    // Back faces of a slightly bigger sphere: brightest right at the globe's rim, fading out.
    float d = -dot(normalize(vNormal), normalize(vView));
    float glow = smoothstep(0.0, 0.5, d);
    gl_FragColor = vec4(uColor, pow(glow, 1.6) * uStrength);
  }
`;

/** Soft pale-cyan atmosphere rim (fresnel on a back-face shell). */
function Atmosphere() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: GLOW_VERT,
        fragmentShader: GLOW_FRAG,
        uniforms: {
          uColor: { value: new Color(GLOBE_COLORS.glow) },
          uStrength: { value: 0.85 },
        },
        side: BackSide,
        transparent: true,
        depthWrite: false,
        blending: NormalBlending,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[GLOBE_RADIUS * 1.16, 64, 48]} />
    </mesh>
  );
}

/** The whole visual: toon Earth + atmosphere rim. Deliberately nothing else. */
export function Globe() {
  return (
    <>
      <Atmosphere />
      <Earth />
    </>
  );
}
