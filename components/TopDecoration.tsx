import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';
import { useHandControl } from '../context/HandControlContext';

const vertexShader = `
  attribute vec3 targetPosition;
  attribute vec3 color;
  uniform float uProgress;
  uniform float uTime;
  varying vec3 vColor;

  void main() {
    vColor = color;
    vec3 currentPos = mix(position, targetPosition, uProgress);
    
    // Floating breathing pulse on the star
    float pulse = 1.0 + sin(uTime * 2.0) * 0.05;
    float scale = mix(pulse, 1.0, uProgress);
    currentPos *= scale;
    
    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_PointSize = 0.04 * (800.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    if (length(coord) > 0.5) discard;
    float strength = 1.0 - (length(coord) * 2.0);
    strength = pow(strength, 1.5);
    gl_FragColor = vec4(vColor, strength);
  }
`;

const TopDecoration: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const progressRef = useRef(0);
  const { isUnleashed } = useHandControl();
  
  const { homePositions, targetPositions, colors } = useMemo(() => {
    const count = 1500; 
    const homePositions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    // Bright Gold, High Intensity for Bloom
    const colorGold = new THREE.Color('#FFD700').multiplyScalar(8.0);
    
    const outerRadius = 0.7;
    const innerRadius = 0.28;
    
    // Define 10 vertices for the star polygon (5 outer, 5 inner)
    const vertices: THREE.Vector3[] = [];
    for (let i = 0; i < 10; i++) {
        const angle = Math.PI / 2 + i * (Math.PI / 5);
        const r = (i % 2 === 0) ? outerRadius : innerRadius;
        vertices.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0));
    }

    for (let i = 0; i < count; i++) {
        // Uniform Random point in star polygon
        const sector = Math.floor(Math.random() * 10);
        const v1 = vertices[sector];
        const v2 = vertices[(sector + 1) % 10];
        
        const r1 = Math.random();
        const r2 = Math.random();
        const sqrtR1 = Math.sqrt(r1);
        const coeff1 = sqrtR1 * (1 - r2);
        const coeff2 = sqrtR1 * r2;
        
        const x = coeff1 * v1.x + coeff2 * v2.x;
        const y = coeff1 * v1.y + coeff2 * v2.y;
        const z = (Math.random() - 0.5) * 0.15;

        // Store Home
        homePositions[i * 3] = x;
        homePositions[i * 3 + 1] = y;
        homePositions[i * 3 + 2] = z;
        
        // Explosion Target Position (x10 outward)
        targetPositions[i * 3] = x * 10.0;
        targetPositions[i * 3 + 1] = y * 10.0;
        targetPositions[i * 3 + 2] = z * 10.0;
        
        // Colors
        colors[i * 3] = colorGold.r;
        colors[i * 3 + 1] = colorGold.g;
        colors[i * 3 + 2] = colorGold.b;
    }

    return { homePositions, targetPositions, colors };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;
    
    // GPU Lerp for Star Explosion
    const targetProgress = isUnleashed ? 1.0 : 0.0;
    const factor = isUnleashed ? 0.1 : 0.05;
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, targetProgress, factor);
    
    materialRef.current.uniforms.uProgress.value = progressRef.current;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    
    // Transform: 0.6 units above tree tip
    pointsRef.current.position.set(0, CONFIG.dimensions.treeHeight + 0.6, 0);
    
    // Slow rotation around Y axis
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.5;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={homePositions.length / 3} array={homePositions} itemSize={3} />
        <bufferAttribute attach="attributes-targetPosition" count={targetPositions.length / 3} array={targetPositions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial 
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uProgress: { value: 0 },
          uTime: { value: 0 }
        }}
        transparent 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default TopDecoration;