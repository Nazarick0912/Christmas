import React, { useLayoutEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useWishControl } from '../context/WishControlContext';
import { CONFIG } from '../constants';

const LandedWishes: React.FC = () => {
  const { permanentWishes } = useWishControl();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: CONFIG.colors.wishLanded,
    emissive: CONFIG.colors.wishLanded,
    emissiveIntensity: 5,
    toneMapped: false
  }), []);

  const geometry = useMemo(() => new THREE.SphereGeometry(0.1, 8, 8), []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    const count = permanentWishes.length;

    // CRITICAL FIX: Always set the count. 
    // Previously, returning early when count === 0 left the mesh with its default count,
    // rendering instances at (0,0,0) (the red dot).
    meshRef.current.count = count;
    
    if (count === 0) return;

    // Update matrices
    for (let i = 0; i < count; i++) {
        const pos = permanentWishes[i];
        dummy.position.copy(pos);
        dummy.scale.setScalar(1.0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

  }, [permanentWishes, dummy]);

  return (
    <instancedMesh 
        ref={meshRef} 
        args={[geometry, material, 1000]} // Max 1000 persistent wishes per session
        frustumCulled={false}
    />
  );
};

export default LandedWishes;