"use client";

import { useLoader } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import vertexShader from "../shaders/watercolor.vert";
import fragmentShader from "../shaders/watercolor.frag";

export function WatercolorMaterial() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Load high-resolution paper texture
  const paperTexture = useLoader(
    THREE.TextureLoader,
    "/textures/paper-2667x4000.jpg"
  );

  // Configure paper texture - reduce repetition and add filtering
  useMemo(() => {
    if (paperTexture) {
      paperTexture.wrapS = THREE.RepeatWrapping;
      paperTexture.wrapT = THREE.RepeatWrapping;
      paperTexture.repeat.set(0.5, 0.5); // Larger scale to reduce seams
      paperTexture.minFilter = THREE.LinearFilter;
      paperTexture.magFilter = THREE.LinearFilter;
      // Add some randomization to break up repetition
      paperTexture.offset.set(Math.random() * 0.5, Math.random() * 0.5);
    }
  }, [paperTexture]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uLightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
      uPaperTexture: { value: paperTexture },
    }),
    [paperTexture]
  );

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      side={THREE.DoubleSide}
    />
  );
}