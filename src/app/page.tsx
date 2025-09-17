"use client";

import { WatercolorRose } from "./components/WatercolorRose";

export default function Home() {
  return (
    <div className="w-full h-screen bg-white">
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Watercolor Rose
        </h1>
        <p className="text-sm text-gray-600 max-w-md">
          A watercolor-style rose rendered with React Three Fiber, recreating
          the shader technique from the Sinestesia Blender tutorial.
        </p>
      </div>
      <WatercolorRose />
    </div>
  );
}
