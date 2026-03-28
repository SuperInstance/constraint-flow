# Constraint Theory Website Comparison Report

## Executive Summary

| Metric | Old Site | New Site |
|--------|----------|----------|
| **URL** | constraint-theory.superinstance.ai | constraint-theory-web.pages.dev |
| **Total Simulations** | 12 | 52 (43 experiments + 7 simulators + 2 new) |
| **Focus** | Professional/marketing | Educational/gallery |
| **Tech Stack** | Next.js with Tailwind | Static HTML/CSS/JS |
| **Hidden Gems** | - | 4 local-only experiments |

---

## 1. Comprehensive Comparison Table

### Old Site Simulators (constraint-theory.superinstance.ai)

| # | Simulator | Status | New Site Equivalent | Notes |
|---|-----------|--------|---------------------|-------|
| 1 | `/simulators/pythagorean/` | ✅ Exists | `simulators/pythagorean/` | Core demo on both |
| 2 | `/simulators/kdtree/` | ✅ Exists | `simulators/kdtree/` | Same on both |
| 3 | `/simulators/swarm/` | ✅ Exists | `simulators/swarm/` | Same on both |
| 4 | `/simulators/rigidity/` | ✅ Exists | `experiments/rigidity/` | Moved to experiments |
| 5 | `/simulators/holonomy/` | ✅ Exists | `experiments/holonomy/` | Moved to experiments |
| 6 | `/simulators/entropy/` | ✅ Exists | `experiments/entropy/` | Moved to experiments |
| 7 | `/simulators/voxel/` | ⚠️ Similar | `experiments/voxel-xpbd/` | Renamed, enhanced |
| 8 | `/simulators/reasoning/` | ⚠️ Similar | `experiments/tree-of-thoughts/` | Renamed |
| 9 | `/simulators/benchmark/` | ⚠️ Similar | `experiments/benchmarks/` | Renamed |
| 10 | `/simulators/performance/` | ⚠️ Similar | `experiments/benchmarks/` | Merged into benchmarks |
| 11 | `/simulators/bottleneck/` | ❌ Missing | - | **UNIQUE TO OLD SITE** |
| 12 | `/simulators/flow/` | ❌ Missing | - | **UNIQUE TO OLD SITE** |

### New Site Simulators (constraint-theory-web.pages.dev)

| # | Simulator | Old Site | Notes |
|---|-----------|----------|-------|
| 1 | `simulators/pythagorean/` | ✅ | Core snapping demo |
| 2 | `simulators/kdtree/` | ✅ | Spatial indexing |
| 3 | `simulators/swarm/` | ✅ | Boids algorithm |
| 4 | `simulators/spring-mass/` | ❌ | **NEW** - Physics constraints |
| 5 | `simulators/particle-life/` | ❌ | **NEW** - Emergent behavior |
| 6 | `simulators/dodecet/` | ❌ | **NEW** - 12-direction encoding |
| 7 | `simulators/gravity-well/` | ❌ | **NEW** - Gravitational constraints |

### New Site Experiments (43 total)

| Category | Experiments |
|----------|-------------|
| **Hidden Dimensions** | hidden-dimensions ★, holographic-encoding ★, holographic, holonomy, stereographic |
| **Mathematical** | mandelbrot, fourier-series, fft, fractal, complex-plane, quaternion, geometric-algebra, calculus, laplace, lissajous |
| **Physics** | voxel-xpbd, nbody, fluid, softbody, wave-interference, kepler, attractors |
| **Graph Theory** | graph-theory, delaunay, voronoi, constraint-network, rigidity, rigidity-4d |
| **AI/ML** | tree-of-thoughts, neural-network, ml-demo |
| **Algorithms** | simplex, maxflow, cellular-automata, langton-ant, error-correction |
| **Geometry** | platonic, hypercube, topology, diffraction |
| **Other** | entropy, benchmarks, toc |

---

## 2. Simulations to PORT from Old Site

### HIGH PRIORITY

| Simulator | Value | Rationale |
|-----------|-------|-----------|
| **bottleneck** | 🔴 HIGH | Unique visualization of constraint bottlenecks - core to constraint theory |
| **flow** | 🔴 HIGH | Flow constraints visualization - essential for understanding constraint propagation |

### MEDIUM PRIORITY

| Simulator | Value | Rationale |
|-----------|-------|-----------|
| **performance** | 🟡 MEDIUM | Performance comparison view - overlaps with benchmarks, could be merged |

### LOW PRIORITY

| Simulator | Value | Rationale |
|-----------|-------|-----------|
| **benchmark** | 🟢 LOW | Already covered by `experiments/benchmarks/` |
| **reasoning** | 🟢 LOW | Covered by `experiments/tree-of-thoughts/` |
| **voxel** | 🟢 LOW | Superseded by `experiments/voxel-xpbd/` |

### TOP 3 TO PORT

1. **Bottleneck Simulator** - Visualize where constraints create system bottlenecks (Theory of Constraints)
2. **Flow Simulator** - Interactive flow-based constraint satisfaction 
3. **Performance Comparison** - Side-by-side benchmark comparison (enhance existing benchmarks)

