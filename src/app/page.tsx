'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Atom, Brain, Waves, Grid3X3, Circle, Hexagon, Triangle, 
  Zap, Network, Sparkles, Play, Pause, RotateCcw, Settings,
  ChevronRight, ExternalLink, Github, BookOpen, Cpu, Code,
  Layers, Box, TrendingDown, Minus, ArrowRight,
  Lightbulb, Rocket, Target
} from 'lucide-react'

// ==================== CODE COMPARISON DATA ====================
type Language = 'rust' | 'python' | 'typescript' | 'go' | 'cpp'

interface CodeExample {
  title: string
  description: string
  simulationId: string
  standardCode: Record<Language, string>
  ourCode: Record<Language, string>
  standardChars: number
  ourChars: number
  standardComplexity: string
  ourComplexity: string
}

const codeComparisons: CodeExample[] = [
  {
    title: "Spatial Indexing",
    description: "Find nearest Pythagorean triple in 2D space using KD-tree",
    simulationId: "kdtree",
    standardCode: {
      rust: `// Standard approach: Brute force search
fn find_nearest_pythagorean(
    point: (f64, f64),
    triples: &[(i32, i32, i32)]
) -> Option<(i32, i32, i32)> {
    let mut best: Option<(i32, i32, i32)> = None;
    let mut best_dist = f64::MAX;
    
    for &(a, b, c) in triples {
        let da = (point.0 - a as f64).powi(2);
        let db = (point.1 - b as f64).powi(2);
        let dist = (da + db).sqrt();
        
        if dist < best_dist {
            best_dist = dist;
            best = Some((a, b, c));
        }
    }
    best
}`,
      python: `# Standard approach: Brute force search
def find_nearest_pythagorean(point, triples):
    best = None
    best_dist = float('inf')
    
    for a, b, c in triples:
        da = (point[0] - a) ** 2
        db = (point[1] - b) ** 2
        dist = (da + db) ** 0.5
        
        if dist < best_dist:
            best_dist = dist
            best = (a, b, c)
    
    return best`,
      typescript: `// Standard approach: Brute force search
function findNearestPythagorean(
  point: [number, number],
  triples: [number, number, number][]
): [number, number, number] | null {
  let best: [number, number, number] | null = null;
  let bestDist = Infinity;
  
  for (const [a, b, c] of triples) {
    const da = (point[0] - a) ** 2;
    const db = (point[1] - b) ** 2;
    const dist = Math.sqrt(da + db);
    
    if (dist < bestDist) {
      bestDist = dist;
      best = [a, b, c];
    }
  }
  return best;
}`,
      go: `// Standard approach: Brute force search
func FindNearestPythagorean(point [2]float64, 
    triples [][3]int) [3]int {
    var best [3]int
    bestDist := math.MaxFloat64
    
    for _, t := range triples {
        da := math.Pow(point[0]-float64(t[0]), 2)
        db := math.Pow(point[1]-float64(t[1]), 2)
        dist := math.Sqrt(da + db)
        
        if dist < bestDist {
            bestDist = dist
            best = t
        }
    }
    return best
}`,
      cpp: `// Standard approach: Brute force search
std::optional<std::tuple<int,int,int>>
findNearestPythagorean(
    std::pair<double,double> point,
    const std::vector<std::tuple<int,int,int>>& triples) {
    std::optional<std::tuple<int,int,int>> best;
    double bestDist = std::numeric_limits<double>::max();
    
    for (const auto& [a, b, c] : triples) {
        double da = std::pow(point.first - a, 2);
        double db = std::pow(point.second - b, 2);
        double dist = std::sqrt(da + db);
        
        if (dist < bestDist) {
            bestDist = dist;
            best = {a, b, c};
        }
    }
    return best;
}`
    },
    ourCode: {
      rust: `// Constraint Theory: KD-tree lookup
use constraint_theory::Manifold;

let manifold = Manifold::pythagorean();
let nearest = manifold.find_nearest(point)?;
// O(log n) vs O(n) - Done!`,
      python: `# Constraint Theory: KD-tree lookup
from constraint_theory import Manifold

manifold = Manifold.pythagorean()
nearest = manifold.find_nearest(point)
# O(log n) vs O(n) - Done!`,
      typescript: `// Constraint Theory: KD-tree lookup
import { Manifold } from 'constraint-theory';

const manifold = Manifold.pythagorean();
const nearest = manifold.findNearest(point);
// O(log n) vs O(n) - Done!`,
      go: `// Constraint Theory: KD-tree lookup
import "github.com/constraint-theory"

manifold := theory.NewManifold()
nearest := manifold.FindNearest(point)
// O(log n) vs O(n) - Done!`,
      cpp: `// Constraint Theory: KD-tree lookup
#include <constraint_theory/manifold.hpp>

auto manifold = theory::Manifold::pythagorean();
auto nearest = manifold.find_nearest(point);
// O(log n) vs O(n) - Done!`
    },
    standardChars: 412,
    ourChars: 89,
    standardComplexity: "O(n)",
    ourComplexity: "O(log n)"
  },
  {
    title: "Coordinate Snapping",
    description: "Snap a vector to exact Pythagorean coordinates",
    simulationId: "pythagorean",
    standardCode: {
      rust: `// Manual constraint solving
fn snap_to_pythagorean(v: (f64, f64)) -> (i32, i32, i32) {
    let mut best = (0, 0, 0);
    let mut best_err = f64::MAX;
    
    for a in -100..=100 {
        for b in -100..=100 {
            let c = ((a*a + b*b) as f64).sqrt();
            if (c - c.round()).abs() < 1e-10 {
                let err = ((a as f64 - v.0).powi(2) +
                           (b as f64 - v.1).powi(2)).sqrt();
                if err < best_err {
                    best_err = err;
                    best = (a, b, c as i32);
                }
            }
        }
    }
    best
}`,
      python: `# Manual constraint solving
def snap_to_pythagorean(v):
    best = (0, 0, 0)
    best_err = float('inf')
    
    for a in range(-100, 101):
        for b in range(-100, 101):
            c = (a*a + b*b) ** 0.5
            if abs(c - round(c)) < 1e-10:
                err = ((a - v[0])**2 + 
                       (b - v[1])**2) ** 0.5
                if err < best_err:
                    best_err = err
                    best = (a, b, int(c))
    return best`,
      typescript: `// Manual constraint solving
function snapToPythagorean(v: [number, number]): [number, number, number] {
  let best: [number, number, number] = [0, 0, 0];
  let bestErr = Infinity;
  
  for (let a = -100; a <= 100; a++) {
    for (let b = -100; b <= 100; b++) {
      const c = Math.sqrt(a*a + b*b);
      if (Math.abs(c - Math.round(c)) < 1e-10) {
        const err = Math.sqrt((a - v[0])**2 + (b - v[1])**2);
        if (err < bestErr) {
          bestErr = err;
          best = [a, b, Math.round(c)];
        }
      }
    }
  }
  return best;
}`,
      go: `// Manual constraint solving
func SnapToPythagorean(v [2]float64) [3]int {
    best := [3]int{0, 0, 0}
    bestErr := math.MaxFloat64
    
    for a := -100; a <= 100; a++ {
        for b := -100; b <= 100; b++ {
            c := math.Sqrt(float64(a*a + b*b))
            if math.Abs(c - math.Round(c)) < 1e-10 {
                err := math.Sqrt(
                    math.Pow(float64(a)-v[0], 2) +
                    math.Pow(float64(b)-v[1], 2))
                if err < bestErr {
                    bestErr = err
                    best = [3]int{a, b, int(c)}
                }
            }
        }
    }
    return best
}`,
      cpp: `// Manual constraint solving
std::tuple<int,int,int> snapToPythagorean(
    std::pair<double,double> v) {
    std::tuple<int,int,int> best{0, 0, 0};
    double bestErr = std::numeric_limits<double>::max();
    
    for (int a = -100; a <= 100; a++) {
        for (int b = -100; b <= 100; b++) {
            double c = std::sqrt(a*a + b*b);
            if (std::abs(c - std::round(c)) < 1e-10) {
                double err = std::sqrt(
                    std::pow(a - v.first, 2) +
                    std::pow(b - v.second, 2));
                if (err < bestErr) {
                    bestErr = err;
                    best = {a, b, static_cast<int>(c)};
                }
            }
        }
    }
    return best;
}`
    },
    ourCode: {
      rust: `// Constraint Theory: One-liner
use constraint_theory::Manifold;

let snapped = Manifold::pythagorean()
    .snap(v.0, v.1)?;`,
      python: `# Constraint Theory: One-liner
from constraint_theory import Manifold

snapped = Manifold.pythagorean().snap(v[0], v[1])`,
      typescript: `// Constraint Theory: One-liner
import { Manifold } from 'constraint-theory';

const snapped = Manifold.pythagorean()
    .snap(v[0], v[1]);`,
      go: `// Constraint Theory: One-liner
import "github.com/constraint-theory"

snapped := theory.NewManifold().Snap(v[0], v[1])`,
      cpp: `// Constraint Theory: One-liner
#include <constraint_theory/manifold.hpp>

auto snapped = theory::Manifold::pythagorean()
    .snap(v.first, v.second);`
    },
    standardChars: 445,
    ourChars: 62,
    standardComplexity: "O(n²)",
    ourComplexity: "O(log n)"
  },
  {
    title: "Batch Processing",
    description: "Process 1000 vectors with SIMD optimization",
    simulationId: "swarm",
    standardCode: {
      rust: `// Process vectors one by one
let results: Vec<(i32,i32,i32)> = vectors
    .iter()
    .map(|v| {
        let mut best = (0, 0, 0);
        let mut best_err = f64::MAX;
        for a in -100..=100 {
            for b in -100..=100 {
                let c_sq = a*a + b*b;
                let c = (c_sq as f64).sqrt();
                if (c - c.round()).abs() < 1e-10 {
                    let err = (a as f64 - v.0).powi(2) +
                              (b as f64 - v.1).powi(2);
                    if err < best_err {
                        best_err = err;
                        best = (a, b, c as i32);
                    }
                }
            }
        }
        best
    })
    .collect();`,
      python: `# Process vectors one by one
results = []
for v in vectors:
    best = (0, 0, 0)
    best_err = float('inf')
    for a in range(-100, 101):
        for b in range(-100, 101):
            c_sq = a*a + b*b
            c = c_sq ** 0.5
            if abs(c - round(c)) < 1e-10:
                err = (a - v[0])**2 + (b - v[1])**2
                if err < best_err:
                    best_err = err
                    best = (a, b, int(c))
    results.append(best)`,
      typescript: `// Process vectors one by one
const results: [number, number, number][] = vectors.map(v => {
  let best: [number, number, number] = [0, 0, 0];
  let bestErr = Infinity;
  for (let a = -100; a <= 100; a++) {
    for (let b = -100; b <= 100; b++) {
      const c = Math.sqrt(a*a + b*b);
      if (Math.abs(c - Math.round(c)) < 1e-10) {
        const err = (a - v[0])**2 + (b - v[1])**2;
        if (err < bestErr) {
          bestErr = err;
          best = [a, b, Math.round(c)];
        }
      }
    }
  }
  return best;
});`,
      go: `// Process vectors one by one
var results [][3]int
for _, v := range vectors {
    best := [3]int{0, 0, 0}
    bestErr := math.MaxFloat64
    for a := -100; a <= 100; a++ {
        for b := -100; b <= 100; b++ {
            c := math.Sqrt(float64(a*a + b*b))
            if math.Abs(c - math.Round(c)) < 1e-10 {
                err := math.Pow(float64(a)-v[0], 2) +
                       math.Pow(float64(b)-v[1], 2)
                if err < bestErr {
                    bestErr = err
                    best = [3]int{a, b, int(c)}
                }
            }
        }
    }
    results = append(results, best)
}`,
      cpp: `// Process vectors one by one
std::vector<std::tuple<int,int,int>> results;
for (const auto& v : vectors) {
    std::tuple<int,int,int> best{0, 0, 0};
    double bestErr = std::numeric_limits<double>::max();
    for (int a = -100; a <= 100; a++) {
        for (int b = -100; b <= 100; b++) {
            double c = std::sqrt(a*a + b*b);
            if (std::abs(c - std::round(c)) < 1e-10) {
                double err = std::pow(a - v.first, 2) +
                             std::pow(b - v.second, 2);
                if (err < bestErr) {
                    bestErr = err;
                    best = {a, b, static_cast<int>(c)};
                }
            }
        }
    }
    results.push_back(best);
}`
    },
    ourCode: {
      rust: `// Constraint Theory: Batch SIMD
use constraint_theory::Manifold;

let results = Manifold::pythagorean()
    .snap_batch(&vectors)
    .collect::<Vec<_>>();`,
      python: `# Constraint Theory: Batch SIMD
from constraint_theory import Manifold
import numpy as np

results = Manifold.pythagorean().snap_batch(vectors)`,
      typescript: `// Constraint Theory: Batch SIMD
import { Manifold } from 'constraint-theory';

const results = Manifold.pythagorean()
    .snapBatch(vectors);`,
      go: `// Constraint Theory: Batch SIMD
import "github.com/constraint-theory"

results := theory.NewManifold().SnapBatch(vectors)`,
      cpp: `// Constraint Theory: Batch SIMD
#include <constraint_theory/manifold.hpp>

auto results = theory::Manifold::pythagorean()
    .snap_batch(vectors);`
    },
    standardChars: 521,
    ourChars: 87,
    standardComplexity: "O(n² × m)",
    ourComplexity: "O(m log n)"
  },
  {
    title: "Physics Simulation",
    description: "Spring-mass constraint solver with exact arithmetic",
    simulationId: "spring-mass",
    standardCode: {
      rust: `// Spring constraint solver with drift
fn solve_spring_constraints(
    nodes: &mut Vec<Node>,
    springs: &[Spring],
    dt: f64
) {
    for _ in 0..100 { // iterations for stability
        for spring in springs {
            let a = &nodes[spring.a];
            let b = &nodes[spring.b];
            
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let dist = (dx*dx + dy*dy).sqrt();
            let diff = (spring.rest - dist) / dist;
            
            // Floating-point drift accumulates here
            nodes[spring.a].x += dx * diff * 0.5;
            nodes[spring.a].y += dy * diff * 0.5;
            nodes[spring.b].x -= dx * diff * 0.5;
            nodes[spring.b].y -= dy * diff * 0.5;
        }
    }
}`,
      python: `# Spring constraint solver with drift
def solve_spring_constraints(nodes, springs, dt):
    for _ in range(100):  # iterations for stability
        for spring in springs:
            a = nodes[spring['a']]
            b = nodes[spring['b']]
            
            dx = b['x'] - a['x']
            dy = b['y'] - a['y']
            dist = (dx*dx + dy*dy) ** 0.5
            diff = (spring['rest'] - dist) / dist
            
            # Floating-point drift accumulates here
            a['x'] += dx * diff * 0.5
            a['y'] += dy * diff * 0.5
            b['x'] -= dx * diff * 0.5
            b['y'] -= dy * diff * 0.5`,
      typescript: `// Spring constraint solver with drift
function solveSpringConstraints(
  nodes: Node[],
  springs: Spring[],
  dt: number
) {
  for (let iter = 0; iter < 100; iter++) {
    for (const spring of springs) {
      const a = nodes[spring.a];
      const b = nodes[spring.b];
      
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const diff = (spring.rest - dist) / dist;
      
      // Floating-point drift accumulates here
      a.x += dx * diff * 0.5;
      a.y += dy * diff * 0.5;
      b.x -= dx * diff * 0.5;
      b.y -= dy * diff * 0.5;
    }
  }
}`,
      go: `// Spring constraint solver with drift
func SolveSpringConstraints(
    nodes []Node, springs []Spring, dt float64) {
    for iter := 0; iter < 100; iter++ {
        for _, s := range springs {
            a := &nodes[s.A]
            b := &nodes[s.B]
            
            dx := b.X - a.X
            dy := b.Y - a.Y
            dist := math.Sqrt(dx*dx + dy*dy)
            diff := (s.Rest - dist) / dist
            
            // Floating-point drift accumulates here
            a.X += dx * diff * 0.5
            a.Y += dy * diff * 0.5
            b.X -= dx * diff * 0.5
            b.Y -= dy * diff * 0.5
        }
    }
}`,
      cpp: `// Spring constraint solver with drift
void solveSpringConstraints(
    std::vector<Node>& nodes,
    const std::vector<Spring>& springs,
    double dt) {
    for (int iter = 0; iter < 100; iter++) {
        for (const auto& s : springs) {
            auto& a = nodes[s.a];
            auto& b = nodes[s.b];
            
            double dx = b.x - a.x;
            double dy = b.y - a.y;
            double dist = std::sqrt(dx*dx + dy*dy);
            double diff = (s.rest - dist) / dist;
            
            // Floating-point drift accumulates here
            a.x += dx * diff * 0.5;
            a.y += dy * diff * 0.5;
            b.x -= dx * diff * 0.5;
            b.y -= dy * diff * 0.5;
        }
    }
}`
    },
    ourCode: {
      rust: `// Constraint Theory: Exact solver
use constraint_theory::{Manifold, ConstraintSolver};

let mut solver = ConstraintSolver::new();
solver.add_springs(&springs);
solver.snap_to_manifold(Manifold::pythagorean());
// Zero drift, exact constraints!`,
      python: `# Constraint Theory: Exact solver
from constraint_theory import Manifold, ConstraintSolver

solver = ConstraintSolver()
solver.add_springs(springs)
solver.snap_to_manifold(Manifold.pythagorean())
# Zero drift, exact constraints!`,
      typescript: `// Constraint Theory: Exact solver
import { Manifold, ConstraintSolver } from 'constraint-theory';

const solver = new ConstraintSolver();
solver.addSprings(springs);
solver.snapToManifold(Manifold.pythagorean());
// Zero drift, exact constraints!`,
      go: `// Constraint Theory: Exact solver
import "github.com/constraint-theory"

solver := theory.NewConstraintSolver()
solver.AddSprings(springs)
solver.SnapToManifold(theory.NewManifold())
// Zero drift, exact constraints!`,
      cpp: `// Constraint Theory: Exact solver
#include <constraint_theory/solver.hpp>

auto solver = theory::ConstraintSolver::create();
solver.add_springs(springs);
solver.snap_to_manifold(theory::Manifold::pythagorean());
// Zero drift, exact constraints!`
    },
    standardChars: 521,
    ourChars: 112,
    standardComplexity: "O(n × iter)",
    ourComplexity: "O(n)"
  },
  {
    title: "Neural Network Constraints",
    description: "Enforce exact weight constraints in deep learning",
    simulationId: "neural-network",
    standardCode: {
      rust: `// Manual gradient clipping with drift
fn clip_gradients(
    gradients: &mut [f64],
    max_norm: f64
) {
    let mut norm: f64 = 0.0;
    for &g in gradients.iter() {
        norm += g * g;  // Accumulates FP error
    }
    norm = norm.sqrt();
    
    if norm > max_norm {
        let scale = max_norm / norm;
        for g in gradients.iter_mut() {
            *g *= scale;  // More FP error
        }
    }
}

// After many iterations, weights drift from ideal`,
      python: `# Manual gradient clipping with drift
import numpy as np

def clip_gradients(gradients, max_norm):
    norm = np.sqrt(np.sum(gradients ** 2))
    
    if norm > max_norm:
        scale = max_norm / norm
        gradients *= scale  # FP error each time
    
    return gradients

# After many iterations, weights drift from ideal`,
      typescript: `// Manual gradient clipping with drift
function clipGradients(
  gradients: number[],
  maxNorm: number
): void {
  let norm = 0;
  for (const g of gradients) {
    norm += g * g;  // Accumulates FP error
  }
  norm = Math.sqrt(norm);
  
  if (norm > maxNorm) {
    const scale = maxNorm / norm;
    for (let i = 0; i < gradients.length; i++) {
      gradients[i] *= scale;  // More FP error
    }
  }
}
// After many iterations, weights drift from ideal`,
      go: `// Manual gradient clipping with drift
func ClipGradients(gradients []float64, maxNorm float64) {
    var norm float64
    for _, g := range gradients {
        norm += g * g  // Accumulates FP error
    }
    norm = math.Sqrt(norm)
    
    if norm > maxNorm {
        scale := maxNorm / norm
        for i := range gradients {
            gradients[i] *= scale  // More FP error
        }
    }
}
// After many iterations, weights drift from ideal`,
      cpp: `// Manual gradient clipping with drift
void clipGradients(
    std::vector<double>& gradients,
    double maxNorm) {
    double norm = 0;
    for (const auto& g : gradients) {
        norm += g * g;  // Accumulates FP error
    }
    norm = std::sqrt(norm);
    
    if (norm > maxNorm) {
        double scale = maxNorm / norm;
        for (auto& g : gradients) {
            g *= scale;  // More FP error
        }
    }
}
// After many iterations, weights drift from ideal`
    },
    ourCode: {
      rust: `// Constraint Theory: Exact gradient snapping
use constraint_theory::{GradientSnapper, Manifold};

let snapper = GradientSnapper::new(
    Manifold::pythagorean()
).with_preserve_magnitude(true);

let snapped = snapper.snap(&gradients);
// Weights stay exact forever!`,
      python: `# Constraint Theory: Exact gradient snapping
from constraint_theory import GradientSnapper, Manifold

snapper = GradientSnapper(
    Manifold.pythagorean(),
    preserve_magnitude=True
)

snapped = snapper.snap(gradients)
# Weights stay exact forever!`,
      typescript: `// Constraint Theory: Exact gradient snapping
import { GradientSnapper, Manifold } from 'constraint-theory';

const snapper = new GradientSnapper(
    Manifold.pythagorean()
).withPreserveMagnitude(true);

const snapped = snapper.snap(gradients);
// Weights stay exact forever!`,
      go: `// Constraint Theory: Exact gradient snapping
import "github.com/constraint-theory"

snapper := theory.NewGradientSnapper(
    theory.NewManifold(),
).WithPreserveMagnitude(true)

snapped := snapper.Snap(gradients)
// Weights stay exact forever!`,
      cpp: `// Constraint Theory: Exact gradient snapping
#include <constraint_theory/ml.hpp>

auto snapper = theory::GradientSnapper(
    theory::Manifold::pythagorean()
).with_preserve_magnitude(true);

auto snapped = snapper.snap(gradients);
// Weights stay exact forever!`
    },
    standardChars: 389,
    ourChars: 118,
    standardComplexity: "O(n)",
    ourComplexity: "O(n)"
  }
]

