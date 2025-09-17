"use client";

import { useLoader, useThree, useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

export function PaperEnvironment() {
  const { scene, camera } = useThree();
  const paperTexture = useLoader(
    THREE.TextureLoader,
    "/textures/paper-2667x4000.jpg"
  );

  // Create texture and set up camera-responsive updates
  useMemo(() => {
    if (paperTexture) {
      // Clone texture to avoid modifying original
      const bgTexture = paperTexture.clone();

      // Use moderate tiling with mirrored wrapping to reduce seam visibility
      bgTexture.wrapS = THREE.MirroredRepeatWrapping;
      bgTexture.wrapT = THREE.MirroredRepeatWrapping;
      bgTexture.repeat.set(1.0, 1.0); // 2x2 tiling with mirroring

      bgTexture.minFilter = THREE.LinearFilter;
      bgTexture.magFilter = THREE.LinearFilter;
      bgTexture.flipY = false;

      // Set the zoomed high-resolution image as background
      scene.background = bgTexture;

      // Function to update texture offset based on camera direction
      const updateOffset = () => {
        if (scene.background === bgTexture) {
          // Get camera's world direction for smooth unlimited rotation
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);

          // Convert direction to UV offset (more natural than euler angles)
          const offsetX = Math.atan2(direction.x, direction.z) * 0.05; // Horizontal pan
          const offsetY = direction.y * 0.05; // Vertical tilt

          bgTexture.offset.set(
            offsetX, // Simple offset for camera movement
            offsetY
          );
        }
      };

      // Update offset initially and store update function
      updateOffset();

      // Store the update function on the texture for cleanup
      (
        bgTexture as THREE.Texture & { updateOffset?: () => void }
      ).updateOffset = updateOffset;
    }

    return () => {
      if (scene.background) {
        scene.background = null;
      }
    };
  }, [paperTexture, scene, camera]);

  // Update texture offset on every frame
  useFrame(() => {
    const bg = scene.background as THREE.Texture & {
      updateOffset?: () => void;
    };
    if (bg && bg.updateOffset) {
      bg.updateOffset();
    }
  });

  return null;
}