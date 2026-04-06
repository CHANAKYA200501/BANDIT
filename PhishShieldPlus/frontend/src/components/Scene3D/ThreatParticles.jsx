import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useThreatStore } from '../../store/threatStore';
import * as THREE from 'three';

export default function ThreatParticles() {
  const pointsRef = useRef();
  const liveThreats = useThreatStore((state) => state.liveThreats);
  
  const particleCount = 2000;
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 10;
      pos[i+1] = (Math.random() - 0.5) * 10;
      pos[i+2] = (Math.random() - 0.5) * 10;
      
      col[i] = 0.2; // R
      col[i+1] = 0.6; // G
      col[i+2] = 0.8; // B
    }
    return [pos, col];
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    // Rotate naturally
    pointsRef.current.rotation.y -= delta * 0.05;
    
    // If threats exist, turn particles red and animate faster
    const isThreatActive = liveThreats.length > 0;
    const colorsObj = pointsRef.current.geometry.attributes.color;
    
    for (let i = 0; i < particleCount; i++) {
      if (isThreatActive) {
        colorsObj.setXYZ(i, 0.88, 0.29, 0.29); // #e24b4a (Red)
        pointsRef.current.rotation.y -= delta * 0.1;
      } else {
        colorsObj.setXYZ(i, 0.2, 0.6, 0.8); // Teal
      }
    }
    colorsObj.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}
