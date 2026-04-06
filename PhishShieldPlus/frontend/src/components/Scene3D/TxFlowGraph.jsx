import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useThreatStore } from '../../store/threatStore';
import * as THREE from 'three';

export default function TxFlowGraph() {
  const groupRef = useRef();
  const chainEvents = useThreatStore((state) => state.chainEvents);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[-3, 0, -2]}>
      {chainEvents.slice(0, 5).map((ev, idx) => {
        const offset = idx * 0.5;
        // Simple mock visualization of tx flows
        return (
          <group key={idx}>
            <mesh position={[0, offset, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshBasicMaterial color="#e24b4a" />
            </mesh>
            <mesh position={[2, offset + 1, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshBasicMaterial color="#f0ad4e" />
            </mesh>
            <Line
              points={[[0, offset, 0], [2, offset + 1, 0]]}
              color="#66fcf1"
              lineWidth={2}
              dashed
              dashScale={10}
            />
          </group>
        );
      })}
    </group>
  );
}
