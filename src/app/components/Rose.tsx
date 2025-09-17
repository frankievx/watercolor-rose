"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { WatercolorMaterial } from "./WatercolorMaterial";

export function Rose() {
  const { scene, nodes } = useGLTF("/models/rose.glb");

  // Get the specific mesh node (we know it's called "Petals")
  const petalsMesh = nodes.Petals as THREE.Mesh;

  // Center the geometry
  const centeredGeometry = useMemo(() => {
    if (petalsMesh?.geometry) {
      const geometry = petalsMesh.geometry.clone();
      geometry.center(); // This centers the geometry at the origin
      geometry.computeBoundingBox();
      console.log("Centered geometry bounding box:", geometry.boundingBox);
      return geometry;
    }
    return null;
  }, [petalsMesh]);

  // Debug: log what we're getting from the GLTF
  useMemo(() => {
    console.log("GLTF scene:", scene);
    console.log("Petals mesh:", petalsMesh);
    if (petalsMesh) {
      console.log("Petals geometry:", petalsMesh.geometry);
      console.log("Petals position:", petalsMesh.position);
      console.log("Petals scale:", petalsMesh.scale);
    }
  }, [scene, petalsMesh]);

  return (
    <group>
      <mesh
        geometry={centeredGeometry || petalsMesh.geometry}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        scale={[0.5, 0.5, 0.5]}
      >
        <WatercolorMaterial />
      </mesh>
    </group>
  );
}

// Preload the GLTF model
useGLTF.preload("/models/rose.glb");