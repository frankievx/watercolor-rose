# Watercolor Rose Shader Implementation Plan

## Overview

This plan details the implementation of a watercolor effect shader for the rose model, based on the Sinestesia Blender Eevee tutorial. The goal is to replicate the exact shader node tree and values to create an authentic watercolor painting appearance.

**Reference**: https://sinestesia.co/blog/tutorials/watercolor-eevee/

## Core Principles

1. **"From light to dark" material building**: Start with paper texture, let it show through light areas
2. **Window coordinates**: Use screen-space coordinates for consistent paper texture
3. **Multiply blending**: Layer colors using multiply mode to simulate watercolor transparency
4. **Organic transitions**: Use zigzag patterns and noise for natural watercolor bleeding effects

## Shader Node Tree Analysis

### 1. Paper Texture System

#### World Background Setup
- **Texture Coordinate**: Window coordinates (screen-space)
- **Mapping Node**: Position/scale paper texture
- **Curves Node**: Desaturate and adjust contrast
- **Light Path Node**: Use "Is Camera Ray" to disable paper for lighting calculations

#### GLSL Implementation Needs:
- `gl_FragCoord.xy / uResolution` for window coordinates
- Desaturation function: `dot(color, vec3(0.299, 0.587, 0.114))`
- Contrast/brightness adjustment curves

### 2. Noise Distortion System

#### Blender Node Setup:
- **3 Noise Texture Nodes**: One for each XYZ axis
- **Scale**: Moderate (need to extract exact value from images)
- **Combine XYZ**: Merge noise outputs
- **Multiply Node**: Factor = **0.7** 
- **Add to Base Normal**: Distort surface normals

#### GLSL Implementation:
```glsl
// Multi-octave noise function
float blenderNoise(vec2 uv, float scale);

// Generate 3D noise vector
vec3 noiseDistortion = vec3(
  blenderNoise(uv, noiseScale),
  blenderNoise(uv + vec2(0.5), noiseScale), 
  blenderNoise(uv + vec2(1.0), noiseScale)
) * 0.7; // Exact multiply factor from tutorial
```

### 3. Layer Weight (Fresnel) System

#### Blender Setup:
- **Layer Weight Node**: Blend = **0.2**
- **Purpose**: Edge detection for rim lighting effects

#### GLSL Implementation:
```glsl
float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
float layerWeight = pow(fresnel, 0.2); // Blend value from tutorial
```

### 4. ColorRamp Systems

#### Edge ColorRamp #1 (Hard Edges)
- **Type**: Constant (hard transitions)
- **Colors**: Need to extract from tutorial images
- **Purpose**: Sharp edge definition

#### Edge ColorRamp #2 (Soft Edges)
- **Colors**: 
  - `#FFC1D2` (light pink)
  - `#FFFFFF` (white)
- **Type**: BSpline (smooth)
- **Purpose**: Soft edge highlights

#### Main Lighting ColorRamp
- **Colors**:
  - `#9B3E72` (deep rose)
  - `#D5A781` (warm mid-tone)
  - `#FFFFFF` (white/light areas)
- **Type**: BSpline 
- **Stops**: Tight positioning for controlled transitions

### 5. Shader-to-RGB System

#### Blender Implementation:
- Convert shader calculations to RGB values
- Feed into ColorRamp nodes for color mapping

#### GLSL Implementation:
```glsl
// Lighting calculation
float NdotL = max(dot(distortedNormal, lightDirection), 0.0);

// Map to color ranges
vec3 mainColor = watercolorMainRamp(NdotL);
```

## Exact Values from High-Resolution Reference Images

### Normals Section (blender-normals.png):

**Texture Coordinate:**
- **Type**: Generated to Window
- **Object**: From Instancer

**Noise Texture Node #1:**
- **Scale**: 3.660
- **Detail**: 15.000
- **Roughness**: 0.500
- **Lacunarity**: 2.000
- **Distortion**: 2.410

**Noise Texture Node #2:**
- **Scale**: 5.900
- **Detail**: 2.000
- **Roughness**: 0.500
- **Lacunarity**: 2.000
- **Distortion**: 2.500

**Noise Texture Node #3:**
- **Scale**: 8.500
- **Detail**: 2.000
- **Roughness**: 0.500
- **Lacunarity**: 2.000
- **Distortion**: 2.130

**Processing Chain:**
- **Effect Strength (Multiply)**: 0.700 (exact value)
- **Combine XYZ**: Merges all three noise outputs (X, Y, Z)
- **Add Node**: Adds noise distortion to Geometry Normal

### Lighting Section (blender-lighting.png):

