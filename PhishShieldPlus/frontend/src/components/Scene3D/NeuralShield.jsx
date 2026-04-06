import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Icosahedron } from '@react-three/drei';
import { useThreatStore } from '../../store/threatStore';
import * as THREE from 'three';

export default function NeuralShield() {
  const shieldRef = useRef();
  const liveThreats = useThreatStore((state) => state.liveThreats);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (liveThreats.length > 0) {
      setPulse(1);
    }
  }, [liveThreats]);

  useFrame((state, delta) => {
    if (shieldRef.current) {
      shieldRef.current.rotation.x += delta * 0.2;
      shieldRef.current.rotation.y += delta * 0.3;

      if (pulse > 0) {
        setPulse(p => Math.max(0, p - delta * 2));
        const scale = 1.2 + Math.sin(pulse * Math.PI) * 0.3;
        shieldRef.current.scale.set(scale, scale, scale);
      } else {
        shieldRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
      }
    }
  });

  const shieldColor = pulse > 0 ? "#e24b4a" : "#378ADD";

  return (
    <group ref={shieldRef}>
      <Icosahedron args={[1, 2]}>
        <meshBasicMaterial color={shieldColor} wireframe />
      </Icosahedron>
    </group>
  );
}
