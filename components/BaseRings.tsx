import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';

const BaseRings: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create 3 rings
  const ringConfigs = [
    { radius: CONFIG.dimensions.treeRadius * 1.2, count: 200, speed: 0.2, y: 0.2 },
    { radius: CONFIG.dimensions.treeRadius * 1.5, count: 300, speed: -0.15, y: 0.5 },
    { radius: CONFIG.dimensions.treeRadius * 1.8, count: 400, speed: 0.1, y: 0 },
  ];

  useFrame((state) => {
    if (groupRef.current) {
        // Individual ring rotations are handled by rotating sub-groups if implemented separately, 
        // but here we might just construct geometry.
        // Let's manually rotate the vertices or rotate separate Point meshes.
        // For simplicity and performance, we'll create one geometry but animate inside shader or 
        // just make 3 separate Points objects wrapped in this component.
    }
  });

  return (
    <group ref={groupRef}>
      {ringConfigs.map((ring, index) => (
        <SingleRing key={index} config={ring} />
      ))}
    </group>
  );
};

const SingleRing: React.FC<{ config: { radius: number; count: number; speed: number, y: number } }> = ({ config }) => {
  const ref = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(config.count * 3);
    for(let i=0; i<config.count; i++) {
      const angle = (i / config.count) * Math.PI * 2;
      // Add slight noise to radius so it's not a perfect razor thin line
      const r = config.radius + (Math.random() - 0.5) * 0.5;
      
      positions[i*3] = Math.cos(angle) * r;
      positions[i*3+1] = config.y + (Math.random() - 0.5) * 0.2; // slight vertical spread
      positions[i*3+2] = Math.sin(angle) * r;
    }
    return positions;
  }, [config]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * config.speed;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute 
            attach="attributes-position"
            count={particles.length / 3}
            array={particles}
            itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        color={CONFIG.colors.ring}
        size={0.15}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export default BaseRings;