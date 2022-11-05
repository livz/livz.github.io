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

The project has 2 main important chunks: generating all the possible transformations for each piece and them brute-forcing a solution. I thinkered a bit with a few iterations of the function that searches for a solution, and settled with a different variant but I've optimised that to perform well even on a high level language like Python, with the advantage that I got a much shorter code (less than 200 lines in total, including the graphics display functionaity), cleaner and easier to understand (I hope).

## Coding

In terms of data structures, I opted for [Numerical Python (aka NumPy)](https://www.geeksforgeeks.org/numpy-array-in-python/) which are faster, more efficient, and require less syntax than standard Python lists. They are also more intuitive and easy to useto perform normal operations over matrices. More on this later!

I'm plotting the pieces as a list of 3D volumetric shapes:
```python
# Plot a list of pieces with a volumetric 3D plot
def plotPieces(pieces):
    # Combine the pieces
    voxelarray = functools.reduce(lambda a, b: a | b, pieces)

    # Colour each piece
    all_colors = [name.split('tab:')[1]
        for i, name in enumerate(list(mcolors.TABLEAU_COLORS))]
    colors = np.empty(voxelarray.shape, dtype = object)
    for p in range(len(pieces)):
        colors[pieces[p]] = all_colors[p]

    # Configure the axes
    ax = plt.figure().add_subplot(projection = '3d')

    ax.voxels(voxelarray, facecolors = colors, edgecolor = 'k')

    # Set axes labels
    ax.set_xlabel('x')
    ax.set_ylabel('y')
    ax.set_zlabel('z')

    # Show the plot
    plt.show()
```

To get each piece starting from a list of `(x, y, z)` corrdinates , I'm using the equations below:

```python
# Create a volumetric piece from a piece coordinates matrix
def getPiece(piece_coords):
    # Number of blocks in a piece
    numBlocks = len(piece_coords)

    x, y, z = np.indices((CUBE_SIZE, CUBE_SIZE, CUBE_SIZE))
    x_vals, y_vals, z_vals = piece_coords[ :,X], piece_coords[ :,Y], piece_coords[ :,Z]

    piece_blocks = [(x == x_vals[i]) & (y == z_vals[i]) & (z == y_vals[i]) for i in range(numBlocks)]
    piece = functools.reduce(lambda a, b: a + b, piece_blocks)

    return piece
```

You might have noticed above that the coordinates for Y and Z are reversed. That's not a mistake and if we'd use them the expected way we would get the piece reversed:
```python
    piece_blocks = [(x == x_vals[i]) & (y == z_vals[i]) & (z == y_vals[i]) for i in range(numBlocks)]
```

For the rotations, I'm using the 3D rotation matrices above and have created a lambda function to rotate a piece a number of times around an axis:
```
# Rotation matrixes
R = [
    # Rotate by 90 about the x axis
    np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]]),
    # Rotate by 90 about the y axis
    np.array([[0, 0, 1], [0, 1, 0], [-1, 0, 0]]),
    # Rotate by 90 about the z axis
    np.array([[0, -1, 0], [1, 0, 0], [0, 0, 1]])
]

# Rotate a piece a number of times
rotate = lambda coords, axis, times: np.dot(coords, matrix_power(R[axis], times))
```

To make sure I get all the possible rotations, and this is an important bit I didn't realise in the beginning, it's not sufficient to rotate a piece around its 3 axes. We need to rotate it around an axis, then for each rotation get all possible rotations. With the power of Python we can do this in just a couple of lines:

```python
    # Brute-force possible rotations
    prod = [p for p in itertools.product(range(4), repeat = 3)]
    rotations = [rotate(rotate(rotate(coords, X, p[X]), Y, p[Y]), Z, p[Z]) for p in prod]
```
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