**Principled BSDF:**
- **Base Color**: Connected to shader network
- **Metallic**: 0.000
- **Roughness**: 0.500
- **IOR**: 1.450
- **Alpha**: 1.000

**Shader to RGB:**
- Converts BSDF output to color values

**ColorRamp #1 (First Stage):**
- **Interpolation**: Linear
- **Stop Position**: 0.104 (position 3)

**ColorRamp #2 (Second Stage):**
- **Interpolation**: B-Spline
- **Stop Position**: 0.399 (position 1)

### Edges Section (blender-edges.png):

**Layer Weight Node:**
- **Blend**: 0.200 (exact value)
- **Facing**: Connected to Normal

**ColorRamp #1 (Fresnel Processing):**
- **Interpolation**: B-Spline
- **Stop Position**: 0.778 (position 1)

**ColorRamp #2 (Edge Control):**
- **Interpolation**: Constant
- **Stop Position**: 0.444 (position 1)

**ColorRamp #3 (Final Edge):**
- **Interpolation**: B-Spline
- **Stop Position**: 0.968 (position 1)

**Multiply Node:**
- **Operation**: Multiply
- **Clamp**: Enabled

### Confirmed Color Palette:
- Deep Rose: `#9B3E72` → `vec3(0.608, 0.243, 0.447)`
- Warm Tone: `#D5A781` → `vec3(0.835, 0.655, 0.506)`
- Light Pink: `#FFC1D2` → `vec3(1.0, 0.757, 0.824)`
- White: `#FFFFFF` → `vec3(1.0, 1.0, 1.0)`

## Critical Missing Components & Solutions

### 1. Window Coordinate System
**Problem**: Current screen coordinates don't match Blender's Window coordinates  
**Solution**: Implement proper window coordinate transformation that accounts for camera projection and matches Blender's Y-up coordinate system

### 2. Light Path Node Equivalent
**Problem**: Need to control when paper texture is visible (only for camera rays)  
**Solution**: Use fragment depth testing to simulate "Is Camera Ray" functionality - apply paper texture only to background fragments

### 3. Interpolation Method Functions  
**Problem**: Different ColorRamps use different interpolation (B-Spline, Constant, Linear)  
**Solution**: Create separate interpolation functions for B-Spline (smooth watercolor bleeding), Constant (hard edges), and Linear transitions

### 4. Complete Shader-to-RGB Implementation
**Problem**: Current lighting is too simple, need full BSDF simulation  
**Solution**: Implement complete Principled BSDF equivalent with proper Fresnel, roughness (0.500), metallic (0.000), and IOR (1.450) calculations

### 5. Multi-Scale Noise Optimization
**Problem**: Three separate noise calls are expensive  
**Solution**: Optimize with combined noise function using exact scales (3.660, 5.900, 8.500) and different detail/distortion values per scale

### 6. Color Space Pipeline
**Problem**: Blender uses linear color space, web uses sRGB  
**Solution**: Implement linear to sRGB color space conversion (gamma 2.2) for proper color matching

### 7. Debug Visualization System
**Problem**: Need to isolate and test each component  
**Solution**: Add uniform-controlled debug modes to visualize normals, lighting, edges, and paper texture separately

### 8. Final Compositing Chain (Critical Missing)
**Problem**: Missing the exact two-stage multiply chain with clamp operations from Blender output  
**Solution**: Implement two sequential multiply nodes with Factor: 1.000, clamp operations, and proper paper texture integration

### 9. Emission Output System
**Problem**: Current implementation uses standard surface output, Blender uses Emission with strength 1.000  
**Solution**: Configure Three.js material to simulate Blender's Emission output behavior for proper brightness and color response

### 10. Blender Render Settings Matching
**Problem**: WebGL settings may not match Blender's render pipeline, causing visual differences  
**Solution**: Extract and replicate Blender's color management, gamma settings, and viewport configuration in Three.js

## Revised Implementation Strategy

### Phase 0: Foundation & Infrastructure
- [ ] Implement proper window coordinate system
- [ ] Create interpolation method functions (B-Spline, Constant, Linear)  
- [ ] Build debug visualization system with uniforms
- [ ] Set up color space conversion pipeline
- [ ] Test each foundation component in isolation

### Phase 1: Core Noise System (Simplified)
- [ ] Implement single noise scale (3.660) first
- [ ] Add basic normal distortion with 0.700 multiply
- [ ] Visual validation against reference
- [ ] Performance baseline measurement

### Phase 2: Multi-Scale Noise Enhancement  
- [ ] Add remaining noise scales (5.900, 8.500)
- [ ] Implement different detail/distortion values per scale
- [ ] Optimize with combined noise function
- [ ] Add LOD system for performance

