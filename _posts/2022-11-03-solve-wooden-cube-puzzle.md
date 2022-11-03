---
title:  "Solving a Wooden Cube Puzzle"
categories: [Experiment]
---

![Logo](/assets/images/cube-done.jpeg)

## Overview

My father has a passion for crafting various things out of wood. He also likes puzzles and recently decided to make a bunch of 3x3 wooden cubes, 6-7 pieces each. Since he randomly chose the pieces shapes, of course I could find no solution online for any of the cubes. After trying, unsuccessfully 😊, to solve them for a few days, I decided to write my own generic solver.

<img src="/assets/images/cube-pieces.jpeg" alt="cube pieces un-done" class="figure-body">

## Research 

The first thing I had to figure out was how to actually plot 3D pieces and play with them in different positions - rotate and translate then around. To generate a volumetric plot, I found out that [matplotlib](https://matplotlib.org/stable/gallery/mplot3d/voxels.html) is actually really easy to use and well documented. After playing around with some code from the docs, I had a PoC that could create pieces and plot them together nicely with different colours. 

Great! Now about on to perform the different transformations. Translations are very easy - simply increase or decrease x, y or z coordinates. For rotations, I used the [basic rotation matrixes](https://en.wikipedia.org/wiki/Rotation_matrix) for 3 dimensions: 

<img src="/assets/images/rotations-colour.png" alt="3D rotation matrices" class="figure-body">

Next I did some research to see what other solvers are out there. The only other working one I could find is the [Wooden cube C solver](https://github.com/RONRON2904/WoodenCubeSolver). Written in C, this is lightning fast and I quickly tested it against my 2 different cube configurations. It solved both of them instantaneously. Awesome! The code is very long (it's C. Did I mention taht already?), but structured and well written. I actually wanted to understand and learn something so I decided to code my own solver in Python.

The project has 2 main important chunks: generating all the possible transformations for each piece and them brute-forcing a solution. I thinkered a bit with a few iterations of the function that searches for a solution, and setteld with a different variant but I've optimised that to perform well even on a high level language like Python, with the advantage that I got a much shorter code (less than 200 lines in total, including the graphics display functionaity), cleaner and easier to understand (I hope).

## Coding
- np array 
- Plottint function
  . plot function
- transformations
 . rotations + translations
- Clean functional code
  . # Rotate a piece a number of times
rotate = lambda coords, axis, times: np.dot(coords, matrix_power(R[axis], times))

- findSolution

## Optimisations
- add pieces in order of size, from biggest/ one with least possibilities
- isin optimisation to get the solution in a few seconds
 - numpy arrays vs python lists
 - symmetric configurations

<img src="/assets/images/solution.png" align="middle" alt="cube done" class="figure-body">

## References

* [Rotation matrixes](https://en.wikipedia.org/wiki/Rotation_matrix)
* [3D voxel / volumetric plot](https://matplotlib.org/stable/gallery/mplot3d/voxels.html)
* [Wooden cube C solver](https://github.com/RONRON2904/WoodenCubeSolver)

