import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';
import { useHandControl } from '../context/HandControlContext';

const vertexShader = `
  attribute vec3 targetPosition;
  attribute float size;
  uniform float uProgress;
  uniform float uTime;
  varying float vAlpha;
  
  void main() {
    vAlpha = 1.0;
    // GPU vertex morph between home and explosion
    vec3 currentPos = mix(position, targetPosition, uProgress);
    
    // Shimmer scale pulse
    float pulse = 1.0 + sin(uTime * 3.0) * 0.02;
    
    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_PointSize = clamp(size * pulse * (800.0 / -mvPosition.z), 1.0, 28.0);
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
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const progressRef = useRef(0);
  const { isUnleashed } = useHandControl();

  const { homePositions, targetPositions, sizes } = useMemo(() => {
    const count = 4000;
    const height = CONFIG.dimensions.treeHeight;
    const halfHeight = height / 2;
    const baseRadius = CONFIG.dimensions.treeRadius;
    
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

        // "Thick Band" spread effect
        const spread = 0.15; 
        x += (Math.random() - 0.5) * spread;
        z += (Math.random() - 0.5) * spread;
        y += (Math.random() - 0.5) * 0.1;

        // Save Home
        homePositions[i * 3] = x;
        homePositions[i * 3 + 1] = y;
        homePositions[i * 3 + 2] = z;

        // Calculate Target Position (Explosion outwards 3x-7x)
        const expansionFactor = 3.0 + Math.random() * 4.0;
        targetPositions[i * 3] = x * expansionFactor;
        targetPositions[i * 3 + 1] = y * 0.8;
        targetPositions[i * 3 + 2] = z * expansionFactor;

        sizes[i] = 0.08 + Math.random() * 0.05; 
    }

    return { homePositions, targetPositions, sizes };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // Smoothly lerp explosion factor on the GPU
    const targetProgress = isUnleashed ? 1.0 : 0.0;
    const factor = isUnleashed ? 0.1 : 0.05;
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, targetProgress, factor);

    materialRef.current.uniforms.uProgress.value = progressRef.current;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // Rotate around Y
    const rotSpeed = isUnleashed ? 0.05 : 0.2;
    meshRef.current.rotation.y -= delta * rotSpeed;
  });

  return (
    <points ref={meshRef}>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={homePositions.length / 3} array={homePositions} itemSize={3} />
            <bufferAttribute attach="attributes-targetPosition" count={targetPositions.length / 3} array={targetPositions} itemSize={3} />
            <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial 
            ref={materialRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={{
                uProgress: { value: 0 },
                uTime: { value: 0 },
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