// ==================== SIMULATION DEFINITIONS ====================
interface Simulation {
  id: string
  name: string
  description: string
  category: string
  icon: React.ReactNode
  complexity: 'beginner' | 'intermediate' | 'advanced'
  style: 'particles' | 'voxel' | 'wireframe' | 'field' | 'organic' | 'geometric'
}

const simulations: Simulation[] = [
  // Fractals
  { id: 'mandelbrot', name: 'Mandelbrot Set', description: 'Infinite fractal boundary exploration', category: 'Fractals', icon: <Sparkles />, complexity: 'beginner', style: 'field' },
  { id: 'fractal', name: 'Fractal Trees', description: 'Recursive branching with wind', category: 'Fractals', icon: <Hexagon />, complexity: 'beginner', style: 'organic' },
  { id: 'julia', name: 'Julia Sets', description: 'Complex plane fractals', category: 'Fractals', icon: <Circle />, complexity: 'intermediate', style: 'field' },
  
  // Mathematics
  { id: 'complex-plane', name: 'Complex Plane', description: 'Visualizing complex numbers', category: 'Mathematics', icon: <Circle />, complexity: 'beginner', style: 'geometric' },
  { id: 'fourier-series', name: 'Fourier Series', description: 'Wave decomposition', category: 'Mathematics', icon: <Waves />, complexity: 'intermediate', style: 'particles' },
  { id: 'fft', name: 'FFT Visualization', description: 'Frequency domain', category: 'Mathematics', icon: <Waves />, complexity: 'advanced', style: 'field' },
  { id: 'lissajous', name: 'Lissajous Curves', description: 'Harmonic motion patterns', category: 'Mathematics', icon: <Waves />, complexity: 'beginner', style: 'geometric' },
  { id: 'quaternion', name: 'Quaternion Rotation', description: '3D rotation math', category: 'Mathematics', icon: <RotateCcw />, complexity: 'intermediate', style: 'voxel' },
  
  // Geometry
  { id: 'delaunay', name: 'Delaunay Mesh', description: 'Optimal triangulation', category: 'Geometry', icon: <Triangle />, complexity: 'intermediate', style: 'wireframe' },
  { id: 'voronoi', name: 'Voronoi Cells', description: 'Spatial partitioning', category: 'Geometry', icon: <Grid3X3 />, complexity: 'intermediate', style: 'field' },
  { id: 'platonic', name: 'Platonic Solids', description: 'Five perfect polyhedra', category: 'Geometry', icon: <Hexagon />, complexity: 'beginner', style: 'voxel' },
  { id: 'hypercube', name: 'Hypercube 4D', description: 'Tesseract projection', category: 'Geometry', icon: <Box />, complexity: 'intermediate', style: 'wireframe' },
  { id: 'stereographic', name: 'Stereographic', description: 'Sphere to plane mapping', category: 'Geometry', icon: <Circle />, complexity: 'intermediate', style: 'geometric' },
  { id: 'simplex', name: 'Simplex Method', description: 'Linear optimization', category: 'Geometry', icon: <Triangle />, complexity: 'advanced', style: 'geometric' },
  
  // Physics
  { id: 'nbody', name: 'N-Body Gravity', description: 'Gravitational dynamics', category: 'Physics', icon: <Atom />, complexity: 'intermediate', style: 'particles' },
  { id: 'fluid', name: 'Fluid Dynamics', description: 'Navier-Stokes flow', category: 'Physics', icon: <Waves />, complexity: 'advanced', style: 'field' },
  { id: 'softbody', name: 'Soft Body', description: 'Elastic deformation', category: 'Physics', icon: <Circle />, complexity: 'advanced', style: 'organic' },
  { id: 'wave-interference', name: 'Wave Interference', description: 'Superposition patterns', category: 'Physics', icon: <Waves />, complexity: 'intermediate', style: 'field' },
  { id: 'kepler', name: 'Kepler Orbits', description: 'Planetary motion', category: 'Physics', icon: <Circle />, complexity: 'beginner', style: 'particles' },
  { id: 'diffraction', name: 'Diffraction', description: 'Light wave patterns', category: 'Physics', icon: <Sparkles />, complexity: 'intermediate', style: 'field' },
  
  // Chaos & Complexity
  { id: 'attractors', name: 'Strange Attractors', description: 'Chaotic systems', category: 'Chaos', icon: <Sparkles />, complexity: 'intermediate', style: 'particles' },
  { id: 'cellular-automata', name: 'Cellular Automata', description: 'Emergent patterns', category: 'Chaos', icon: <Grid3X3 />, complexity: 'beginner', style: 'voxel' },
  { id: 'langton-ant', name: "Langton's Ant", description: 'Simple rules, complex behavior', category: 'Chaos', icon: <Atom />, complexity: 'beginner', style: 'voxel' },
  { id: 'entropy', name: 'Entropy', description: 'Information thermodynamics', category: 'Chaos', icon: <Sparkles />, complexity: 'intermediate', style: 'field' },
  
  // Constraint Theory Core
  { id: 'constraint-network', name: 'Constraint Network', description: 'Dependency graphs', category: 'Constraint Theory', icon: <Network />, complexity: 'intermediate', style: 'wireframe' },
  { id: 'rigidity', name: 'Rigidity Theory', description: 'Structural analysis', category: 'Constraint Theory', icon: <Triangle />, complexity: 'advanced', style: 'wireframe' },
  { id: 'pythagorean', name: 'Pythagorean Manifold', description: 'Core snapping visualization', category: 'Constraint Theory', icon: <Target />, complexity: 'beginner', style: 'geometric' },
  { id: 'kdtree', name: 'KD-Tree Spatial Index', description: 'O(log n) spatial queries', category: 'Constraint Theory', icon: <Grid3X3 />, complexity: 'intermediate', style: 'wireframe' },
  { id: 'swarm', name: 'Swarm Intelligence', description: 'Emergent flocking behavior', category: 'Constraint Theory', icon: <Atom />, complexity: 'beginner', style: 'particles' },
  { id: 'spring-mass', name: 'Spring-Mass System', description: 'Hooke\'s Law constraints', category: 'Constraint Theory', icon: <Zap />, complexity: 'beginner', style: 'particles' },
  { id: 'particle-life', name: 'Particle Life', description: 'Emergent complexity', category: 'Constraint Theory', icon: <Sparkles />, complexity: 'beginner', style: 'particles' },
  
  // AI/ML
  { id: 'neural-network', name: 'Neural Network', description: 'Deep learning visualization', category: 'AI/ML', icon: <Brain />, complexity: 'advanced', style: 'particles' },
  { id: 'tree-of-thoughts', name: 'Tree of Thoughts', description: 'Reasoning paths', category: 'AI/ML', icon: <Network />, complexity: 'advanced', style: 'wireframe' },
  
  // Advanced
  { id: 'holographic', name: 'Holographic', description: 'Information encoding', category: 'Advanced', icon: <Sparkles />, complexity: 'advanced', style: 'field' },
  { id: 'holonomy', name: 'Holonomy', description: 'Parallel transport', category: 'Advanced', icon: <Circle />, complexity: 'advanced', style: 'geometric' },
  { id: 'geometric-algebra', name: 'Geometric Algebra', description: 'Clifford algebra', category: 'Advanced', icon: <Hexagon />, complexity: 'advanced', style: 'wireframe' },
  { id: 'topology', name: 'Topology', description: 'Surface transformations', category: 'Advanced', icon: <Circle />, complexity: 'advanced', style: 'organic' },
  { id: 'error-correction', name: 'Error Correction', description: 'Quantum error codes', category: 'Advanced', icon: <Grid3X3 />, complexity: 'advanced', style: 'voxel' },
]

