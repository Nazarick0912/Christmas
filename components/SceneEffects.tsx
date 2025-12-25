import React from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

const SceneEffects: React.FC = () => {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false} autoClear={false}>
      <Bloom 
        luminanceThreshold={1.0} 
        mipmapBlur 
        intensity={1.5} 
        radius={0.4}
      />
    </EffectComposer>
  );
};

export default React.memo(SceneEffects);