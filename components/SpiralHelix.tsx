import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';
import { useHandControl } from '../context/HandControlContext';

const vertexShader = `
  attribute float size;
  varying float vAlpha;
  
  void main() {
    vAlpha = 1.0;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (800.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 color;
  uniform float opacity;
  varying float vAlpha;
  
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    
    float strength = 1.0 - (dist * 2.0);
    strength = pow(strength, 3.0); 
    
    if (dist < 0.15) strength += 0.5;
    
    gl_FragColor = vec4(color, strength * opacity);
  }
`;

const SpiralHelix: React.FC = () => {
  const meshRef = useRef<THREE.Points>(null);
  const { isUnleashed } = useHandControl();

  const { positions, homePositions, targetPositions, sizes } = useMemo(() => {
    const count = 4000;
    const height = CONFIG.dimensions.treeHeight;
    const halfHeight = height / 2;
    const baseRadius = CONFIG.dimensions.treeRadius;
    
    const positions = new Float32Array(count * 3);
    const homePositions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        // Linear distribution along Y
        const t = i / count; 
        let y = (t - 0.5) * height;
        const normalizedY = (y + halfHeight) / height; 
        
        // Tight Hug Radius Formula
        const radius = (1.0 - normalizedY) * baseRadius * 0.9 + 0.2; 
        const angle = normalizedY * 12.0 * Math.PI * 2.0;

        // Calculate Helix Position (Home)
        let x = Math.cos(angle) * radius;
        let z = Math.sin(angle) * radius;

        // "Thick Band" effect
        const spread = 0.15; 
        x += (Math.random() - 0.5) * spread;
        z += (Math.random() - 0.5) * spread;
        y += (Math.random() - 0.5) * 0.1;

        // Save Home
        homePositions[i * 3] = x;
        homePositions[i * 3 + 1] = y;
        homePositions[i * 3 + 2] = z;

        // Initialize Position
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Calculate Target Position (Explosion)
        // Expand outwards significantly (3x + random)
        const expansionFactor = 3.0 + Math.random() * 4.0;
        
        targetPositions[i * 3] = x * expansionFactor;
        targetPositions[i * 3 + 1] = y * 0.8; // Flatten slightly vertically
        targetPositions[i * 3 + 2] = z * expansionFactor;

        sizes[i] = 0.08 + Math.random() * 0.05; 
    }

    return { positions, homePositions, targetPositions, sizes };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // CPU Animation Loop
    const currentPositions = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    // Choose Lerp Speed based on state
    // Unleashed = Fast explosion (0.1)
    // Leashed = Slower return (0.05)
    const factor = isUnleashed ? 0.1 : 0.05;

    for (let i = 0; i < 4000; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;

        const tx = isUnleashed ? targetPositions[ix] : homePositions[ix];
        const ty = isUnleashed ? targetPositions[iy] : homePositions[iy];
        const tz = isUnleashed ? targetPositions[iz] : homePositions[iz];

        currentPositions[ix] += (tx - currentPositions[ix]) * factor;
        currentPositions[iy] += (ty - currentPositions[iy]) * factor;
        currentPositions[iz] += (tz - currentPositions[iz]) * factor;
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;

    // Rotate slowly around Y (independent of explosion)
    // Slower rotation when exploded to emphasize static suspension
    const rotSpeed = isUnleashed ? 0.05 : 0.2;
    meshRef.current.rotation.y -= delta * rotSpeed;

    // Shimmer / Pulse Effect
    const time = state.clock.elapsedTime;
    const scale = 1.0 + Math.sin(time * 3.0) * 0.02;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <points ref={meshRef}>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
            <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial 
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={{
                color: { value: new THREE.Color('#E0FFFF') }, 
                opacity: { value: 0.9 }
            }}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
        />
    </points>
  );
};

export default SpiralHelix;