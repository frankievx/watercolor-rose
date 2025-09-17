"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PaperEnvironment } from "./PaperEnvironment";
import { Rose } from "./Rose";

export function WatercolorRose() {
  return (
    <Canvas
      camera={{ position: [5, 5, 10], fov: 75 }}
      style={{ width: "100%", height: "100%" }}
      gl={{
        antialias: true,
        alpha: false,
      }}
      onCreated={({ gl }) => {
        // Set clear color to match paper texture
        gl.setClearColor(0xf5f3f0, 1.0);
      }}
    >
      {/* Paper texture environment */}
      <PaperEnvironment />

      {/* Lighting setup */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* The watercolor rose */}
      <Rose />

      {/* Controls for interaction */}
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </Canvas>
  );
}
