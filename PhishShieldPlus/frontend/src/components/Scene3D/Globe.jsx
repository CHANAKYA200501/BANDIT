import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

export default function Globe() {
  const globeRef = useRef();

  useFrame((state, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={globeRef}>
      <Sphere args={[2, 32, 32]}>
        <meshStandardMaterial 
          color="#0f1b29" 
          emissive="#0a1128"
          roughness={0.7}
          metalness={0.8}
        />
      </Sphere>
      {/* Wireframe overlay for the cyberpunk aesthetic */}
      <Sphere args={[2.01, 32, 32]}>
        <meshBasicMaterial 
          color="#1e3a5f" 
          wireframe 
          transparent
          opacity={0.3}
        />
      </Sphere>
    </group>
  );
}
