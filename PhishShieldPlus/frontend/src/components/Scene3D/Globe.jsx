import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import { useThreatStore } from '../../store/threatStore';
import * as THREE from 'three';

// Convert lat/lng to 3D sphere position
function latLngToVec3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Generate a curved arc between two points on the globe
function generateArc(start, end, segments = 40) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = new THREE.Vector3().lerpVectors(start, end, t);
    const elevation = 1 + 0.4 * Math.sin(Math.PI * t);
    point.normalize().multiplyScalar(start.length() * elevation);
    points.push([point.x, point.y, point.z]);
  }
  return points;
}

// Predefined attack source locations for visual effect
const ATTACK_NODES = [
  { lat: 55.75, lng: 37.62, label: "Moscow" },     // Russia
  { lat: 39.90, lng: 116.40, label: "Beijing" },    // China
  { lat: 6.52, lng: 3.38, label: "Lagos" },         // Nigeria
  { lat: -23.55, lng: -46.63, label: "São Paulo" }, // Brazil
  { lat: 41.01, lng: 28.98, label: "Istanbul" },    // Turkey
  { lat: 37.77, lng: -122.42, label: "San Francisco" }, // US
  { lat: 28.61, lng: 77.21, label: "New Delhi" },   // India
];

const TARGET_NODE = { lat: 40.71, lng: -74.01, label: "NYC" };

function AttackDot({ position, color = "#e24b4a", size = 0.06 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.3;
      ref.current.scale.set(s, s, s);
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

export default function Globe() {
  const globeRef = useRef();
  const liveThreats = useThreatStore((state) => state.liveThreats);

  useFrame((state, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.08;
    }
  });

  const targetPos = latLngToVec3(TARGET_NODE.lat, TARGET_NODE.lng, 2.05);

  const attackData = useMemo(() => {
    return ATTACK_NODES.map((node) => {
      const pos = latLngToVec3(node.lat, node.lng, 2.05);
      const arc = generateArc(pos, targetPos);
      return { pos, arc, label: node.label };
    });
  }, []);

  return (
    <group ref={globeRef}>
      {/* Core globe */}
      <Sphere args={[2, 48, 48]}>
        <meshStandardMaterial 
          color="#0a1628" 
          emissive="#050d18"
          roughness={0.8}
          metalness={0.9}
        />
      </Sphere>

      {/* Wireframe overlay */}
      <Sphere args={[2.01, 48, 48]}>
        <meshBasicMaterial 
          color="#1a3a6a" 
          wireframe 
          transparent
          opacity={0.25}
        />
      </Sphere>

      {/* Ring / equator glow */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.3, 2.35, 64]} />
        <meshBasicMaterial color="#1a3a6a" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Target dot (NYC) */}
      <AttackDot position={[targetPos.x, targetPos.y, targetPos.z]} color="#3af0e0" size={0.08} />

      {/* Attack source dots + arcs */}
      {attackData.map((node, idx) => (
        <group key={idx}>
          <AttackDot position={[node.pos.x, node.pos.y, node.pos.z]} color="#e24b4a" />
          <Line
            points={node.arc}
            color="#e24b4a"
            lineWidth={1.5}
            transparent
            opacity={0.6}
          />
        </group>
      ))}
    </group>
  );
}