---

## 3. Simulations to IMPROVE on New Site

### Improvements Needed

| Simulation | Old Site Advantage | Recommendation |
|------------|-------------------|----------------|
| **Pythagorean** | Old site has polished marketing page with metrics | Add stats panel (74ns/op, 280x faster) |
| **Holonomy** | Old site has cleaner navigation | Add holonomy-explorer as advanced mode |
| **Benchmarks** | Old site has performance metrics prominently | Add live benchmark runner |

### Quality Comparison

| Aspect | Old Site | New Site | Winner |
|--------|----------|----------|--------|
| Marketing/Polish | Excellent | Good | Old |
| Educational Content | Limited | Extensive | New |
| Number of Demos | 12 | 52 | New |
| Navigation | Clean navbar | Gallery style | Tie |
| Code Examples | Inline | Dedicated section | New |

---

## 4. Hidden Gems - Local Files NOT on Either Site

### 🎯 HIGH VALUE - Should Be Added Immediately

| Experiment | Location | Description | Value |
|------------|----------|-------------|-------|
| **magic-eye** | `constraint-theory-audit/web/experiments/` | 3D autostereogram constraint visualization | 🔴 HIGH - Unique visualization method |
| **quantization-playground** | `repo-split/constraint-theory-web/experiments/` | Pythagorean Quantizer demo (TERNARY/POLAR/TURBO) | 🔴 HIGH - Core research demo |
| **ml-constraints** | `repo-split/constraint-theory-web/experiments/` | Neural network constraint enforcement | 🔴 HIGH - ML integration showcase |
| **holonomy-explorer** | `repo-split/constraint-theory-web/experiments/` | Interactive holonomy cycle analysis | 🟡 MEDIUM - Advanced concept |

### File Locations

```
/home/z/my-project/constraint-theory-audit/web/experiments/magic-eye/
├── index.html  # Magic Eye constraint manifold visualization
├── style.css
└── app.js

/home/z/my-project/repo-split/constraint-theory-web/experiments/
├── quantization-playground/  # NOT on live site!
│   ├── index.html
│   ├── style.css
│   └── app.js
├── ml-constraints/  # NOT on live site!
│   ├── index.html
│   ├── style.css
│   └── app.js
└── holonomy-explorer/  # NOT on live site!
    ├── index.html
    ├── style.css
    └── app.js
```

---

## 5. Recommendations

### Immediate Actions

1. **Add 4 Hidden Gems to New Site**
   - `quantization-playground` - Showcases PythagoreanQuantizer with TERNARY/POLAR/TURBO modes
   - `ml-constraints` - Critical for ML audience, shows neural network constraint enforcement
   - `magic-eye` - Unique 3D visualization of constraint manifolds
   - `holonomy-explorer` - Advanced holonomy cycle analysis

2. **Port from Old Site**
   - `bottleneck` - Core constraint theory visualization
   - `flow` - Flow-based constraint satisfaction

3. **Enhance Existing Simulations**
   - Add performance metrics panel to Pythagorean simulator
   - Merge `holonomy-explorer` features into `holonomy` experiment
   - Add live benchmark comparison to `benchmarks` experiment

### Medium-Term

1. **Navigation Improvements**
   - Add search/filter functionality to gallery
   - Create "featured" section for best demos
   - Add difficulty indicators (Beginner/Intermediate/Advanced)

2. **Content Additions**
   - Add "How It Works" explainer for each simulation
   - Create learning paths (e.g., "Start Here for ML Engineers")
   - Add export/share functionality for simulation states

### Long-Term

1. **Unified Architecture**
   - Consolidate old and new sites into single codebase
   - Use Next.js for all pages (currently mixed)
   - Add proper build process for experiments

2. **Interactive Tutorials**
   - Create step-by-step tutorials for each simulation
   - Add guided learning mode
   - Create challenge/puzzle mode

---

## 6. Statistics Summary

| Metric | Count |
|--------|-------|
| **Old Site Simulators** | 12 |
| **New Site Simulators** | 7 |
| **New Site Experiments** | 43 |
| **New Site Total** | 52 |
| **Hidden Gems (local only)** | 4 |
| **Old Site Unique** | 2 (bottleneck, flow) |
| **New Site Unique** | 40+ |

---

## 7. Action Priority Matrix

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| 🔴 P1 | Add quantization-playground to new site | Low | High |
| 🔴 P1 | Add ml-constraints to new site | Low | High |
| 🔴 P1 | Add magic-eye to new site | Low | Medium |
| 🟡 P2 | Port bottleneck from old site | Medium | High |
| 🟡 P2 | Port flow from old site | Medium | High |
| 🟢 P3 | Add holonomy-explorer to new site | Low | Medium |
| 🟢 P3 | Enhance Pythagorean with metrics | Low | Medium |

---

*Report generated by Explore Agent - Task ID 2*
*Timestamp: 2025-01-XX*
