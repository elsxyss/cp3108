# Data Visualizer Tool
This tool is used by draw_data to render box and pointer diagrams. There are 3 modes available, the original, the binary tree mode and the general tree mode.

## Original mode
This is the default mode and shows only the box and pointer diagrams without any additional spacing and formatting.

## Spacing
### `nodePos` and `depth`
The data is initially iterated through once to get the nodePos and the maximum depth of the tree. `nodePos` is represents the position of the box within the node, and will be stored as a field under `BaseTreeNode`

### Binary Tree mode
This renders a binary tree such that the boxes belonging to the same node is grouped together in a triangle, with the node containing the value appearing on top. 
<!--
Add a sample picture and explain the code for spacing
-->
### General Tree mode

## Coloring
All boxes belonging to the same node would be the same color. The coloring mechanism uses two key variables: `TreeDrawer.colorCounter` and `colorIndex`.

- `TreeDrawer.colorCounter` is a static counter that starts at 0 for each new tree drawing (reset in `Tree.draw()`). It increments each time a new node is encountered during the recursive drawing process, ensuring each unique node in the tree gets a distinct color index.

- `colorIndex` is a parameter passed to the `createDrawable` method of each `ArrayTreeNode`. It determines the actual color by indexing into a predefined array of colors: `this.Colors[colorIndex % this.Colors.length]`, where `this.Colors` is an array of 9 colors defined in `ArrayTreeNode.tsx`.

In binary tree mode:
- When drawing a new branch (left or right child), `colorCounter` increments, assigning a new `colorIndex` to the child node.
- Boxes within the same node (e.g., the three boxes representing a binary tree node) share the same `colorIndex`, thus the same color, hence `colorIndex` is set to `parentIndex`.

In general tree mode, similar logic applies, with `colorCounter` incrementing for each new child subtree.

In original mode, `colorIndex` is set to 0, resulting in all boxes being black.

## Tree checking
### Binary Tree mode
The input data would be checked to ensure that it is a binary tree using `isBinaryTree()`. This is done by recursively checking if every node is made up of 3 boxes. If the given input is not a binary tree and the binary tree mode is selected, an error would be shown.

### General Tree mode

## `dataRecords`
Keeps a copy of all inputs to ensure that when another mode is chosen, all the instances of draw_data is redrawn.
