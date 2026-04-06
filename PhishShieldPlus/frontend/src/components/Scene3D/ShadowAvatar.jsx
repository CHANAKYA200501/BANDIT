import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useThreatStore } from '../../store/threatStore';
import * as THREE from 'three';

export default function ShadowAvatar() {
  const meshRef = useRef();
  const breachInfo = useThreatStore((state) => state.breachInfo);
  
  // Custom shader material for distortion on breach
  const uniforms = useRef({
    time: { value: 0 },
    distortAmount: { value: 0.0 }
  });

  useFrame((state) => {
    uniforms.current.time.value = state.clock.elapsedTime;
    
    // React to breach alert
    if (breachInfo) {
      uniforms.current.distortAmount.value = THREE.MathUtils.lerp(
        uniforms.current.distortAmount.value, 
        Math.min(breachInfo.breach_count / 10, 1.0), 
        0.05
      );
    } else {
      uniforms.current.distortAmount.value = THREE.MathUtils.lerp(uniforms.current.distortAmount.value, 0.0, 0.05);
    }
  });

  return (
    <mesh ref={meshRef} position={[3, 0, -2]}>
      <cylinderGeometry args={[0.5, 0.5, 2, 32, 32]} />
      <shaderMaterial
        wireframe
        uniforms={uniforms.current}
        vertexShader={`
          uniform float time;
          uniform float distortAmount;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 pos = position;
            pos.x += sin(pos.y * 10.0 + time) * distortAmount * 0.2;
            pos.z += cos(pos.y * 10.0 + time) * distortAmount * 0.2;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          uniform float distortAmount;
          varying vec2 vUv;
          void main() {
            vec3 color = mix(vec3(0.2, 0.6, 0.8), vec3(0.88, 0.29, 0.29), distortAmount);
            gl_FragColor = vec4(color, 1.0 - distortAmount * 0.5);
          }
        `}
        transparent
      />
    </mesh>
  );
}
