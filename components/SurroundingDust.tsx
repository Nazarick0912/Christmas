import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';

const vertexShader = `
  uniform float uTime;
  attribute float aSize;
  attribute float aRandom;
  varying float vAlpha;

  void main() {
    // Subtle twinkle based on time and random offset
    float twinkle = 0.5 + 0.5 * sin(uTime * 2.0 + aRandom * 10.0);
    vAlpha = twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (500.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Soft glow
    float strength = 1.0 - (dist * 2.0);
    strength = pow(strength, 2.0);

    gl_FragColor = vec4(uColor, strength * vAlpha * 0.6); 
  }
`;

const SurroundingDust: React.FC = () => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { count, height, radiusBase } = useMemo(() => ({
    count: 2000,
    height: CONFIG.dimensions.treeHeight + 4, // Taller than tree
    radiusBase: CONFIG.dimensions.treeRadius * 1.8 // Wider than tree
  }), []);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randoms = new Float32Array(count);
    const speeds = new Float32Array(count);
    const angles = new Float32Array(count); 

    for (let i = 0; i < count; i++) {
        const y = (Math.random() - 0.5) * height;
        
        // Random angle
        const angle = Math.random() * Math.PI * 2;
        
        // Calculate initial positions (will be overwritten in useFrame but good for init)
        const normalizedY = (y + height/2) / height;
        const r = radiusBase * (1.0 - normalizedY * 0.5); 

        const x = r * Math.cos(angle);
        const z = r * Math.sin(angle);

        positions[i*3] = x;
        positions[i*3+1] = y;
        positions[i*3+2] = z;

        sizes[i] = 0.05 + Math.random() * 0.15;
        randoms[i] = Math.random();
        speeds[i] = 0.5 + Math.random() * 1.0; 
        angles[i] = angle;
    }
    
    return { positions, sizes, randoms, speeds, angles };
  }, [count, height, radiusBase]);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;

    // 1. Group Rotation (Opposite to tree)
    meshRef.current.rotation.y -= 0.001; 

    // 2. Update Shader Time
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // 3. Floating Effect
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const halfHeight = height / 2;

    for(let i = 0; i < count; i++) {
        let y = positions[i*3+1];
        
        // Move up
        y += particles.speeds[i] * 0.02; 

        // Reset if top reached
        if (y > halfHeight) {
            y = -halfHeight;
        }

        positions[i*3+1] = y;

        // Re-calculate X/Z to maintain Cone Shape
        const normalizedY = (y + halfHeight) / height;
        // Taper factor: 0.5 means top is 50% width of bottom
        const r = radiusBase * (1.0 - normalizedY * 0.5); 
        
        // Add twist logic: higher particles rotate more in the static spiral
        const currentAngle = particles.angles[i] + y * 0.2; 

        positions[i*3] = r * Math.cos(currentAngle);
        positions[i*3+2] = r * Math.sin(currentAngle);
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.positions.length / 3} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={particles.sizes.length} array={particles.sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aRandom" count={particles.randoms.length} array={particles.randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial 
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
            uTime: { value: 0 },
            uColor: { value: new THREE.Color('#FFD700') }
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default SurroundingDust;