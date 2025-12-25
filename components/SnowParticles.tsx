import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';

const SnowParticles: React.FC = () => {
  const meshRef = useRef<THREE.Points>(null);
  const count = CONFIG.counts.snowParticles;

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count); // fall speed
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50; // x spread
      positions[i * 3 + 1] = Math.random() * 40 - 10; // y spread
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50; // z spread
      
      speeds[i] = Math.random() * 0.05 + 0.02;
    }
    return { positions, speeds };
  }, [count]);

  useFrame(() => {
    if (!meshRef.current) return;
    
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      // Move down
      positions[i * 3 + 1] -= particles.speeds[i];

      // Reset if below threshold
      if (positions[i * 3 + 1] < -10) {
        positions[i * 3 + 1] = 30; // Move back to top
        // Randomize X and Z slightly on reset to prevent patterns
        positions[i * 3] = (Math.random() - 0.5) * 50;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
      }
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={CONFIG.colors.snow}
        transparent
        opacity={0.6}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default SnowParticles;