### Phase 3: Shader-to-RGB & Lighting
- [ ] Implement complete BSDF simulation
- [ ] Add Principled BSDF equivalent with exact values
- [ ] Create ColorRamp system with proper interpolation
- [ ] Test lighting accuracy against reference

### Phase 4: Layer Weight & Edge System
- [ ] Implement Layer Weight with 0.200 blend value
- [ ] Create multiple edge ColorRamps with exact stop positions
- [ ] Add B-Spline and Constant interpolation modes
- [ ] Test edge highlight behavior

### Phase 5: Paper Integration & Light Path
- [ ] Implement Light Path equivalent for camera ray detection
- [ ] Integrate paper texture with proper layering
- [ ] Add world background system
- [ ] Test paper visibility and blending

### Phase 6: Final Compositing & Render Settings
- [ ] Implement exact two-stage multiply chain with Factor: 1.000
- [ ] Configure Emission output system with strength 1.000
- [ ] Match Blender render settings and color management
- [ ] Add clamp operations between multiply stages

### Phase 7: Optimization & Validation
- [ ] Performance optimization and profiling
- [ ] A/B testing against reference images  
- [ ] Component isolation testing for each multiply stage
- [ ] Final color accuracy validation

## Performance Considerations

### LOD System Implementation
Implement distance-based detail reduction for expensive noise calculations, reducing detail values from 15.0 to 2.0 beyond 20 units from camera

### Texture Optimization
Combine multiple paper texture samples into single lookup using different texture channels to reduce bandwidth

## Success Metrics & Testing

### Visual Validation Checkpoints
1. **Noise Distortion**: Compare normal visualization with Blender
2. **Lighting Response**: Match ColorRamp outputs exactly  
3. **Edge Behavior**: Verify rim lighting and fresnel effects
4. **Paper Integration**: Ensure proper background blending
5. **Color Accuracy**: Side-by-side comparison with reference images

### Performance Targets
- **60 FPS** on desktop (GTX 1060 equivalent)
- **30 FPS** on mobile (iPhone 12 equivalent)  
- **< 16ms** frame time budget for VR compatibility

## High-Level Shader Architecture

### Processing Pipeline
1. **Window Coordinates**: Calculate proper screen-space coordinates for paper texture
2. **Paper Texture Processing**: Sample and process background paper texture  
3. **Noise Distortion**: Generate multi-scale noise for normal distortion
4. **Shader-to-RGB**: Convert BSDF lighting to RGB values
5. **ColorRamp Application**: Apply lighting and edge color mapping
6. **First Multiply Stage**: Multiply paper texture with main colors (Factor: 1.000, Clamp enabled)
7. **Second Multiply Stage**: Multiply result with edge highlights (Factor: 1.000, Clamp enabled)
8. **Emission Output**: Apply as emission with strength 1.000 instead of surface shading

## Blender Render Settings Investigation

### Required Blender Setting Extraction
- **Color Management**: View Transform, Look, Exposure, Gamma settings
- **Render Properties**: Film settings, Light Paths, Sampling
- **Viewport Shading**: Material Preview/Rendered mode settings
- **World Settings**: Background color, strength, HDRI environment
- **Camera Settings**: Lens properties, depth of field, exposure

### Three.js/WebGL Equivalent Settings
- **Renderer Configuration**: toneMapping, outputColorSpace, physicallyCorrectLights
- **Camera Setup**: fov, near/far planes, exposure compensation
- **Material Properties**: emissive, emissiveIntensity for Emission simulation
- **Scene Environment**: background, environmentIntensity matching
- **Color Space**: Linear workflow vs sRGB output matching

## Testing Requirements

### Visual Validation:
- [ ] Compare side-by-side with tutorial reference images
- [ ] Test under different lighting conditions
- [ ] Verify paper texture integration
- [ ] Check edge highlight behavior
- [ ] Validate color accuracy

### Technical Validation:
- [ ] Performance testing with complex geometry
- [ ] Shader compilation on different devices
- [ ] Memory usage with high-resolution paper texture

## Success Criteria

1. **Visual Fidelity**: Matches reference tutorial appearance
2. **Paper Integration**: Paper texture properly shows through light areas
3. **Organic Transitions**: Natural watercolor bleeding effects
4. **Edge Quality**: Proper rim lighting and edge highlights
5. **Performance**: Maintains 60fps on target hardware

## Next Steps

1. Begin Phase 1 implementation
2. Create comparison screenshots for each phase
3. Document any deviations from original tutorial values
4. Build iterative testing process for visual validation