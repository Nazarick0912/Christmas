import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';
import { useHandControl } from '../context/HandControlContext';

const TopDecoration: React.FC = () => {
  const ref = useRef<THREE.Points>(null);
  const { isUnleashed } = useHandControl();
  
  const { positions, homePositions, targetPositions, colors } = useMemo(() => {
    // 1. The Strategy: Solid 5-Pointed Star (Filled Volume)
    const count = 1500; 
    const positions = new Float32Array(count * 3);
    const homePositions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    // 2. The Material: Bright Gold, High Intensity (10.0)
    // #FFD700 is classic Gold. 10.0 intensity ensures it blooms brightly.
    const colorGold = new THREE.Color('#FFD700').multiplyScalar(10.0);
    
    // Reduced size for a more refined look
    const outerRadius = 0.7;
    const innerRadius = 0.28;
    
    // Define 10 vertices for the star polygon (5 outer, 5 inner)
    // We start at PI/2 (90 deg) so the top point is straight up.
    const vertices: THREE.Vector3[] = [];
    for (let i = 0; i < 10; i++) {
        const angle = Math.PI / 2 + i * (Math.PI / 5); // Increment 36 degrees
        const r = (i % 2 === 0) ? outerRadius : innerRadius;
        vertices.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0));
    }

    for (let i = 0; i < count; i++) {
        // Uniform Random point in star polygon
        // We pick one of the 10 triangles forming the star (Center -> Vertex i -> Vertex i+1)
        const sector = Math.floor(Math.random() * 10);
        const v1 = vertices[sector];
        const v2 = vertices[(sector + 1) % 10];
        
        // Uniform Triangle Sampling logic (P = A + u(B-A) + v(C-A) with condition)
        // Since Center A is (0,0), P = u*B + v*C
        // To sample uniformly: u = sqrt(r1) * (1 - r2), v = sqrt(r1) * r2
        const r1 = Math.random();
        const r2 = Math.random();
        
        const sqrtR1 = Math.sqrt(r1);
        const coeff1 = sqrtR1 * (1 - r2);
        const coeff2 = sqrtR1 * r2;
        
        const x = coeff1 * v1.x + coeff2 * v2.x;
        const y = coeff1 * v1.y + coeff2 * v2.y;
        
        // 3D Thickness: Add slight depth so it's not paper thin
        // Reduced thickness to match smaller scale
        const z = (Math.random() - 0.5) * 0.15;

        // Store Home
        homePositions[i * 3] = x;
        homePositions[i * 3 + 1] = y;
        homePositions[i * 3 + 2] = z;
        
        // Store Initial
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Explosion Logic (x10 outward)
        targetPositions[i * 3] = x * 10.0;
        targetPositions[i * 3 + 1] = y * 10.0;
        targetPositions[i * 3 + 2] = z * 10.0;
        
        // Set Color
        colors[i * 3] = colorGold.r;
        colors[i * 3 + 1] = colorGold.g;
        colors[i * 3 + 2] = colorGold.b;
    }

    return { positions, homePositions, targetPositions, colors };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    
    // Animation Loop
    const currentPositions = ref.current.geometry.attributes.position.array as Float32Array;
    const factor = isUnleashed ? 0.1 : 0.05;
    const count = 1500;
    
    for(let i=0; i<count; i++) {
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
    
    ref.current.geometry.attributes.position.needsUpdate = true;
    
    // Transform: Lift 0.6 units above the tree tip
    ref.current.position.set(0, CONFIG.dimensions.treeHeight + 0.6, 0);
    
    // Gentle floating pulse
    const time = state.clock.elapsedTime;
    const pulse = 1.0 + Math.sin(time * 2.0) * 0.05;
    const targetScale = isUnleashed ? 1.0 : pulse;
    
    ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    
    // Slow rotation around Y axis
    ref.current.rotation.y = time * 0.5;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        vertexColors 
        size={0.03} 
        transparent 
        opacity={1} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  );
};

export default TopDecoration;