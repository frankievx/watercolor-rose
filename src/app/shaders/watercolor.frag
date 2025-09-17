uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uLightDirection;
uniform sampler2D uPaperTexture;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;

// Improved noise function matching Blender's Noise Texture
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Blender-style noise with multiple octaves
float blenderNoise(vec2 uv, float scale) {
  vec2 scaledUv = uv * scale;
  float n = 0.0;
  n += noise(scaledUv) * 0.5;
  n += noise(scaledUv * 2.0) * 0.25;
  n += noise(scaledUv * 4.0) * 0.125;
  return n;
}

// Create distorted normals exactly like your Blender setup
vec3 getDistortedNormals(vec3 baseNormal, vec2 uv) {
  // Three noise textures with different scales (matching your setup)
  float noise1 = blenderNoise(uv, 3.400); // Scale from your Noise Texture nodes
  float noise2 = blenderNoise(uv, 3.400); 
  float noise3 = blenderNoise(uv, 3.400);
  
  // Multiply by 0.700 intensity (from your Multiply nodes)
  vec3 noiseDistortion = vec3(noise1, noise2, noise3) * 0.700;
  
  // Add to base normal (like your Combine XYZ → Add setup)
  vec3 distortedNormal = baseNormal + noiseDistortion;
  return normalize(distortedNormal);
}

// Zigzag transition function for watercolor bleeding effect
float zigzagTransition(float value, float frequency) {
  float wave = sin(value * frequency * 3.14159) * 0.5 + 0.5;
  return mix(value, wave, 0.2); // Reduced intensity for subtlety
}

// Watercolor ColorRamp with zigzag transitions (bspline-like)
vec3 watercolorMainRamp(float factor) {
  factor = clamp(factor, 0.0, 1.0);
  
  // Add zigzag for organic watercolor transitions
  float zigzagFactor = zigzagTransition(factor, 8.0);
  
  // Light to dark watercolor colors (tutorial approach)
  vec3 lightRose = vec3(0.98, 0.92, 0.94);   // Almost paper white
  vec3 midRose = vec3(0.92, 0.78, 0.84);     // Light rose
  vec3 deepRose = vec3(0.82, 0.62, 0.70);    // Deeper rose
  vec3 shadowRose = vec3(0.75, 0.50, 0.62);  // Shadow areas
  
  if (zigzagFactor < 0.25) {
    return mix(lightRose, midRose, zigzagFactor / 0.25);
  } else if (zigzagFactor < 0.6) {
    return mix(midRose, deepRose, (zigzagFactor - 0.25) / 0.35);
  } else {
    return mix(deepRose, shadowRose, (zigzagFactor - 0.6) / 0.4);
  }
}

// Edge ColorRamp with zigzag for organic edges
vec3 watercolorEdgeRamp(float factor) {
  factor = clamp(factor, 0.0, 1.0);
  
  // Add zigzag for organic edge transitions
  float zigzagFactor = zigzagTransition(factor, 12.0);
  
  // Edge colors that blend well with main colors
  vec3 edgeLight = vec3(0.95, 0.88, 0.90);   // Light edge
  vec3 edgeMid = vec3(0.88, 0.75, 0.82);     // Mid edge
  
  return mix(edgeLight, edgeMid, zigzagFactor);
}

void main() {
  // ===== SEAMLESS PAPER TEXTURE =====
  vec2 windowUv = gl_FragCoord.xy / uResolution;
  
  // Use multiple texture samples at different scales and offsets to break repetition
  vec2 uv1 = windowUv * 1.5;
  vec2 uv2 = windowUv * 2.3 + vec2(0.3, 0.7);
  vec2 uv3 = windowUv * 0.8 + vec2(0.1, 0.9);
  
  // Sample paper texture multiple times and blend
  vec3 paper1 = texture2D(uPaperTexture, uv1).rgb;
  vec3 paper2 = texture2D(uPaperTexture, uv2).rgb;
  vec3 paper3 = texture2D(uPaperTexture, uv3).rgb;
  
  // Blend the samples to break up repetition
  vec3 paperTexture = (paper1 * 0.5 + paper2 * 0.3 + paper3 * 0.2);
  
  // Add some procedural noise to further break up patterns
  float noiseBreak = blenderNoise(windowUv, 15.0) * 0.1;
  paperTexture = mix(paperTexture, vec3(noiseBreak + 0.9), 0.2);
  
  // Desaturate and prepare paper (like tutorial's Curves node)
  float paperLuminance = dot(paperTexture, vec3(0.299, 0.587, 0.114));
  paperTexture = mix(vec3(paperLuminance), paperTexture, 0.3); // Desaturate
  paperTexture = paperTexture * 0.95 + 0.05; // Adjust contrast/brightness
  
  // ===== DISTORTED NORMALS FOR PAINTERLY EFFECT =====
  vec3 distortedNormal = getDistortedNormals(vNormal, vUv);
  
  // ===== LIGHTING (Shader-to-RGB simulation) =====
  float NdotL = max(dot(distortedNormal, normalize(uLightDirection)), 0.0);
  
  // ===== LAYER WEIGHT (FRESNEL) FOR EDGES =====
  vec3 viewDir = normalize(-vViewPosition);
  float fresnel = 1.0 - max(dot(distortedNormal, viewDir), 0.0);
  
  // ===== WATERCOLOR LAYERING: LIGHT TO DARK =====
  
  // Layer 1: Main color (lighting-based)
  vec3 mainColor = watercolorMainRamp(NdotL * 0.7 + 0.3);
  
  // Layer 2: Edge highlights
  vec3 edgeColor = watercolorEdgeRamp(fresnel);
  
  // Layer 3: Additional shadow layer for depth
  float shadowFactor = 1.0 - NdotL;
  shadowFactor = zigzagTransition(shadowFactor, 6.0);
  vec3 shadowColor = mix(vec3(1.0), vec3(0.78, 0.55, 0.65), shadowFactor * 0.4);
  
  // ===== WATERCOLOR TECHNIQUE: START WITH PAPER, MULTIPLY LAYERS =====
  vec3 result = paperTexture;
  
  // Multiply main color layer (watercolor technique)
  result *= mainColor;
  
  // Multiply edge layer
  result *= edgeColor;
  
  // Multiply shadow layer  
  result *= shadowColor;
  
  // ===== FINAL PAPER TEXTURE ENHANCEMENT =====
  // Add some paper texture noise back in
  float paperNoise = blenderNoise(windowUv, 25.0) * 0.1 + 0.9;
  result *= paperNoise;
  
  // Prevent pure black (watercolor never goes completely black)
  result = max(result, vec3(0.25));
  
  gl_FragColor = vec4(result, 1.0);
}
