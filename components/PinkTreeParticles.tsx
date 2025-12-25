import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';
import { useHandControl } from '../context/HandControlContext';
import { useWishControl } from '../context/WishControlContext';

const vertexShader = `
  uniform float uTime;
  uniform float uBurst;
  
  attribute float size;
  attribute float randomOffset;
  attribute vec3 targetPosition;
  
  varying float vTwinkle;
  varying float vDepth;
  varying float vY;

  void main() {
    // Explosion expansion based on burst
    vec3 currentPos = mix(position, targetPosition, uBurst * 0.15); 
    
    vY = currentPos.y;

    float speed = 2.0 + randomOffset * 3.0;
    // Speed up twinkle during burst
    float pulse = sin(uTime * (speed + uBurst * 20.0) + randomOffset * 10.0);
    
    vTwinkle = 0.4 + 0.6 * pulse;
    
    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    vDepth = -mvPosition.z;

    gl_PointSize = size * (800.0 / vDepth); 
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uColorCore;
  uniform vec3 uColorHalo;
  uniform float uBurst;

  varying float vTwinkle;
  varying float vY;

  void main() {
    vec2 coord = gl_PointCoord.xy - vec2(0.5);
    float dist = abs(coord.x) + abs(coord.y); 
    
    if (dist > 0.5) discard;
    
    float strength = 1.0 - (dist * 2.0); 
    strength = pow(strength, 1.5); 
    
    vec3 finalColor = mix(uColorHalo, uColorCore, strength * 0.6);
    
    // --- FLASH LOGIC ---
    // Simulating bloom spike from 1.5 to 5.0
    // We achieve this by multiplying the color output significantly
    
    if (uBurst > 0.01) {
       // Flash Color: Deep Crimson + Gold
       vec3 burstColor = vec3(2.0, 0.1, 0.2); 
       
       finalColor = mix(finalColor, burstColor, min(uBurst, 0.8));
       
       // Massive HDR boost to trigger bloom spike
       finalColor *= (1.0 + uBurst * 5.0);
    }
    
    finalColor *= vTwinkle;
    if (dist < 0.1) finalColor += 0.5;

    gl_FragColor = vec4(finalColor, 0.9); 
  }
`;

const PinkTreeParticles: React.FC = () => {
  const meshRef = useRef<THREE.Points>(null);
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const { isUnleashed } = useHandControl();
  const { treeDataRef } = useWishControl();

  const { count, radius, height } = useMemo(() => ({
    count: CONFIG.counts.treeParticles,
    radius: CONFIG.dimensions.treeRadius,
    height: CONFIG.dimensions.treeHeight,
  }), []);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randomOffsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const y = Math.random() * height;
      const normalizedY = y / height;
      const maxR = radius * (1.0 - normalizedY);
      
      const r = maxR * Math.sqrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const tx = (Math.random() - 0.5) * height * 5.0;
      const ty = (Math.random() - 0.5) * height * 5.0;
      const tz = (Math.random() - 0.5) * height * 5.0;

      targetPositions[i * 3] = tx;
      targetPositions[i * 3 + 1] = ty;
      targetPositions[i * 3 + 2] = tz;

      sizes[i] = 0.05 + Math.random() * 0.08; 
      randomOffsets[i] = Math.random();
    }

    return { positions, targetPositions, sizes, randomOffsets };
  }, [count, height, radius]);

  useFrame((state) => {
    if (!shaderMaterialRef.current) return;
    
    // Decay Burst - 1 second duration approx (0.02 decay @ 60fps ~ 50 frames)
    treeDataRef.current.burst = THREE.MathUtils.lerp(treeDataRef.current.burst, 0, 0.04);

    let totalEffect = treeDataRef.current.burst;
    if (isUnleashed) {
        totalEffect = Math.max(totalEffect, 0.5); 
    }

    shaderMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    shaderMaterialRef.current.uniforms.uBurst.value = totalEffect;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.positions.length / 3} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-targetPosition" count={particles.targetPositions.length / 3} array={particles.targetPositions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={particles.sizes.length} array={particles.sizes} itemSize={1} />
        <bufferAttribute attach="attributes-randomOffset" count={particles.randomOffsets.length} array={particles.randomOffsets} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderMaterialRef}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent={true}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uBurst: { value: 0 },
          uColorCore: { value: new THREE.Color(CONFIG.colors.treeCore) },
          uColorHalo: { value: new THREE.Color(CONFIG.colors.treeOuter) },
        }}
      />
    </points>
  );
};

export default PinkTreeParticles;