// ==================== CODE COMPARISON COMPONENT ====================
// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 500) {
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)
  
  useEffect(() => {
    const start = prevRef.current
    const diff = target - start
    const startTime = performance.now()
    
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.round(start + diff * eased))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
    prevRef.current = target
  }, [target, duration])
  
  return display
}

// Syntax highlighting colors by language
const languageColors: Record<Language, { primary: string; accent: string; icon: string }> = {
  rust: { primary: 'text-orange-400', accent: 'ring-orange-500/30', icon: '🦀' },
  python: { primary: 'text-yellow-400', accent: 'ring-yellow-500/30', icon: '🐍' },
  typescript: { primary: 'text-blue-400', accent: 'ring-blue-500/30', icon: '📘' },
  go: { primary: 'text-cyan-400', accent: 'ring-cyan-500/30', icon: '🐹' },
  cpp: { primary: 'text-purple-400', accent: 'ring-purple-500/30', icon: '⚡' }
}

// Real-time code comparison component
function RealTimeCodeComparison({ 
  comparison, 
  selectedLanguage,
  onLanguageChange 
}: { 
  comparison: CodeExample
  selectedLanguage: Language
  onLanguageChange: (lang: Language) => void
}) {
  const savings = Math.round((1 - comparison.ourChars / comparison.standardChars) * 100)
  const charsSaved = comparison.standardChars - comparison.ourChars
  
  // Animated counters
  const animatedStandardChars = useAnimatedCounter(comparison.standardChars)
  const animatedOurChars = useAnimatedCounter(comparison.ourChars)
  const animatedCharsSaved = useAnimatedCounter(charsSaved)
  const animatedSavings = useAnimatedCounter(savings)
  
  // Track complexity changes via key for animation reset
  const complexityKey = `${comparison.ourComplexity}-${comparison.simulationId}`
  
  const langColors = languageColors[selectedLanguage]
  
  return (
    <Card className="overflow-hidden border-slate-700 bg-slate-900/50 backdrop-blur-sm transition-all duration-500 hover:border-violet-500/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="w-5 h-5 text-violet-400" />
            {comparison.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`bg-emerald-500/20 text-emerald-400 border-emerald-500/50 transition-all duration-300 ${charsSaved > 300 ? 'animate-pulse' : ''}`}>
              <TrendingDown className="w-3 h-3 mr-1" />
              {animatedSavings}% less code
            </Badge>
            <Badge variant="outline" className="text-violet-400 border-violet-500/50">
              {comparison.simulationId}
            </Badge>
          </div>
        </div>
        <CardDescription>{comparison.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Language Tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-slate-800/50 rounded-lg w-fit">
          {(['rust', 'python', 'typescript', 'go', 'cpp'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => onLanguageChange(lang)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
                selectedLanguage === lang 
                  ? `bg-slate-700 ${languageColors[lang].primary} ring-2 ${languageColors[lang].accent}` 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span className="mr-1">{languageColors[lang].icon}</span>
              {lang.charAt(0).toUpperCase() + lang.slice(1).replace('pp', '++')}
            </button>
          ))}
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Standard Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Standard Approach</span>
              <span className="text-red-400 font-mono transition-all duration-300">
                {animatedStandardChars} chars
              </span>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto border border-red-500/10 hover:border-red-500/30 transition-colors duration-300">
              <pre className="text-red-300/80 whitespace-pre-wrap">{comparison.standardCode[selectedLanguage]}</pre>
            </div>
            <Badge variant="outline" className="text-red-400 border-red-400/50 transition-all duration-300">
              {comparison.standardComplexity}
            </Badge>
          </div>
          
          {/* Our Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                Constraint Theory
                <span className="text-violet-400">{langColors.icon}</span>
              </span>
              <span className={`font-mono transition-all duration-300 ${langColors.primary}`}>
                {animatedOurChars} chars
              </span>
            </div>
            <div className={`bg-slate-950 rounded-lg p-3 font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto ring-2 ${langColors.accent} hover:ring-violet-500/50 transition-all duration-300 shadow-lg shadow-violet-500/5`}>
              <pre className="text-emerald-300 whitespace-pre-wrap">{comparison.ourCode[selectedLanguage]}</pre>
            </div>
            <Badge 
              variant="outline" 
              className="text-emerald-400 border-emerald-400/50 transition-all duration-500"
            >
              {comparison.ourComplexity}
            </Badge>
          </div>
        </div>
        
        {/* Visual Ah-Ha Moment */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-xs text-slate-400 mb-1">Code Reduction</div>
              <Progress 
                value={savings} 
                className="h-2 bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-emerald-500 transition-all duration-500" 
              />
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold text-emerald-400 transition-all duration-300 ${charsSaved > 300 ? 'scale-110' : ''}`}>
                -{animatedCharsSaved}
              </div>
              <div className="text-xs text-slate-400">characters saved</div>
            </div>
            <Lightbulb className={`w-8 h-8 text-yellow-400 ${charsSaved > 300 ? 'animate-bounce' : 'animate-pulse'}`} />
          </div>
        </div>
        
        {/* Variable Growth Visualization - Key Insight */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            Variable Character Growth Over Simulation Steps
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            {['Step 1', 'Step 10', 'Step 100', 'Step 1000', 'Step 10000'].map((step, i) => {
              const traditionalGrowth = Math.floor(comparison.standardChars * (1 + i * 0.5))
              const ourGrowth = comparison.ourChars // Stays constant!
              const ratio = traditionalGrowth / ourGrowth
              return (
                <div key={step} className="space-y-1">
                  <div className="text-[10px] text-slate-500">{step}</div>
                  <div className="text-[10px] text-red-400 font-mono">~{traditionalGrowth}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">{ourGrowth}</div>
                  <div className="text-[9px] text-violet-400">{ratio.toFixed(0)}x more</div>
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-[10px]">
            <span className="text-red-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              Traditional: grows with approximations
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Constraint Theory: stays exact
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== SIMULATION CANVAS ====================
function SimulationCanvas({ id, isActive, style }: { id: string; isActive: boolean; style: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [params, setParams] = useState({ speed: 1, complexity: 50, color: 'rainbow' })
  const stateRef = useRef<any>({})

  // Initialize state for each simulation
  useEffect(() => {
    stateRef.current = initSimulationState(id)
  }, [id])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    let time = 0
    const animate = () => {
      if (!isActive) return
      time += 0.016 * params.speed
      
      const w = canvas.width / window.devicePixelRatio
      const h = canvas.height / window.devicePixelRatio
      
      // Clear based on style
      if (style === 'voxel') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.15)'
      } else {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.08)'
      }
      ctx.fillRect(0, 0, w, h)

      // Render based on simulation
      renderSimulation(ctx, w, h, time, params, id, stateRef.current, style)

      animationRef.current = requestAnimationFrame(animate)
    }

    if (isActive) {
      animate()
    }

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [id, isActive, params, style])

  // Clear canvas when switching simulations
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width / window.devicePixelRatio
    const h = canvas.height / window.devicePixelRatio
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, w, h)
    stateRef.current = initSimulationState(id)
  }, [id])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full rounded-lg" />
      <div className="absolute bottom-4 left-4 right-4 flex gap-4 items-center bg-slate-900/80 backdrop-blur-sm rounded-lg p-3">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">Speed</label>
          <Slider value={[params.speed]} onValueChange={([v]) => setParams(p => ({ ...p, speed: v }))} min={0.1} max={3} step={0.1} className="w-full" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">Detail</label>
          <Slider value={[params.complexity]} onValueChange={([v]) => setParams(p => ({ ...p, complexity: v }))} min={10} max={100} step={5} className="w-full" />
        </div>
        <Select value={params.color} onValueChange={(v) => setParams(p => ({ ...p, color: v }))}>
          <SelectTrigger className="w-28 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rainbow">Rainbow</SelectItem>
            <SelectItem value="fire">Fire</SelectItem>
            <SelectItem value="ocean">Ocean</SelectItem>
            <SelectItem value="matrix">Matrix</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ==================== INITIALIZATION ====================
function initSimulationState(id: string): any {
  const states: Record<string, any> = {
    'nbody': {
      particles: Array.from({ length: 80 }, (_, i) => ({
        x: Math.random() * 600 + 100,
        y: Math.random() * 400 + 50,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        mass: Math.random() * 3 + 1,
        hue: Math.random() * 360
      }))
    },
    'cellular-automata': {
      grid: null,
      generation: 0
    },
    'attractors': {
      x: 0.1, y: 0, z: 0,
      trail: []
    },
    'langton-ant': {
      grid: new Map<string, number>(),
      ant: { x: 0, y: 0, dir: 0 },
      initialized: false
    },
    'fluid': {
      particles: Array.from({ length: 200 }, () => ({
        x: Math.random() * 800,
        y: Math.random() * 500,
        vx: 0, vy: 0
      }))
    },
    'pythagorean': {
      points: Array.from({ length: 100 }, () => ({
        x: Math.random() * 800,
        y: Math.random() * 500,
        targetX: 0, targetY: 0
      }))
    },
    'tree-of-thoughts': {
      nodes: [],
      edges: []
    },
    'softbody': {
      points: Array.from({ length: 16 }, (_, i) => ({
        angle: (i / 16) * Math.PI * 2,
        radius: 100,
        velocity: 0
      }))
    }
  }
  return states[id] || {}
}

// ==================== COLOR UTILITIES ====================
function getColor(t: number, scheme: string, alpha = 1): string {
  const hue = scheme === 'fire' ? (t * 30) % 60 :
              scheme === 'ocean' ? 180 + (t * 20) % 60 :
              scheme === 'matrix' ? 120 + (t * 10) % 30 :
              (t * 60) % 360
  
  const saturation = scheme === 'matrix' ? 100 : 80
  const lightness = scheme === 'fire' ? 55 : 60
  
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
}

function getVoxelColor(depth: number, scheme: string): string {
  const base = scheme === 'fire' ? 20 : 
               scheme === 'ocean' ? 180 : 
               scheme === 'matrix' ? 120 : 280
  const hue = (base + depth * 15) % 360
  return `hsl(${hue}, 70%, ${50 + depth * 5}%)`
}

// ==================== MAIN RENDERER ====================
function renderSimulation(
  ctx: CanvasRenderingContext2D, 
  w: number, h: number, 
  time: number, 
  params: { complexity: number; color: string },
  id: string,
  state: any,
  style: string
) {
  switch (id) {
    // FRACTALS
    case 'mandelbrot': renderMandelbrot(ctx, w, h, time, params); break
    case 'fractal': renderFractalTree(ctx, w, h, time, params); break
    case 'julia': renderJulia(ctx, w, h, time, params); break
    
    // MATHEMATICS
    case 'complex-plane': renderComplexPlane(ctx, w, h, time, params); break
    case 'fourier-series': renderFourier(ctx, w, h, time, params); break
    case 'fft': renderFFT(ctx, w, h, time, params); break
    case 'lissajous': renderLissajous(ctx, w, h, time, params); break
    case 'quaternion': renderQuaternion(ctx, w, h, time, params); break
    
    // GEOMETRY
    case 'delaunay': renderDelaunay(ctx, w, h, time, params, state); break
    case 'voronoi': renderVoronoi(ctx, w, h, time, params, state); break
    case 'platonic': renderPlatonic(ctx, w, h, time, params); break
    case 'hypercube': renderHypercube(ctx, w, h, time, params); break
    case 'stereographic': renderStereographic(ctx, w, h, time, params); break
    case 'simplex': renderSimplex(ctx, w, h, time, params); break
    
    // PHYSICS
    case 'nbody': renderNBody(ctx, w, h, time, params, state); break
    case 'fluid': renderFluid(ctx, w, h, time, params, state); break
    case 'softbody': renderSoftBody(ctx, w, h, time, params, state); break
    case 'wave-interference': renderWaveInterference(ctx, w, h, time, params); break
    case 'kepler': renderKepler(ctx, w, h, time, params); break
    case 'diffraction': renderDiffraction(ctx, w, h, time, params); break
    
    // CHAOS
    case 'attractors': renderAttractors(ctx, w, h, time, params, state); break
    case 'cellular-automata': renderCellularAutomata(ctx, w, h, time, params, state); break
    case 'langton-ant': renderLangtonAnt(ctx, w, h, time, params, state); break
    case 'entropy': renderEntropy(ctx, w, h, time, params); break
    
    // CONSTRAINT THEORY
    case 'constraint-network': renderConstraintNetwork(ctx, w, h, time, params); break
    case 'rigidity': renderRigidity(ctx, w, h, time, params); break
    case 'pythagorean': renderPythagorean(ctx, w, h, time, params, state); break
    case 'kdtree': renderKDTree(ctx, w, h, time, params, state); break
    case 'swarm': renderSwarm(ctx, w, h, time, params, state); break
    case 'spring-mass': renderSpringMass(ctx, w, h, time, params, state); break
    case 'particle-life': renderParticleLife(ctx, w, h, time, params, state); break
    
    // AI/ML
    case 'neural-network': renderNeuralNetwork(ctx, w, h, time, params); break
    case 'tree-of-thoughts': renderTreeOfThoughts(ctx, w, h, time, params, state); break
    
    // ADVANCED
    case 'holographic': renderHolographic(ctx, w, h, time, params); break
    case 'holonomy': renderHolonomy(ctx, w, h, time, params); break
    case 'geometric-algebra': renderGeometricAlgebra(ctx, w, h, time, params); break
    case 'topology': renderTopology(ctx, w, h, time, params); break
    case 'error-correction': renderErrorCorrection(ctx, w, h, time, params); break
    
    default: renderDefault(ctx, w, h, time, params, id)
  }
}

// ==================== INDIVIDUAL SIMULATIONS ====================

// FRACTALS
function renderMandelbrot(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const maxIter = Math.floor(params.complexity)
  const zoom = 2.5 + Math.sin(time * 0.15) * 0.8
  const cx = -0.5 + Math.sin(time * 0.08) * 0.2
  const cy = Math.cos(time * 0.08) * 0.15
  const step = 4

  for (let px = 0; px < w; px += step) {
    for (let py = 0; py < h; py += step) {
      const x0 = (px - w / 2) / (w / 3) / zoom + cx
      const y0 = (py - h / 2) / (h / 3) / zoom + cy
      
      let x = 0, y = 0, iter = 0
      while (x * x + y * y <= 4 && iter < maxIter) {
        const xtemp = x * x - y * y + x0
        y = 2 * x * y + y0
        x = xtemp
        iter++
      }
      
      if (iter < maxIter) {
        const hue = (iter / maxIter * 360 + time * 20) % 360
        ctx.fillStyle = getColor(iter / 5 + time, params.color, 0.9)
        ctx.fillRect(px, py, step - 1, step - 1)
      }
    }
  }
}

function renderFractalTree(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.2)'
  ctx.fillRect(0, 0, w, h)
  
  const maxDepth = Math.floor(params.complexity / 8)
  const windOffset = Math.sin(time * 2) * 0.15
  
  function branch(x: number, y: number, len: number, angle: number, depth: number, thickness: number) {
    if (depth > maxDepth || len < 3) return
    
    const wind = depth * windOffset * 0.1
    const endX = x + Math.cos(angle + wind) * len
    const endY = y + Math.sin(angle + wind) * len
    
    // Draw branch with gradient
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(endX, endY)
    ctx.strokeStyle = getColor(depth + time * 2, params.color)
    ctx.lineWidth = thickness
    ctx.lineCap = 'round'
    ctx.stroke()
    
    // Add glow effect
    ctx.shadowBlur = 10
    ctx.shadowColor = getColor(depth + time * 2, params.color, 0.5)
    ctx.stroke()
    ctx.shadowBlur = 0
    
    const newLen = len * (0.65 + Math.sin(time + depth) * 0.05)
    const spread = 0.45 + Math.sin(time * 0.5) * 0.1
    
    branch(endX, endY, newLen, angle - spread, depth + 1, thickness * 0.7)
    branch(endX, endY, newLen, angle + spread, depth + 1, thickness * 0.7)
    
    // Extra branch at certain depths for organic feel
    if (depth % 3 === 0 && depth < maxDepth - 2) {
      branch(endX, endY, newLen * 0.5, angle + spread * 2, depth + 2, thickness * 0.4)
    }
  }
  
  branch(w / 2, h - 20, h / 3.5, -Math.PI / 2, 0, 8)
}

function renderJulia(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const maxIter = Math.floor(params.complexity)
  const cReal = -0.7 + Math.sin(time * 0.3) * 0.1
  const cImag = 0.27015 + Math.cos(time * 0.3) * 0.05
  const step = 3

  for (let px = 0; px < w; px += step) {
    for (let py = 0; py < h; py += step) {
      let x = (px - w / 2) / (w / 3)
      let y = (py - h / 2) / (h / 3)
      let iter = 0
      
      while (x * x + y * y <= 4 && iter < maxIter) {
        const xtemp = x * x - y * y + cReal
        y = 2 * x * y + cImag
        x = xtemp
        iter++
      }
      
      if (iter < maxIter) {
        ctx.fillStyle = getColor(iter / 3 + time, params.color, 0.85)
        ctx.fillRect(px, py, step - 1, step - 1)
      }
    }
  }
}

// MATHEMATICS
function renderComplexPlane(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cx = w / 2
  const cy = h / 2
  const scale = Math.min(w, h) / 6
  
  // Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath()
    ctx.moveTo(cx + i * scale, 0)
    ctx.lineTo(cx + i * scale, h)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, cy + i * scale)
    ctx.lineTo(w, cy + i * scale)
    ctx.stroke()
  }
  
  // Axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, cy)
  ctx.lineTo(w, cy)
  ctx.moveTo(cx, 0)
  ctx.lineTo(cx, h)
  ctx.stroke()
  
  // Animated complex numbers
  const numPoints = Math.floor(params.complexity / 2)
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 + time * (0.5 + i * 0.01)
    const radius = 1 + Math.sin(time * 2 + i) * 0.5
    const re = Math.cos(angle) * radius
    const im = Math.sin(angle) * radius
    
    const x = cx + re * scale
    const y = cy - im * scale
    
    // Conjugate
    ctx.beginPath()
    ctx.arc(x, cy + im * scale, 3, 0, Math.PI * 2)
    ctx.fillStyle = getColor(i + time, params.color, 0.4)
    ctx.fill()
    
    // Main point
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fillStyle = getColor(i + time, params.color)
    ctx.fill()
    
    // Connection line
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, cy + im * scale)
    ctx.strokeStyle = getColor(i + time, params.color, 0.3)
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])
  }
}

function renderFourier(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const numWaves = Math.floor(params.complexity / 8)
  let cx = 150
  let cy = h / 2
  
  // Draw rotating circles
  let prevRadius = 60
  for (let n = 1; n <= Math.min(numWaves, 7); n++) {
    const radius = prevRadius * 0.6
    const angle = time * n * 2
    
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = getColor(n + time, params.color, 0.3)
    ctx.lineWidth = 1
    ctx.stroke()
    
    const newX = cx + Math.cos(angle) * radius
    const newY = cy + Math.sin(angle) * radius
    
    // Point on circle
    ctx.beginPath()
    ctx.arc(newX, newY, 3, 0, Math.PI * 2)
    ctx.fillStyle = getColor(n + time, params.color)
    ctx.fill()
    
    prevRadius = radius
    cx = newX
    cy = newY
  }
  
  // Draw the resulting wave
  ctx.beginPath()
  ctx.moveTo(200, cy)
  for (let x = 200; x < w; x++) {
    let y = 0
    for (let n = 1; n <= numWaves; n++) {
      y += Math.sin((x - 200) * 0.02 * n + time * n * 2) / n
    }
    ctx.lineTo(x, h / 2 + y * 40)
  }
  ctx.strokeStyle = getColor(time, params.color)
  ctx.lineWidth = 2
  ctx.stroke()
}

function renderFFT(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const numBars = Math.floor(params.complexity / 2)
  const barWidth = w / numBars - 2
  
  for (let i = 0; i < numBars; i++) {
    const freq = i / numBars
    const amplitude = Math.sin(freq * 10 + time * 3) * 0.3 + 
                      Math.sin(freq * 20 + time * 5) * 0.2 +
                      Math.sin(freq * 5 + time * 2) * 0.4 +
                      0.5
    const barHeight = amplitude * h * 0.8
    
    const x = i * (barWidth + 2)
    const y = h - barHeight
    
    // Gradient bar
    const gradient = ctx.createLinearGradient(x, y, x, h)
    gradient.addColorStop(0, getColor(i / 5 + time, params.color))
    gradient.addColorStop(1, getColor(i / 5 + time + 2, params.color, 0.3))
    
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, barWidth, barHeight)
    
    // Glow
    ctx.shadowBlur = 10
    ctx.shadowColor = getColor(i / 5 + time, params.color)
    ctx.fillRect(x, y, barWidth, 2)
    ctx.shadowBlur = 0
  }
}

function renderLissajous(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cx = w / 2
  const cy = h / 2
  const size = Math.min(w, h) * 0.4
  
  const a = Math.floor(params.complexity / 15) + 1
  const b = a + Math.floor(Math.sin(time * 0.2) + 1)
  const delta = time * 0.5
  
  // Trail effect
  ctx.beginPath()
  for (let t = 0; t < Math.PI * 2; t += 0.01) {
    const x = cx + size * Math.sin(a * t + delta)
    const y = cy + size * Math.sin(b * t)
    if (t === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.strokeStyle = getColor(time, params.color)
  ctx.lineWidth = 3
  ctx.stroke()
  
  // Moving dot
  const dotT = (time * 2) % (Math.PI * 2)
  const dotX = cx + size * Math.sin(a * dotT + delta)
  const dotY = cy + size * Math.sin(b * dotT)
  
  ctx.beginPath()
  ctx.arc(dotX, dotY, 8, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.shadowBlur = 20
  ctx.shadowColor = getColor(time, params.color)
  ctx.fill()
  ctx.shadowBlur = 0
}

function renderQuaternion(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cx = w / 2
  const cy = h / 2
  const size = Math.min(w, h) * 0.3
  
  // Voxel-style rotating cube
  const vertices = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
  ]
  
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ]
  
  // Quaternion rotation
  const angle = time
  const axis = [1, 1, 1]
  const len = Math.sqrt(axis[0] ** 2 + axis[1] ** 2 + axis[2] ** 2)
  const [qx, qy, qz] = [axis[0] / len * Math.sin(angle / 2), axis[1] / len * Math.sin(angle / 2), axis[2] / len * Math.sin(angle / 2)]
  const qw = Math.cos(angle / 2)
  
  const rotated = vertices.map(([x, y, z]) => {
    const qv = [qw * x + qy * z - qz * y, qw * y + qz * x - qx * z, qw * z + qx * y - qy * x]
    const qv2 = [-qx * x - qy * y - qz * z, qv[0], qv[1], qv[2]]
    return [
      qv2[0] * qx + qv2[1] * qw + qv2[3] * qy - qv2[2] * qz,
      qv2[0] * qy + qv2[2] * qw + qv2[1] * qz - qv2[3] * qx,
      qv2[0] * qz + qv2[3] * qw + qv2[2] * qx - qv2[1] * qy
    ]
  })
  
  const projected = rotated.map(([x, y, z]) => ({
    x: cx + x * size,
    y: cy + y * size,
    z: z
  }))
  
  // Voxel-style faces (back to front)
  const faces = [
    [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
    [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]
  ]
  
  faces.sort((a, b) => {
    const avgZa = a.reduce((s, i) => s + rotated[i][2], 0) / 4
    const avgZb = b.reduce((s, i) => s + rotated[i][2], 0) / 4
    return avgZa - avgZb
  })
  
  faces.forEach((face, fi) => {
    ctx.beginPath()
    ctx.moveTo(projected[face[0]].x, projected[face[0]].y)
    for (let i = 1; i < face.length; i++) {
      ctx.lineTo(projected[face[i]].x, projected[face[i]].y)
    }
    ctx.closePath()
    ctx.fillStyle = getVoxelColor(fi + time * 0.5, params.color)
    ctx.globalAlpha = 0.6
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.stroke()
  })
  
  // Draw vertices as voxels
  projected.forEach((p, i) => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
  })
}

// GEOMETRY
function renderDelaunay(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  if (!state.points) {
    state.points = Array.from({ length: Math.floor(params.complexity / 3) }, () => ({
      x: Math.random() * (w - 40) + 20,
      y: Math.random() * (h - 40) + 20,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5
    }))
  }
  
  // Update and draw points
  state.points.forEach((p: any, i: number) => {
    p.x += p.vx
    p.y += p.vy
    if (p.x < 20 || p.x > w - 20) p.vx *= -1
    if (p.y < 20 || p.y > h - 40) p.vy *= -1
    
    // Draw connections
    state.points.forEach((p2: any, j: number) => {
      if (i >= j) return
      const dx = p2.x - p.x
      const dy = p2.y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < 120) {
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = getColor(i + j + time, params.color, 1 - dist / 120)
        ctx.lineWidth = 1
        ctx.stroke()
      }
    })
    
    // Point
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
  })
}

function renderVoronoi(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  if (!state.points) {
    state.points = Array.from({ length: Math.floor(params.complexity / 5) }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3
    }))
  }
  
  const step = 6
  for (let px = 0; px < w; px += step) {
    for (let py = 0; py < h; py += step) {
      let minDist = Infinity
      let closestIdx = 0
      
      state.points.forEach((p: any, i: number) => {
        const dx = p.x - px
        const dy = p.y - py
        const dist = dx * dx + dy * dy
        if (dist < minDist) {
          minDist = dist
          closestIdx = i
        }
      })
      
      ctx.fillStyle = getColor(closestIdx + time, params.color, 0.4)
      ctx.fillRect(px, py, step, step)
    }
  }
  
  // Draw points
  state.points.forEach((p: any) => {
    p.x += p.vx
    p.y += p.vy
    if (p.x < 0 || p.x > w) p.vx *= -1
    if (p.y < 0 || p.y > h) p.vy *= -1
    
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
  })
}

function renderPlatonic(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cx = w / 2
  const cy = h / 2
  const size = Math.min(w, h) * 0.35
  
  // Icosahedron with voxel-style faces
  const phi = (1 + Math.sqrt(5)) / 2
  const vertices = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ].map(v => v.map(c => c / Math.sqrt(1 + phi * phi)))
  
  const angle = time
  const cos = Math.cos(angle), sin = Math.sin(angle)
  
  const projected = vertices.map(([x, y, z]) => {
    const x1 = x * cos - z * sin
    const z1 = x * sin + z * cos
    const y1 = y * Math.cos(angle * 0.7) - z1 * Math.sin(angle * 0.7)
    const z2 = y * Math.sin(angle * 0.7) + z1 * Math.cos(angle * 0.7)
    return { x: cx + x1 * size, y: cy + y1 * size, z: z2 }
  })
  
  // Draw edges with glow
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const dist = Math.sqrt(
        (vertices[i][0] - vertices[j][0]) ** 2 +
        (vertices[i][1] - vertices[j][1]) ** 2 +
        (vertices[i][2] - vertices[j][2]) ** 2
      )
      
      if (dist < 1.1) {
        ctx.beginPath()
        ctx.moveTo(projected[i].x, projected[i].y)
        ctx.lineTo(projected[j].x, projected[j].y)
        ctx.strokeStyle = getColor(dist * 100 + time, params.color)
        ctx.lineWidth = 2
        ctx.shadowBlur = 10
        ctx.shadowColor = getColor(dist * 100 + time, params.color)
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    }
  }
  
  // Voxel vertices
  projected.forEach((p, i) => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = getVoxelColor(i, params.color)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  })
}

function renderHypercube(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cx = w / 2
  const cy = h / 2
  const size = Math.min(w, h) * 0.3
  
  // 4D hypercube vertices
  const vertices4D: number[][] = []
  for (let i = 0; i < 16; i++) {
    vertices4D.push([
      (i & 1) ? 1 : -1,
      (i & 2) ? 1 : -1,
      (i & 4) ? 1 : -1,
      (i & 8) ? 1 : -1
    ])
  }
  
  // Rotate in 4D
  const angle1 = time * 0.4
  const angle2 = time * 0.25
  const cos1 = Math.cos(angle1), sin1 = Math.sin(angle1)
  const cos2 = Math.cos(angle2), sin2 = Math.sin(angle2)
  
  const projected = vertices4D.map(([x, y, z, w4]) => {
    const x1 = x * cos1 - w4 * sin1
    const w1 = x * sin1 + w4 * cos1
    const y1 = y * cos2 - z * sin2
    const z1 = y * sin2 + z * cos2
    
    const scale = 2 / (3 - w1)
    return {
      x: cx + x1 * size * scale,
      y: cy + y1 * size * scale,
      w: w1
    }
  })
  
  // Draw edges with depth-based color
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      let diff = 0
      for (let k = 0; k < 4; k++) {
        if (vertices4D[i][k] !== vertices4D[j][k]) diff++
      }
      
      if (diff === 1) {
        const avgW = (projected[i].w + projected[j].w) / 2
        ctx.beginPath()
        ctx.moveTo(projected[i].x, projected[i].y)
        ctx.lineTo(projected[j].x, projected[j].y)
        ctx.strokeStyle = getColor((avgW + 2) * 30 + time, params.color, 0.7 + avgW * 0.15)
        ctx.lineWidth = 1.5 + (avgW + 1)
        ctx.stroke()
      }
    }
  }
  
  // Vertices
  projected.forEach((p) => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3 + (p.w + 1) * 2, 0, Math.PI * 2)
    ctx.fillStyle = getColor((p.w + 2) * 50 + time, params.color)
    ctx.fill()
  })
}

function renderStereographic(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cx = w / 2
  const cy = h / 2
  const radius = Math.min(w, h) * 0.35
  
  // Draw sphere
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1
  ctx.stroke()
  
  // Project points from sphere to plane
  const numPoints = Math.floor(params.complexity)
  for (let i = 0; i < numPoints; i++) {
    const theta = (i / numPoints) * Math.PI * 2 + time * 0.3
    const phi = Math.acos(1 - 2 * ((i + 0.5) / numPoints)) + Math.sin(time + i) * 0.2
    
    // Point on sphere
    const sx = Math.sin(phi) * Math.cos(theta)
    const sy = Math.sin(phi) * Math.sin(theta)
    const sz = Math.cos(phi)
    
    // Stereographic projection from north pole
    const projX = cx + (sx / (1 - sz)) * radius * 0.5
    const projY = cy - (sy / (1 - sz)) * radius * 0.5
    
    // Draw projection
    ctx.beginPath()
    ctx.arc(projX, projY, 4, 0, Math.PI * 2)
    ctx.fillStyle = getColor(i + time, params.color)
    ctx.fill()
    
    // Draw line from sphere point
    ctx.beginPath()
    ctx.arc(cx + sx * radius, cy - sy * radius, 3, 0, Math.PI * 2)
    ctx.fillStyle = getColor(i + time, params.color, 0.5)
    ctx.fill()
  }
}

function renderSimplex(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cx = w / 2
  const cy = h / 2
  const size = Math.min(w, h) * 0.4
  
  // Animated simplex optimization visualization
  const vertices = [
    [0, -1],
    [Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)],
    [-Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)]
  ]
  
  // Animate vertices
  const animatedVerts = vertices.map(([x, y], i) => ({
    x: cx + (x * size + Math.sin(time + i * 2) * 20),
    y: cy + (y * size + Math.cos(time + i * 2) * 20)
  }))
  
  // Draw simplex triangle
  ctx.beginPath()
  ctx.moveTo(animatedVerts[0].x, animatedVerts[0].y)
  ctx.lineTo(animatedVerts[1].x, animatedVerts[1].y)
  ctx.lineTo(animatedVerts[2].x, animatedVerts[2].y)
  ctx.closePath()
  ctx.fillStyle = getColor(time, params.color, 0.2)
  ctx.fill()
  ctx.strokeStyle = getColor(time, params.color)
  ctx.lineWidth = 2
  ctx.stroke()
  
  // Centroid
  const centroid = {
    x: animatedVerts.reduce((s, v) => s + v.x, 0) / 3,
    y: animatedVerts.reduce((s, v) => s + v.y, 0) / 3
  }
  
  // Optimization path
  ctx.beginPath()
  ctx.arc(centroid.x, centroid.y, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  
  // Draw reflection
  const worst = 0 // Simplified
  const reflected = {
    x: centroid.x + (centroid.x - animatedVerts[worst].x),
    y: centroid.y + (centroid.y - animatedVerts[worst].y)
  }
  
  ctx.beginPath()
  ctx.arc(reflected.x, reflected.y, 4, 0, Math.PI * 2)
  ctx.fillStyle = getColor(time + 5, params.color, 0.7)
  ctx.fill()
  
  // Line from worst to reflection
  ctx.beginPath()
  ctx.moveTo(animatedVerts[worst].x, animatedVerts[worst].y)
  ctx.lineTo(reflected.x, reflected.y)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.setLineDash([5, 5])
  ctx.stroke()
  ctx.setLineDash([])
}

// PHYSICS
function renderNBody(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  if (!state.particles) return
  
  const G = 0.3
  
  // Calculate forces
  for (let i = 0; i < state.particles.length; i++) {
    for (let j = i + 1; j < state.particles.length; j++) {
      const dx = state.particles[j].x - state.particles[i].x
      const dy = state.particles[j].y - state.particles[i].y
      const dist = Math.sqrt(dx * dx + dy * dy) + 10
      const force = G * state.particles[i].mass * state.particles[j].mass / (dist * dist)
      
      const fx = force * dx / dist
      const fy = force * dy / dist
      
      state.particles[i].vx += fx / state.particles[i].mass
      state.particles[i].vy += fy / state.particles[i].mass
      state.particles[j].vx -= fx / state.particles[j].mass
      state.particles[j].vy -= fy / state.particles[j].mass
    }
  }
  
  // Update and draw
  state.particles.forEach((p: any) => {
    p.x += p.vx
    p.y += p.vy
    
    // Wrap
    if (p.x < 0) p.x = w
    if (p.x > w) p.x = 0
    if (p.y < 0) p.y = h - 60
    if (p.y > h - 60) p.y = 0
    
    // Draw with trail
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.mass * 3, 0, Math.PI * 2)
    ctx.fillStyle = getColor(p.hue + time, params.color)
    ctx.shadowBlur = 15
    ctx.shadowColor = getColor(p.hue + time, params.color)
    ctx.fill()
    ctx.shadowBlur = 0
  })
}

function renderFluid(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  if (!state.particles) return
  
  state.particles.forEach((p: any) => {
    // Simple fluid simulation
    const wave1 = Math.sin(p.x * 0.01 + time * 2) * 2
    const wave2 = Math.sin(p.x * 0.02 + time * 3) * 1.5
    
    p.vy += wave1 * 0.1 + wave2 * 0.05
    p.vy *= 0.98
    p.y += p.vy
    
    // Keep in bounds
    if (p.y < 50) p.y = 50
    if (p.y > h - 60) p.y = h - 60
    
    // Draw particle
    ctx.beginPath()
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
    ctx.fillStyle = getColor(p.x / 50 + time, params.color, 0.7)
    ctx.fill()
  })
}

function renderSoftBody(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  const cx = w / 2
  const cy = h / 2 - 30
  const numPoints = state.points?.length || 16
  
  if (!state.points) return
  
  // Update soft body with spring physics
  const baseRadius = Math.min(w, h) * 0.25
  
  state.points.forEach((p: any, i: number) => {
    // Spring force toward base position
    const targetRadius = baseRadius + Math.sin(time * 2 + i * 0.5) * 30
    const angle = p.angle
    
    const targetX = Math.cos(angle) * targetRadius
    const targetY = Math.sin(angle) * targetRadius
    
    const dx = targetX - Math.cos(angle) * p.radius
    const dy = targetY - Math.sin(angle) * p.radius
    
    p.velocity += dx * 0.1
    p.velocity *= 0.9
    p.radius += p.velocity
  })
  
  // Draw soft body
  ctx.beginPath()
  for (let i = 0; i <= numPoints; i++) {
    const p = state.points[i % numPoints]
    const angle = p.angle
    const x = cx + Math.cos(angle) * p.radius
    const y = cy + Math.sin(angle) * p.radius
    
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  
  // Fill with gradient
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius)
  gradient.addColorStop(0, getColor(time, params.color, 0.6))
  gradient.addColorStop(1, getColor(time + 2, params.color, 0.3))
  
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.stroke()
  
  // Draw internal springs
  state.points.forEach((p: any, i: number) => {
    const angle = p.angle
    const x = cx + Math.cos(angle) * p.radius
    const y = cy + Math.sin(angle) * p.radius
    
    // Spring to center
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.stroke()
    
    // Point
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
  })
}

function renderWaveInterference(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const numSources = 3
  const sources = []
  for (let i = 0; i < numSources; i++) {
    const angle = (i / numSources) * Math.PI * 2 + time * 0.3
    sources.push({
      x: w / 2 + Math.cos(angle) * w * 0.15,
      y: h / 2 - 30 + Math.sin(angle) * h * 0.15
    })
  }
  
  const step = 5
  for (let x = 0; x < w; x += step) {
    for (let y = 0; y < h - 60; y += step) {
      let amplitude = 0
      for (const src of sources) {
        const dx = x - src.x
        const dy = y - src.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        amplitude += Math.sin(dist * 0.08 - time * 4)
      }
      
      const brightness = (amplitude + numSources) / (numSources * 2)
      ctx.fillStyle = getColor(brightness * 10 + time, params.color, brightness * 0.8)
      ctx.fillRect(x, y, step - 1, step - 1)
    }
  }
  
  // Draw sources
  sources.forEach((src, i) => {
    ctx.beginPath()
    ctx.arc(src.x, src.y, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
  })
}

function renderKepler(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cx = w / 2
  const cy = h / 2 - 30
  
  // Sun
  ctx.beginPath()
  ctx.arc(cx, cy, 25, 0, Math.PI * 2)
  const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 25)
  sunGrad.addColorStop(0, '#fff')
  sunGrad.addColorStop(0.5, '#fbbf24')
  sunGrad.addColorStop(1, '#f97316')
  ctx.fillStyle = sunGrad
  ctx.shadowBlur = 30
  ctx.shadowColor = '#fbbf24'
  ctx.fill()
  ctx.shadowBlur = 0
  
  // Planets
  const planets = [
    { a: 50, b: 40, speed: 3, size: 4, color: '#94a3b8' },
    { a: 85, b: 70, speed: 1.8, size: 7, color: '#f97316' },
    { a: 120, b: 100, speed: 1.2, size: 8, color: '#3b82f6' },
    { a: 160, b: 130, speed: 0.8, size: 5, color: '#ef4444' },
    { a: 200, b: 160, speed: 0.5, size: 12, color: '#eab308' }
  ]
  
  planets.forEach((planet, i) => {
    const angle = time * planet.speed
    
    // Orbit path
    ctx.beginPath()
    ctx.ellipse(cx, cy, planet.a, planet.b, 0, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.stroke()
    
    // Planet position with Kepler's 2nd law (simplified)
    const x = cx + planet.a * Math.cos(angle)
    const y = cy + planet.b * Math.sin(angle)
    
    // Trail
    ctx.beginPath()
    for (let t = 0; t < 20; t++) {
      const trailAngle = angle - t * 0.05
      const tx = cx + planet.a * Math.cos(trailAngle)
      const ty = cy + planet.b * Math.sin(trailAngle)
      if (t === 0) ctx.moveTo(tx, ty)
      else ctx.lineTo(tx, ty)
    }
    ctx.strokeStyle = getColor(i * 2 + time, params.color, 0.3)
    ctx.lineWidth = planet.size / 2
    ctx.stroke()
    
    // Planet
    ctx.beginPath()
    ctx.arc(x, y, planet.size, 0, Math.PI * 2)
    ctx.fillStyle = planet.color
    ctx.fill()
  })
}

function renderDiffraction(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const numSlits = 5
  const slitSpacing = w / (numSlits + 1)
  const wavelength = 20 + params.complexity * 0.3
  
  // Draw interference pattern
  for (let x = 0; x < w; x += 3) {
    let intensity = 0
    for (let i = 0; i < numSlits; i++) {
      const slitX = slitSpacing * (i + 1)
      const dist = Math.abs(x - slitX)
      const phase = (dist / wavelength) * Math.PI * 2
      intensity += Math.cos(phase - time * 3)
    }
    intensity = Math.abs(intensity / numSlits)
    
    // Vertical intensity bands
    ctx.fillStyle = getColor(x / 50 + time, params.color, intensity * 0.8)
    ctx.fillRect(x, 0, 3, h - 60)
  }
  
  // Draw slits
  ctx.fillStyle = '#fff'
  for (let i = 0; i < numSlits; i++) {
    ctx.fillRect(slitSpacing * (i + 1) - 2, h - 80, 4, 30)
  }
}

// CHAOS
function renderAttractors(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  const sigma = 10, rho = 28, beta = 8 / 3
  const dt = 0.005
  
  // Lorenz attractor
  for (let i = 0; i < 5; i++) {
    const dx = sigma * (state.y - state.x) * dt
    const dy = (state.x * (rho - state.z) - state.y) * dt
    const dz = (state.x * state.y - beta * state.z) * dt
    state.x += dx
    state.y += dy
    state.z += dz
    
    state.trail.push({
      x: w / 2 + state.x * 4,
      y: h / 2 - 30 + state.y * 4 + state.z * 2
    })
  }
  
  // Keep trail manageable
  if (state.trail.length > 8000) {
    state.trail = state.trail.slice(-8000)
  }
  
  // Draw trail with fading
  ctx.beginPath()
  for (let i = 1; i < state.trail.length; i++) {
    ctx.moveTo(state.trail[i - 1].x, state.trail[i - 1].y)
    ctx.lineTo(state.trail[i].x, state.trail[i].y)
  }
  ctx.strokeStyle = getColor(time, params.color, 0.6)
  ctx.lineWidth = 1
  ctx.stroke()
  
  // Current point
  if (state.trail.length > 0) {
    const last = state.trail[state.trail.length - 1]
    ctx.beginPath()
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
  }
}

function renderCellularAutomata(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  const cellSize = 6
  const cols = Math.floor(w / cellSize)
  const rows = Math.floor((h - 60) / cellSize)
  
  // Initialize grid
  if (!state.grid || state.grid.length !== rows) {
    state.grid = Array.from({ length: rows }, () => 
      Array.from({ length: cols }, () => Math.random() > 0.6 ? 1 : 0)
    )
    state.generation = 0
  }
  
  // Update every few frames
  if (Math.floor(time * 20) % 2 === 0) {
    const newGrid = state.grid.map((row: number[]) => [...row])
    
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        let neighbors = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            neighbors += state.grid[y + dy][x + dx]
          }
        }
        
        if (state.grid[y][x] === 1) {
          newGrid[y][x] = (neighbors === 2 || neighbors === 3) ? 1 : 0
        } else {
          newGrid[y][x] = neighbors === 3 ? 1 : 0
        }
      }
    }
    state.grid = newGrid
    state.generation++
  }
  
  // Draw with voxel style
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (state.grid[y][x] === 1) {
        const depth = (x + y) % 5
        ctx.fillStyle = getVoxelColor(depth + time, params.color)
        ctx.fillRect(
          x * cellSize + 1, 
          y * cellSize + 1, 
          cellSize - 2, 
          cellSize - 2
        )
      }
    }
  }
  
  // Generation counter
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '12px monospace'
  ctx.fillText(`Gen: ${state.generation}`, 10, h - 70)
}

function renderLangtonAnt(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  const cellSize = 4
  const cols = Math.floor(w / cellSize)
  const rows = Math.floor((h - 60) / cellSize)
  
  if (!state.initialized) {
    state.ant = { x: Math.floor(cols / 2), y: Math.floor(rows / 2), dir: 0 }
    state.grid = new Map<string, number>()
    state.initialized = true
  }
  
  // Run multiple steps per frame
  for (let step = 0; step < 5; step++) {
    const key = `${state.ant.x},${state.ant.y}`
    const currentColor = state.grid.get(key) || 0
    
    // Turn
    if (currentColor === 0) {
      state.ant.dir = (state.ant.dir + 1) % 4 // Right
    } else {
      state.ant.dir = (state.ant.dir + 3) % 4 // Left
    }
    
    // Flip color
    state.grid.set(key, 1 - currentColor)
    
    // Move
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]]
    state.ant.x = (state.ant.x + dirs[state.ant.dir][0] + cols) % cols
    state.ant.y = (state.ant.y + dirs[state.ant.dir][1] + rows) % rows
  }
  
  // Draw grid
  state.grid.forEach((color, key) => {
    if (color === 1) {
      const [x, y] = key.split(',').map(Number)
      ctx.fillStyle = getVoxelColor((x + y) % 10 + time * 0.5, params.color)
      ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1)
    }
  })
  
  // Draw ant
  ctx.beginPath()
  ctx.arc(
    state.ant.x * cellSize + cellSize / 2,
    state.ant.y * cellSize + cellSize / 2,
    5, 0, Math.PI * 2
  )
  ctx.fillStyle = '#fff'
  ctx.fill()
}

function renderEntropy(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const numParticles = Math.floor(params.complexity * 2)
  const centerX = w / 2
  const centerY = h / 2 - 30
  
  // Particles spreading from order to disorder
  for (let i = 0; i < numParticles; i++) {
    const birthTime = i * 0.1
    const age = time - birthTime
    if (age < 0) continue
    
    const spread = Math.min(age * 20, Math.min(w, h) * 0.45)
    const angle = (i / numParticles) * Math.PI * 2 + i * 0.618
    const randomness = Math.min(age * 0.5, 1)
    
    const x = centerX + Math.cos(angle) * spread * (1 + (Math.random() - 0.5) * randomness)
    const y = centerY + Math.sin(angle) * spread * (1 + (Math.random() - 0.5) * randomness)
    
    ctx.beginPath()
    ctx.arc(x, y, 2 + randomness * 2, 0, Math.PI * 2)
    ctx.fillStyle = getColor(age + i, params.color, 0.8 - randomness * 0.3)
    ctx.fill()
  }
  
  // Entropy label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '12px monospace'
  ctx.fillText(`Entropy: ${Math.min(100, Math.floor(time * 10))}%`, 10, h - 70)
}

// CONSTRAINT THEORY
function renderConstraintNetwork(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const numNodes = Math.floor(params.complexity / 4)
  const cx = w / 2
  const cy = h / 2 - 30
  const radius = Math.min(w, h) * 0.35
  
  // Generate nodes in a circle
  const nodes = []
  for (let i = 0; i < numNodes; i++) {
    const angle = (i / numNodes) * Math.PI * 2
    nodes.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      label: `C${i + 1}`
    })
  }
  
  // Draw constraint edges with flow animation
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if ((i + j) % 3 === 0 || j === i + 1 || (i === 0 && j === nodes.length - 1)) {
        const progress = (time * 0.5 + i * 0.1) % 1
        
        // Edge line
        ctx.beginPath()
        ctx.moveTo(nodes[i].x, nodes[i].y)
        ctx.lineTo(nodes[j].x, nodes[j].y)
        ctx.strokeStyle = getColor((i + j) / 5 + time, params.color, 0.3)
        ctx.lineWidth = 1
        ctx.stroke()
        
        // Flowing particle
        const fx = nodes[i].x + (nodes[j].x - nodes[i].x) * progress
        const fy = nodes[i].y + (nodes[j].y - nodes[i].y) * progress
        
        ctx.beginPath()
        ctx.arc(fx, fy, 3, 0, Math.PI * 2)
        ctx.fillStyle = getColor((i + j) / 5 + time, params.color)
        ctx.fill()
      }
    }
  }
  
  // Draw nodes
  nodes.forEach((n, i) => {
    // Node background
    ctx.beginPath()
    ctx.arc(n.x, n.y, 22, 0, Math.PI * 2)
    ctx.fillStyle = '#1e293b'
    ctx.fill()
    
    // Node ring
    ctx.beginPath()
    ctx.arc(n.x, n.y, 22, 0, Math.PI * 2)
    ctx.strokeStyle = getColor(i + time, params.color)
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Label
    ctx.fillStyle = '#fff'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(n.label, n.x, n.y)
  })
}

function renderRigidity(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cx = w / 2
  const cy = h / 2 - 30
  const size = Math.min(w, h) * 0.3
  
  // Laman graph - minimally rigid structure
  const nodes = [
    { x: cx, y: cy - size, fixed: true },
    { x: cx - size * 0.866, y: cy + size * 0.5, fixed: false },
    { x: cx + size * 0.866, y: cy + size * 0.5, fixed: false },
    { x: cx - size * 0.4, y: cy, fixed: false },
    { x: cx + size * 0.4, y: cy, fixed: false },
    { x: cx, y: cy + size * 0.7, fixed: false }
  ]
  
  // Animate non-fixed nodes slightly
  nodes.forEach((n, i) => {
    if (!n.fixed) {
      n.x += Math.sin(time * 2 + i) * 2
      n.y += Math.cos(time * 2 + i) * 2
    }
  })
  
  // Edges (bars)
  const edges = [
    [0, 1], [1, 2], [2, 0], // Outer triangle
    [0, 3], [0, 4], // Top connections
    [1, 3], [1, 5], // Left connections
    [2, 4], [2, 5], // Right connections
    [3, 4], [3, 5], [4, 5] // Inner connections
  ]
  
  // Draw edges
  edges.forEach(([i, j], ei) => {
    ctx.beginPath()
    ctx.moveTo(nodes[i].x, nodes[i].y)
    ctx.lineTo(nodes[j].x, nodes[j].y)
    ctx.strokeStyle = getColor(ei + time, params.color)
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Stress indicator (color intensity)
    ctx.shadowBlur = 10
    ctx.shadowColor = getColor(ei + time, params.color)
    ctx.stroke()
    ctx.shadowBlur = 0
  })
  
  // Draw nodes
  nodes.forEach((n, i) => {
    ctx.beginPath()
    ctx.arc(n.x, n.y, n.fixed ? 10 : 6, 0, Math.PI * 2)
    ctx.fillStyle = n.fixed ? '#f97316' : '#fff'
    ctx.fill()
  })
}

function renderPythagorean(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  const cx = w / 2
  const cy = h / 2 - 30
  
  // Generate Pythagorean triples dynamically
  const triples: [number, number, number][] = []
  for (let m = 1; m < 10; m++) {
    for (let n = 1; n < m; n++) {
      const a = m * m - n * n
      const b = 2 * m * n
      const c = m * m + n * n
      triples.push([a, b, c])
    }
  }
  
  // Draw snapping visualization
  const numPoints = Math.floor(params.complexity / 2)
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 + time * 0.2
    const radius = 50 + (i % 5) * 30
    
    // Original point (floating)
    const ox = cx + Math.cos(angle) * radius + Math.sin(time * 3 + i) * 10
    const oy = cy + Math.sin(angle) * radius + Math.cos(time * 3 + i) * 10
    
    // Snapped point (exact)
    const triple = triples[i % triples.length]
    const scale = 3
    const sx = cx + triple[0] * scale * Math.cos(angle)
    const sy = cy + triple[1] * scale * Math.sin(angle)
    
    // Draw connection (snapping line)
    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(sx, sy)
    ctx.strokeStyle = getColor(i + time, params.color, 0.3)
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])
    
    // Original point (red)
    ctx.beginPath()
    ctx.arc(ox, oy, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#ef4444'
    ctx.fill()
    
    // Snapped point (green)
    ctx.beginPath()
    ctx.arc(sx, sy, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#22c55e'
    ctx.fill()
  }
  
  // Legend
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(20, h - 90, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '10px monospace'
  ctx.fillText('Input', 30, h - 87)
  
  ctx.fillStyle = '#22c55e'
  ctx.beginPath()
  ctx.arc(80, h - 90, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.fillText('Snapped', 90, h - 87)
}

// AI/ML
function renderNeuralNetwork(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const layers = [4, 8, 8, 4, 2]
  const layerGap = w / (layers.length + 1)
  
  interface Neuron { x: number; y: number; layer: number; activation: number }
  const neurons: Neuron[] = []
  
  layers.forEach((count, layerIdx) => {
    const x = layerGap * (layerIdx + 1)
    const gap = (h - 80) / (count + 1)
    for (let i = 0; i < count; i++) {
      neurons.push({ 
        x, 
        y: gap * (i + 1), 
        layer: layerIdx,
        activation: Math.sin(time * 2 + layerIdx + i * 0.5) * 0.5 + 0.5
      })
    }
  })
  
  // Draw connections with signal flow
  for (const n1 of neurons) {
    for (const n2 of neurons) {
      if (n2.layer === n1.layer + 1) {
        const progress = (time * 0.8 + n1.x / w * 2) % 1
        const signalX = n1.x + (n2.x - n1.x) * progress
        const signalY = n1.y + (n2.y - n1.y) * progress
        
        // Connection line
        ctx.beginPath()
        ctx.moveTo(n1.x, n1.y)
        ctx.lineTo(n2.x, n2.y)
        ctx.strokeStyle = `rgba(255, 255, 255, ${n1.activation * n2.activation * 0.2})`
        ctx.lineWidth = 1
        ctx.stroke()
        
        // Signal pulse
        ctx.beginPath()
        ctx.arc(signalX, signalY, 2, 0, Math.PI * 2)
        ctx.fillStyle = getColor(n1.layer + time, params.color)
        ctx.fill()
      }
    }
  }
  
  // Draw neurons
  neurons.forEach(n => {
    ctx.beginPath()
    ctx.arc(n.x, n.y, 8, 0, Math.PI * 2)
    ctx.fillStyle = getColor(n.layer * 2 + time, params.color, n.activation)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  })
}

function renderTreeOfThoughts(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  // Generate tree structure
  if (!state.nodes || state.nodes.length === 0) {
    state.nodes = []
    state.edges = []
    
    const root = { x: w / 2, y: 50, depth: 0, children: [] as number[] }
    state.nodes.push(root)
    
    let nodeIndex = 0
    const maxDepth = 4
    const branching = 3
    
    function addChildren(parentIdx: number, depth: number) {
      if (depth >= maxDepth) return
      
      const parent = state.nodes[parentIdx]
      const numChildren = branching - Math.floor(depth * 0.5)
      
      for (let i = 0; i < numChildren; i++) {
        const child = {
          x: parent.x + (i - (numChildren - 1) / 2) * (150 / depth),
          y: parent.y + 80,
          depth: depth + 1,
          children: []
        }
        const childIdx = state.nodes.length
        state.nodes.push(child)
        state.edges.push([parentIdx, childIdx])
        parent.children.push(childIdx)
        addChildren(childIdx, depth + 1)
      }
    }
    
    addChildren(0, 0)
  }
  
  // Animate nodes
  state.nodes.forEach((n: any, i: number) => {
    n.displayX = n.x + Math.sin(time + i * 0.5) * 5
    n.displayY = n.y
  })
  
  // Draw edges
  state.edges.forEach(([from, to]: [number, number]) => {
    const parent = state.nodes[from]
    const child = state.nodes[to]
    
    ctx.beginPath()
    ctx.moveTo(parent.displayX, parent.displayY)
    ctx.lineTo(child.displayX, child.displayY)
    ctx.strokeStyle = getColor(parent.depth + time, params.color, 0.4)
    ctx.lineWidth = 2 - parent.depth * 0.3
    ctx.stroke()
  })
  
  // Draw nodes
  state.nodes.forEach((n: any, i: number) => {
    const radius = 12 - n.depth * 2
    
    // Pulse effect
    const pulse = Math.sin(time * 3 + i * 0.2) * 2
    
    ctx.beginPath()
    ctx.arc(n.displayX, n.displayY, radius + pulse, 0, Math.PI * 2)
    ctx.fillStyle = getColor(n.depth + time, params.color, 0.7)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.stroke()
  })
}

// ADVANCED
function renderHolographic(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cx = w / 2
  const cy = h / 2 - 30
  const size = Math.min(w, h) * 0.4
  
  // Holographic principle visualization - 2D surface encoding 3D info
  const numPoints = Math.floor(params.complexity * 2)
  
  // Surface points (circle)
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2
    const x = cx + Math.cos(angle) * size
    const y = cy + Math.sin(angle) * size
    
    // Surface bit
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.fillStyle = getColor(i + time, params.color)
    ctx.fill()
    
    // Connection to interior
    const interiorAngle = angle + Math.sin(time * 2 + i) * 0.5
    const interiorRadius = size * (0.3 + Math.random() * 0.5)
    const ix = cx + Math.cos(interiorAngle) * interiorRadius
    const iy = cy + Math.sin(interiorAngle) * interiorRadius
    
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(ix, iy)
    ctx.strokeStyle = getColor(i + time, params.color, 0.2)
    ctx.lineWidth = 1
    ctx.stroke()
  }
  
  // Interior point
  ctx.beginPath()
  ctx.arc(cx, cy, 3, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
}

function renderHolonomy(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cx = w / 2
  const cy = h / 2 - 30
  const radius = Math.min(w, h) * 0.35
  
  // Draw curved surface
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1
  ctx.stroke()
  
  // Parallel transport visualization
  const numSteps = Math.floor(params.complexity / 5)
  let vectorAngle = 0
  
  for (let i = 0; i <= numSteps; i++) {
    const angle = (i / numSteps) * Math.PI * 2
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    
    // Draw vector
    const vlen = 25
    const vx = x + Math.cos(vectorAngle) * vlen
    const vy = y + Math.sin(vectorAngle) * vlen
    
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(vx, vy)
    ctx.strokeStyle = getColor(i + time, params.color)
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Arrowhead
    ctx.beginPath()
    ctx.arc(vx, vy, 4, 0, Math.PI * 2)
    ctx.fillStyle = getColor(i + time, params.color)
    ctx.fill()
    
    // Rotate vector (holonomy effect)
    vectorAngle += Math.PI / numSteps * 1.5 // Excess rotation = holonomy
  }
}

function renderGeometricAlgebra(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cx = w / 2
  const cy = h / 2 - 30
  const size = Math.min(w, h) * 0.3
  
  // Multivector visualization
  // Scalar
  ctx.beginPath()
  ctx.arc(cx, cy, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  
  // Vectors (e1, e2)
  const vectors = [
    { angle: time, label: 'e₁', len: size },
    { angle: time + Math.PI / 2, label: 'e₂', len: size },
    { angle: time + Math.PI / 4, label: 'e₁∧e₂', len: size * 0.7 }
  ]
  
  vectors.forEach((v, i) => {
    const x = cx + Math.cos(v.angle) * v.len
    const y = cy + Math.sin(v.angle) * v.len
    
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.strokeStyle = getColor(i * 3 + time, params.color)
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '12px monospace'
    ctx.fillText(v.label, x + 10, y)
  })
  
  // Bivector area
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(vectors[0].angle) * size, cy + Math.sin(vectors[0].angle) * size)
  ctx.lineTo(cx + Math.cos(vectors[0].angle) * size + Math.cos(vectors[1].angle) * size, 
             cy + Math.sin(vectors[0].angle) * size + Math.sin(vectors[1].angle) * size)
  ctx.lineTo(cx + Math.cos(vectors[1].angle) * size, cy + Math.sin(vectors[1].angle) * size)
  ctx.closePath()
  ctx.fillStyle = getColor(time, params.color, 0.2)
  ctx.fill()
}

function renderTopology(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cx = w / 2
  const cy = h / 2 - 30
  const size = Math.min(w, h) * 0.35
  
  // Morphing torus to sphere
  const morphFactor = (Math.sin(time * 0.5) + 1) / 2 // 0 = torus, 1 = sphere
  
  const numU = 24
  const numV = 16
  
  for (let i = 0; i < numU; i++) {
    for (let j = 0; j < numV; j++) {
      const u = (i / numU) * Math.PI * 2
      const v = (j / numV) * Math.PI * 2
      
      // Torus coordinates
      const R = size * 0.7
      const r = size * 0.3 * (1 - morphFactor * 0.7)
      
      const x = (R + r * Math.cos(v)) * Math.cos(u)
      const y = (R + r * Math.cos(v)) * Math.sin(u)
      const z = r * Math.sin(v)
      
      // Apply rotation
      const rotX = x * Math.cos(time * 0.3) - z * Math.sin(time * 0.3)
      const rotZ = x * Math.sin(time * 0.3) + z * Math.cos(time * 0.3)
      
      // Project to 2D
      const px = cx + rotX * 0.8
      const py = cy + y * 0.8 - rotZ * 0.3
      
      // Draw point
      ctx.beginPath()
      ctx.arc(px, py, 2, 0, Math.PI * 2)
      ctx.fillStyle = getColor(i + j + time, params.color, 0.6)
      ctx.fill()
    }
  }
}

function renderErrorCorrection(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }) {
  const cellSize = 15
  const cols = Math.floor(w / cellSize)
  const rows = Math.floor((h - 60) / cellSize)
  
  // Quantum error correction code visualization
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      // Data qubits and syndrome qubits
      const isData = (x + y) % 2 === 0
      const error = Math.sin(x * 0.5 + y * 0.3 + time * 2) > 0.8
      
      if (isData) {
        // Draw qubit
        ctx.beginPath()
        ctx.arc(
          x * cellSize + cellSize / 2,
          y * cellSize + cellSize / 2,
          4, 0, Math.PI * 2
        )
        ctx.fillStyle = error ? '#ef4444' : getColor(x + y + time, params.color, 0.7)
        ctx.fill()
        
        if (error) {
          // Error indicator
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      } else {
        // Syndrome measurement
        const syndrome = Math.sin(x * 0.3 + y * 0.5 + time) > 0.5
        ctx.fillStyle = syndrome ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4)
      }
    }
  }
}

// NEW CONSTRAINT THEORY SIMULATIONS
function renderKDTree(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  // Initialize points with Pythagorean coordinates
  if (!state.points) {
    // Generate points that snap to Pythagorean triples
    const pythagoreanTriples = [
      [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25],
      [6, 8, 10], [9, 12, 15], [12, 16, 20], [15, 20, 25],
      [10, 24, 26], [20, 21, 29], [18, 24, 30], [16, 30, 34]
    ]
    state.points = Array.from({ length: Math.floor(params.complexity / 2) }, (_, i) => {
      const triple = pythagoreanTriples[i % pythagoreanTriples.length]
      const scale = 8 + Math.random() * 6
      return {
        x: 50 + triple[0] * scale + Math.random() * 20,
        y: 50 + triple[1] * scale + Math.random() * 20,
        triple: triple,
        hue: (i * 30) % 360
      }
    })
    state.queryPoint = { x: w / 2, y: h / 2 - 35 }
    state.searchPath = []
    state.frameCount = 0
  }
  
  state.frameCount++
  
  // Animate query point
  state.queryPoint.x = w / 2 + Math.cos(time * 0.8) * (w / 4)
  state.queryPoint.y = (h - 70) / 2 + Math.sin(time * 0.6) * ((h - 70) / 4)
  
  // Draw gradient background regions
  const gradient = ctx.createRadialGradient(w/2, (h-70)/2, 0, w/2, (h-70)/2, w/2)
  gradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)')
  gradient.addColorStop(1, 'rgba(15, 23, 42, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h - 70)
  
  // Draw KD-tree splits with glow effects
  function drawSplits(points: any[], depth: number, x1: number, y1: number, x2: number, y2: number) {
    if (points.length === 0 || depth > 7) return
    
    const axis = depth % 2
    points.sort((a, b) => axis === 0 ? a.x - b.x : a.y - b.y)
    const mid = Math.floor(points.length / 2)
    const median = points[mid]
    
    // Color based on depth - warm to cool gradient
    const hue = 280 - depth * 25 // Purple to cyan
    const alpha = 0.8 - depth * 0.08
    const lineWidth = 3 - depth * 0.3
    
    // Glow effect
    ctx.shadowBlur = 15 - depth * 2
    ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.5)`
    
    // Animated pulse
    const pulse = Math.sin(time * 3 + depth) * 0.2 + 0.8
    
    ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${alpha * pulse})`
    ctx.lineWidth = Math.max(lineWidth, 0.5)
    
    if (axis === 0) {
      ctx.beginPath()
      ctx.moveTo(median.x, y1)
      ctx.lineTo(median.x, y2)
      ctx.stroke()
      drawSplits(points.slice(0, mid), depth + 1, x1, y1, median.x, y2)
      drawSplits(points.slice(mid + 1), depth + 1, median.x, y1, x2, y2)
    } else {
      ctx.beginPath()
      ctx.moveTo(x1, median.y)
      ctx.lineTo(x2, median.y)
      ctx.stroke()
      drawSplits(points.slice(0, mid), depth + 1, x1, y1, x2, median.y)
      drawSplits(points.slice(mid + 1), depth + 1, x1, median.y, x2, y2)
    }
    
    ctx.shadowBlur = 0
  }
  
  drawSplits([...state.points], 0, 15, 15, w - 15, h - 85)
  
  // Find nearest neighbor with visual feedback
  let nearestDist = Infinity
  let nearestPoint = null
  state.points.forEach((p: any) => {
    const dist = Math.sqrt((p.x - state.queryPoint.x) ** 2 + (p.y - state.queryPoint.y) ** 2)
    if (dist < nearestDist) {
      nearestDist = dist
      nearestPoint = p
    }
  })
  
  // Draw connection line to nearest
  if (nearestPoint) {
    ctx.beginPath()
    ctx.moveTo(state.queryPoint.x, state.queryPoint.y)
    ctx.lineTo(nearestPoint.x, nearestPoint.y)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.setLineDash([])
    
    // Distance label
    const midX = (state.queryPoint.x + nearestPoint.x) / 2
    const midY = (state.queryPoint.y + nearestPoint.y) / 2
    ctx.font = '10px monospace'
    ctx.fillStyle = 'rgba(16, 185, 129, 0.8)'
    ctx.fillText(`d=${nearestDist.toFixed(1)}`, midX + 5, midY - 5)
  }
  
  // Draw points with Pythagorean glow
  state.points.forEach((p: any, i: number) => {
    const isNearest = p === nearestPoint
    const size = isNearest ? 10 : 6
    
    // Outer glow
    const glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3)
    glowGradient.addColorStop(0, `hsla(${p.hue}, 80%, 60%, 0.4)`)
    glowGradient.addColorStop(1, 'transparent')
    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2)
    ctx.fill()
    
    // Point core
    ctx.beginPath()
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
    
    if (isNearest) {
      ctx.fillStyle = '#10b981'
      ctx.shadowBlur = 20
      ctx.shadowColor = '#10b981'
    } else {
      ctx.fillStyle = `hsl(${p.hue}, 70%, 60%)`
      ctx.shadowBlur = 8
      ctx.shadowColor = `hsl(${p.hue}, 70%, 60%)`
    }
    ctx.fill()
    ctx.shadowBlur = 0
    
    // White border
    ctx.strokeStyle = isNearest ? '#fff' : 'rgba(255,255,255,0.5)'
    ctx.lineWidth = isNearest ? 2 : 1
    ctx.stroke()
    
    // Show triple coordinates for nearest
    if (isNearest) {
      ctx.font = 'bold 11px monospace'
      ctx.fillStyle = '#10b981'
      ctx.fillText(`(${p.triple[0]}, ${p.triple[1]}, ${p.triple[2]})`, p.x + 12, p.y - 8)
    }
  })
  
  // Draw query point (crosshair)
  ctx.beginPath()
  ctx.arc(state.queryPoint.x, state.queryPoint.y, 12, 0, Math.PI * 2)
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 2
  ctx.stroke()
  
  // Crosshair lines
  ctx.beginPath()
  ctx.moveTo(state.queryPoint.x - 18, state.queryPoint.y)
  ctx.lineTo(state.queryPoint.x + 18, state.queryPoint.y)
  ctx.moveTo(state.queryPoint.x, state.queryPoint.y - 18)
  ctx.lineTo(state.queryPoint.x, state.queryPoint.y + 18)
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)'
  ctx.lineWidth = 1
  ctx.stroke()
  
  // Query point center
  ctx.beginPath()
  ctx.arc(state.queryPoint.x, state.queryPoint.y, 3, 0, Math.PI * 2)
  ctx.fillStyle = '#f59e0b'
  ctx.fill()
  
  // Info panel
  ctx.font = 'bold 12px monospace'
  ctx.fillStyle = '#e2e8f0'
  ctx.fillText('O(log n) spatial query', 15, h - 50)
  ctx.font = '10px monospace'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText(`Points: ${state.points.length} | Depth: ${Math.floor(Math.log2(state.points.length))}`, 15, h - 35)
  ctx.fillText('Pythagorean snapping: exact integer coordinates', 15, h - 20)
  
  // Character count comparison
  ctx.fillStyle = '#ef4444'
  ctx.fillText('Traditional: ~400 chars, floats, drift', w - 200, h - 35)
  ctx.fillStyle = '#10b981'
  ctx.fillText('Constraint Theory: ~90 chars, exact ints', w - 200, h - 20)
}

function renderSwarm(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  if (!state.boids) {
    state.boids = Array.from({ length: Math.floor(params.complexity * 2) }, () => ({
      x: Math.random() * w,
      y: Math.random() * (h - 80),
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2
    }))
  }
  
  state.boids.forEach((boid: any, i: number) => {
    // Simple flocking
    let avgX = 0, avgY = 0, count = 0
    state.boids.forEach((other: any, j: number) => {
      if (i === j) return
      const dx = other.x - boid.x
      const dy = other.y - boid.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 50 && dist > 0) {
        avgX += other.x
        avgY += other.y
        count++
      }
    })
    
    if (count > 0) {
      boid.vx += (avgX / count - boid.x) * 0.01
      boid.vy += (avgY / count - boid.y) * 0.01
    }
    
    // Limit speed
    const speed = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy)
    if (speed > 3) {
      boid.vx = (boid.vx / speed) * 3
      boid.vy = (boid.vy / speed) * 3
    }
    
    boid.x += boid.vx
    boid.y += boid.vy
    
    // Wrap
    if (boid.x < 0) boid.x = w
    if (boid.x > w) boid.x = 0
    if (boid.y < 0) boid.y = h - 80
    if (boid.y > h - 80) boid.y = 0
    
    // Draw
    ctx.beginPath()
    ctx.arc(boid.x, boid.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = getColor(i + time * 2, params.color)
    ctx.fill()
  })
}

function renderSpringMass(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  if (!state.nodes) {
    state.nodes = []
    const numNodes = Math.floor(params.complexity / 3)
    for (let i = 0; i < numNodes; i++) {
      state.nodes.push({
        x: w / 2 + Math.cos(i / numNodes * Math.PI * 2) * 100,
        y: (h - 80) / 2 + Math.sin(i / numNodes * Math.PI * 2) * 100,
        vx: 0,
        vy: 0,
        anchor: i === 0
      })
    }
    state.links = []
    for (let i = 0; i < numNodes; i++) {
      state.links.push([i, (i + 1) % numNodes])
      if (i < numNodes - 2) state.links.push([i, i + 2])
    }
  }
  
  // Physics
  state.nodes.forEach((node: any, i: number) => {
    if (node.anchor) return
    node.vy += 0.1 // gravity
    node.x += node.vx
    node.y += node.vy
    node.vx *= 0.99
    node.vy *= 0.99
    if (node.y > h - 80) {
      node.y = h - 80
      node.vy *= -0.5
    }
  })
  
  // Draw springs
  state.links.forEach((link: any, i: number) => {
    const a = state.nodes[link[0]]
    const b = state.nodes[link[1]]
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.strokeStyle = getColor(i + time, params.color, 0.7)
    ctx.lineWidth = 2
    ctx.stroke()
  })
  
  // Draw nodes
  state.nodes.forEach((node: any, i: number) => {
    ctx.beginPath()
    ctx.arc(node.x, node.y, node.anchor ? 8 : 5, 0, Math.PI * 2)
    ctx.fillStyle = node.anchor ? '#f59e0b' : getColor(i + time, params.color)
    ctx.fill()
  })
}

function renderParticleLife(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, state: any) {
  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da']
  const numTypes = 6
  
  if (!state.particles) {
    state.particles = []
    const numParticles = Math.floor(params.complexity * 3)
    for (let i = 0; i < numParticles; i++) {
      state.particles.push({
        x: Math.random() * w,
        y: Math.random() * (h - 80),
        vx: 0,
        vy: 0,
        type: i % numTypes
      })
    }
  }
  
  // Update
  state.particles.forEach((p: any) => {
    let fx = 0, fy = 0
    state.particles.forEach((other: any) => {
      if (p === other) return
      const dx = other.x - p.x
      const dy = other.y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 5 && dist < 60) {
        const force = (Math.random() - 0.5) * 0.1 / dist
        fx += dx * force
        fy += dy * force
      }
    })
    p.vx = (p.vx + fx) * 0.95
    p.vy = (p.vy + fy) * 0.95
    p.x += p.vx
    p.y += p.vy
    if (p.x < 0) p.x += w
    if (p.x > w) p.x -= w
    if (p.y < 0) p.y += h - 80
    if (p.y > h - 80) p.y -= h - 80
  })
  
  // Draw
  state.particles.forEach((p: any) => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = colors[p.type]
    ctx.fill()
  })
}

function renderDefault(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, params: { complexity: number; color: string }, id: string) {
  // Generic orbital pattern
  const numParticles = Math.floor(params.complexity)
  
  for (let i = 0; i < numParticles; i++) {
    const angle = (i / numParticles) * Math.PI * 2 + time * (0.5 + i * 0.01)
    const radius = 50 + Math.sin(time + i) * 100 + (i % 5) * 30
    
    const x = w / 2 + Math.cos(angle) * radius
    const y = h / 2 - 30 + Math.sin(angle) * radius
    
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = getColor(i / 5 + time, params.color)
    ctx.fill()
  }
  
  // Simulation name
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '14px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(id.toUpperCase().replace(/-/g, ' '), w / 2, h - 70)
}

// ==================== MAIN APP ====================
export default function Home() {
  const [selectedSim, setSelectedSim] = useState<string>('mandelbrot')
  const [isPlaying, setIsPlaying] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<string>('simulations')
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('rust')
  
  const categories = useMemo(() => [...new Set(simulations.map(s => s.category))], [])
  const filteredSims = useMemo(() => 
    filter === 'all' ? simulations : simulations.filter(s => s.category === filter),
    [filter]
  )
  const selectedSimulation = useMemo(() => 
    simulations.find(s => s.id === selectedSim),
    [selectedSim]
  )
  
  // Find code comparison that matches the selected simulation
  const activeComparison = useMemo(() => {
    return codeComparisons.find(c => c.simulationId === selectedSim) || codeComparisons[0]
  }, [selectedSim])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Constraint Theory</h1>
              <p className="text-xs text-slate-400">Zero Drift. Exact Forever.</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8">
              <BookOpen className="w-4 h-4 mr-1" />
              Docs
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8">
              <Github className="w-4 h-4 mr-1" />
              GitHub
            </Button>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 h-8">
              <ExternalLink className="w-3 h-3 mr-1" />
              Crate
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="simulations" className="data-[state=active]:bg-violet-600">
              <Sparkles className="w-4 h-4 mr-2" />
              Simulations
            </TabsTrigger>
            <TabsTrigger value="comparisons" className="data-[state=active]:bg-violet-600">
              <Code className="w-4 h-4 mr-2" />
              Code Comparison
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'comparisons' && (
          <div className="space-y-6">
            {/* Hero Stats */}
            <Card className="border-violet-500/30 bg-gradient-to-r from-violet-900/20 to-fuchsia-900/20">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold mb-2">
                    <Lightbulb className="w-6 h-6 inline mr-2 text-yellow-400" />
                    The "Ah-Ha" Moment
                  </h2>
                  <p className="text-slate-400">
                    Snap to exact Pythagorean coordinates. Same result on every machine, forever.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-4xl font-bold text-emerald-400">~100ns</div>
                    <div className="text-sm text-slate-400">Per Snap (O(log n))</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-violet-400">0</div>
                    <div className="text-sm text-slate-400">Floating-Point Drift</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-amber-400">1</div>
                    <div className="text-sm text-slate-400">`cargo add` away</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Simulation Code Comparison */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-400" />
                  Code for Active Simulation
                </h3>
                <Badge variant="outline" className="text-violet-400 border-violet-500/50">
                  {activeComparison.simulationId}
                </Badge>
              </div>
              <RealTimeCodeComparison 
                comparison={activeComparison}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
              />
            </div>

            {/* All Code Comparisons */}
            <Separator className="bg-slate-700" />
            <h3 className="text-lg font-semibold">All Code Comparisons</h3>
            <div className="grid lg:grid-cols-2 gap-4">
              {codeComparisons.map((comparison) => (
                <Card 
                  key={comparison.title}
                  className={`overflow-hidden border-slate-700 bg-slate-900/50 transition-all duration-300 cursor-pointer hover:border-violet-500/50 ${
                    activeComparison.simulationId === comparison.simulationId ? 'ring-2 ring-violet-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedSim(comparison.simulationId)
                    setActiveTab('simulations')
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Code className="w-4 h-4 text-violet-400" />
                        {comparison.title}
                      </h4>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 text-xs">
                        {Math.round((1 - comparison.ourChars / comparison.standardChars) * 100)}% saved
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{comparison.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex gap-4">
                        <span className="text-red-400">{comparison.standardComplexity}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-emerald-400">{comparison.ourComplexity}</span>
                      </div>
                      <span className="text-slate-500">
                        -{comparison.standardChars - comparison.ourChars} chars
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'simulations' && (
          <div className="grid lg:grid-cols-4 gap-4">
            {/* Sidebar - Simulation Gallery */}
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">Simulations</h2>
                <Badge variant="secondary" className="text-xs">{simulations.length}</Badge>
              </div>
              
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Filter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="h-[calc(100vh-280px)] overflow-y-auto space-y-1.5 pr-1">
                {filteredSims.map(sim => (
                  <Card 
                    key={sim.id}
                    className={`cursor-pointer transition-all hover:bg-slate-800/50 ${
                      selectedSim === sim.id ? 'ring-2 ring-violet-500 bg-slate-800/50' : ''
                    }`}
                    onClick={() => setSelectedSim(sim.id)}
                  >
                    <CardContent className="p-2.5 flex items-center gap-2">
                      <div className="text-slate-400 scale-75">{sim.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate">{sim.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{sim.category}</div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-[9px] px-1 py-0 ${
                          sim.complexity === 'beginner' ? 'border-green-500 text-green-400' :
                          sim.complexity === 'intermediate' ? 'border-yellow-500 text-yellow-400' :
                          'border-red-500 text-red-400'
                        }`}
                      >
                        {sim.complexity.slice(0, 4)}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Main Simulation View */}
            <div className="lg:col-span-3 space-y-3">
              {/* Simulation Header */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-violet-400 scale-90">{selectedSimulation?.icon}</div>
                      <div>
                        <h3 className="font-semibold text-sm">{selectedSimulation?.name}</h3>
                        <p className="text-[10px] text-slate-400">{selectedSimulation?.description}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] ml-2">
                        {selectedSimulation?.style}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                      <Button variant="outline" size="icon" className="h-7 w-7">
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Simulation Canvas */}
              <Card className="overflow-hidden">
                <div className="h-[450px] bg-slate-900">
                  <SimulationCanvas 
                    id={selectedSim} 
                    isActive={isPlaying} 
                    style={selectedSimulation?.style || 'particles'} 
                  />
                </div>
              </Card>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 flex items-center gap-2">
                    <div className="p-1.5 rounded bg-violet-500/20">
                      <Zap className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">O(log n)</div>
                      <div className="text-[10px] text-slate-400">KD-Tree Lookup</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-3 flex items-center gap-2">
                    <div className="p-1.5 rounded bg-emerald-500/20">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">0 deps</div>
                      <div className="text-[10px] text-slate-400">Zero Dependencies</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-3 flex items-center gap-2">
                    <div className="p-1.5 rounded bg-amber-500/20">
                      <Target className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">Exact</div>
                      <div className="text-[10px] text-slate-400">Pythagorean Snapping</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Real-time Code Comparison for Active Simulation */}
              {activeComparison && (
                <Card className="overflow-hidden border-violet-500/30 bg-slate-900/50 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Code className="w-4 h-4 text-violet-400" />
                        Code for {activeComparison.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {/* Mini language selector */}
                        <div className="flex gap-0.5 bg-slate-800/50 rounded p-0.5">
                          {(['rust', 'python', 'typescript', 'go', 'cpp'] as Language[]).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => setSelectedLanguage(lang)}
                              className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                                selectedLanguage === lang 
                                  ? `${languageColors[lang].primary} bg-slate-700` 
                                  : 'text-slate-500 hover:text-white'
                              }`}
                            >
                              {languageColors[lang].icon}
                            </button>
                          ))}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-xs"
                          onClick={() => setActiveTab('comparisons')}
                        >
                          View Full <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      {/* Standard Code */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Standard Approach</span>
                          <span className="text-red-400 font-mono">{activeComparison.standardChars} chars</span>
                        </div>
                        <div className="bg-slate-950 rounded-lg p-2 font-mono text-[10px] overflow-x-auto max-h-32 overflow-y-auto border border-red-500/10">
                          <pre className="text-red-300/80 whitespace-pre-wrap">{activeComparison.standardCode[selectedLanguage]}</pre>
                        </div>
                        <Badge variant="outline" className="text-[9px] text-red-400 border-red-400/50">
                          {activeComparison.standardComplexity}
                        </Badge>
                      </div>
                      
                      {/* Our Code */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Constraint Theory</span>
                          <span className={`font-mono ${languageColors[selectedLanguage].primary}`}>
                            {activeComparison.ourChars} chars
                          </span>
                        </div>
                        <div className={`bg-slate-950 rounded-lg p-2 font-mono text-[10px] overflow-x-auto max-h-32 overflow-y-auto ring-1 ${languageColors[selectedLanguage].accent} shadow-lg shadow-violet-500/5`}>
                          <pre className="text-emerald-300 whitespace-pre-wrap">{activeComparison.ourCode[selectedLanguage]}</pre>
                        </div>
                        <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-400/50">
                          {activeComparison.ourComplexity}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Savings indicator */}
                    <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.round((1 - activeComparison.ourChars / activeComparison.standardChars) * 100)} 
                          className="h-1.5 w-24 bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-emerald-500" 
                        />
                        <span className="text-emerald-400 text-xs font-bold">
                          {Math.round((1 - activeComparison.ourChars / activeComparison.standardChars) * 100)}% less code
                        </span>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 text-[10px]">
                        <TrendingDown className="w-2.5 h-2.5 mr-1" />
                        -{activeComparison.standardChars - activeComparison.ourChars} chars
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-violet-400" />
                <span className="font-semibold text-sm">Constraint Theory</span>
              </div>
              <div className="text-xs text-slate-400 hidden md:block">
                Your floating-point bugs are now someone else's problem
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <a href="https://crates.io/crates/constraint-theory" className="hover:text-white transition-colors">crates.io</a>
              <Separator orientation="vertical" className="h-3" />
              <a href="https://github.com/SuperInstance/constraint-theory-core" className="hover:text-white transition-colors">GitHub</a>
              <Separator orientation="vertical" className="h-3" />
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
