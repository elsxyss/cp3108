// image 1

The Data Visualizer tool is a tool that allows the rendering of data in a convenient, understandable manner, via box-and-pointer diagrams.

`draw_data` is the Source function corresponding to the use of the Data Visualizer tool.

# How to use

`draw_data` is a varargs function: multiple data structures can be used as parameters in a single `draw_data` call. 

For example, the following call of `draw_data` will result in subsequent drawing generated, containing both structures in the call.

```js
draw_data(list(1, 2, 3), list(4, 5, 6));
```

// image 2

Meanwhile, each individual call of `draw_data` maps to an individual drawing, which can be stepped through using the "Previous" and "Next" buttons.

For example, the following calls of `draw_data` will result in the subsequent drawings generated at once.

```js
draw_data(list(1, 2, 3));
draw_data(list(4, 5, 6));
```

// image 3

// image 4

# Code structure

The data visualizer code resides in `src/features/dataVisualizer`.

```yaml
src/features/dataVisualizer/
- drawable/ # low-level Konva/React components for visual primitives
  - Drawable.ts # re-exports all drawable components
  - ArrayDrawable.tsx # draws the box structure for a pair/array node, and renders inline text for primitive children when possible
  - ArrowDrawable.tsx # draws a forward arrow from a parent node to a child node
  - BackwardArrowDrawable.tsx # draws a special routed arrow back to an already-drawn node, used for shared/cyclic references
  - FunctionDrawable.tsx # draws the visual representation of a function object as two circles
  - NullDrawable.tsx # draws the diagonal slash used for an empty tail/null box

- tree/ # parses Source values into tree nodes, then renders them in different view modes
  - AlreadyParsedTreeNode.ts # placeholder node used when the same drawable node has already been parsed earlier
  - ArrayTreeNode.tsx # tree node for pairs/arrays; creates the cached drawable for an array node and its outgoing arrows
  - BaseTreeNode.ts # base TreeNode class with shared fields such as children and node position
  - BinaryTreeDrawer.tsx # renderer for binary-tree view; extends the original drawer with binary-tree-specific layout logic
  - DataTreeNode.tsx # leaf node for primitive data values (anything that is neither a function nor a pair/array)
  - DrawableTreeNode.tsx # abstract node class for nodes whose drawable should be cached and reused
  - FunctionTreeNode.tsx # tree node for function values; creates the cached function drawable and connecting arrow
  - GeneralTreeDrawer.tsx # renderer for general-tree view; extends the original drawer with general-tree layout logic
  - OriginalTreeDrawer.tsx # base renderer for the original box-and-pointer style view
  - Tree.tsx # converts Source data into a tree of nodes, memoizes shared structures/functions, and returns the appropriate drawer for the active mode
  - TreeNode.ts # re-exports the tree node classes

- Config.ts # drawing constants such as dimensions, spacing, stroke, fill, and arrow offsets
- dataVisualizer.tsx # public entry point and state manager; stores steps, tracks mode flags, detects tree shape, and triggers redraws
- dataVisualizerTypes.ts # lightweight type aliases for Source data and drawing steps
- dataVisualizerUtils.ts # helper predicates and formatting utilities, including text conversion and pair/list checks
- list.js # Source-style pair/list helper library used by the visualizer for pair/list operations
```

## Summary

The main outfacing code is present in `dataVisualizer.tsx`, which interacts with code in `Tree.tsx`. 

`dataVisualizer.tsx` exposes `init`, `drawData`, `clear`, `clearWithData`, mode toggles, and `redraw`. Internally, it stores a list of drawing `steps`, where each step corresponds to one `draw_data` call, and each element inside that step corresponds to one argument passed into that call. It also tracks the current rendering mode, remembers previously drawn inputs for redraw, and performs shape checks such as whether the incoming structure can be treated as a binary tree or a general tree.

`Tree.tsx` is responsible for turning an input Source structure into an internal tree of nodes. It distinguishes among arrays or pairs, functions, and primitive data; memoizes drawable nodes for repeated structures and functions; and emits `AlreadyParsedTreeNode` when a previously seen structure is encountered again. Once parsing is done, its `draw()` method chooses the correct drawer class based on the currently selected mode: `OriginalTreeDrawer`, `BinaryTreeDrawer`, or `GeneralTreeDrawer`.

The `tree/` folder has two responsibilities. 

The node classes: `BaseTreeNode`, `DataTreeNode`, `DrawableTreeNode`, `ArrayTreeNode`, `FunctionTreeNode`, `AlreadyParsedTreeNode` represent parsed values and cached drawables. The drawer classes: `OriginalTreeDrawer`, `BinaryTreeDrawer`, `GeneralTreeDrawer` are responsible for layout and rendering for each view mode. `BinaryTreeDrawer` and `GeneralTreeDrawer` both extend `OriginalTreeDrawer`, rather than replacing the entire drawing pipeline from scratch.

The `drawable/` folder contains only the small reusable visual pieces used by the tree nodes and drawers. 

`ArrayDrawable` renders the box itself. `ArrowDrawable` handles normal parent-to-child arrows, while `BackwardArrowDrawable` handles arrows that point back to an already drawn node. `FunctionDrawable` renders the two-circle function symbol, and `NullDrawable` renders the diagonal slash for an null tail. `Drawable.ts` simply re-exports these components.

`Config.ts`, `dataVisualizerTypes.ts`, `dataVisualizerUtils.ts`, and `list.js` are support files. `Config.ts` standardises drawing dimensions and styling constants. `dataVisualizerTypes.ts` defines the aliases used across the module, such as `Data`, `Pair`, `List`, `Drawing`, and `Step`. `dataVisualizerUtils.ts` contains text formatting and type guards such as `isArray`, `isFunction`, `isPair`, `isList`, and `isEmptyList`, while also re-exporting `head` and `tail`. `list.js` is the underlying Source-style pair or list utility library used for those checks and operations.

What happens in a single "run" of the code in Source Academy is:
1. `WorkspaceSaga` cleans up the environment and calls `DataVisualizer.clearWithData` to fully reset the data visualizer before a fresh run. This clears both the currently displayed drawings and any previously saved input history from earlier runs.
2. Each call to `draw_data` is handled by `DataVisualizer.drawData`. That call produces one `Step`, which is an array of drawings, one for each data structure in the varargs input. The new `Step` is appended to the internal `steps` list, and `DataVisualizer` updates the side content React component by calling `setSteps` with the updated list.
3. As the program runs, the side content React component receives the growing array of `Step`s. By the end of all the `draw_data` calls, it holds the full array, where each `Step` corresponds to one `draw_data` call made during the run.

# View modes
There are 3 view modes available, the Original mode, the Binary Tree mode and the General Tree mode.

## Original mode
This is the default view mode which shows only the box and pointer diagrams without any additional spacing, formatting or colour.

```js
draw_data(list(1, list(2, null, null), list(3, null, null)));
```

// image 5

## Binary Tree mode
This is the binary tree view mode which shows the binary tree representation of a valid binary tree input, as per the following definition of a binary tree, and using the structure of a 3-tuple input as written in Source Academy's binary_tree module.
- A binary tree of a certain data type is either null, or it is a **list** with **3** elements: the first being an element of that data type, and the remaining being trees of that data type.<br>
- Structure of a 3-tuple input: (**value:** any, **left:** BinaryTree, **right:** BinaryTree)

Each node in the tree comprises of group of 3 boxes: 
- A box containing the node's value
- A box from which the left subtree originates
- A box from which the right subtree originates

These 3 boxes are closely arranged in a triangular node group. The box containing the value is at the top of the node group, with the boxes pointing to the left and right subtrees at its bottom left and right, respectively.

For example, consider the following data visualisation.
```js
draw_data(list(1, list(2, null, null), list(3, null, null)));
```

// image 6

The tree has a <span style="color:black">**root node**</span> with a value of 1, and it also has a left subtree and a right subtree. The <span style="color:red">**left subtree**</span> has a parent node with value 2, while the <span style="color:orange">**right subtree**</span> has a parent node with value 3.

## General Tree mode
This is the general tree view mode which shows the tree representation (left aligned) of a valid tree input, as per the following definition of a tree:
- A tree of a certain data type is either null, or it is a **list** whose elements are of that data type, or trees of that data type.

For example, consider the following data visualisation.
```js
draw_data(list(1, list(2), list(3), list(4)));
```

// image 7

This is equivalent to a ternary tree, whose root node has a value of 1, with 3 child nodes with values 2, 3 and 4.

## Spacing
There are 3 steps to generating space in the visualizer.
1. Creating the entire visual canvas (the dark blue backdrop)
2. Setting the offset from the top left of the visual canvas, from which the data will begin drawing from
3. Draw the data

Both are done through `draw()` in the respective view modes. The visual canvas is created through the **Stage** while the offset is set through the **Layer**.

Example in `GeneralTreeDrawer.tsx`:
```js
return (
  <Stage
    key = {key}
    width = {(Config.NWidth + Config.BoxWidth) * (DataVisualizer.longestNodePos + 1) - Config.BoxWidth + x * 2}
    height = {this.downCOUNTER * Config.BoxHeight * 4 + Config.BoxHeight + y * 2}>
    <Layer 
      key = {x + ', ' + y}
      offsetX = {0} 
      offsetY = {this.minY}>
      {this.drawables}
    </Layer>
  </Stage>
);
```

For the tree view modes, drawing the data involves deliberate calculations to be done to determine the specifications of the tree structure, such as its depth, how much it stretches left or right, and the index of any node at any point in the tree, among others.

The following sections explain specific fields that appear in various files, specially created for the purpose of tree generation in the tree view modes.

### `dataRecords` (in `dataVisualizer.tsx`)
Keeps a copy of all inputs to ensure that when another view mode is chosen, all the instances of draw_data are redrawn.

### `depth`, `nodeCount`, `longestNodePos` (in `dataVisualizer.tsx`)
The input data is initially iterated through once to get the nodePos and the maximum depth of the tree. `nodePos` represents the position of the box within the node, and will be stored as a field in `BaseTreeNode.ts`. 

The depth is calculated through traversing the input array. Whenever the first element of the array is another nested array, the recursion increases the depth by 1. When `get_depth` reaches the end of the recursion, the final depth of that branch is compared to the maximum depth of the tree and the maximum depth is updated accordingly.

nodeCount is an array that is used to keep track the largest node (ie. the node with the most number of boxes) for each level. Currently, it is used for spacing purposes to ensure that there the spacing between nodes account for the worst case scenario whereby all nodes have the size of the largest node. This field may be changed in the future as we explore more space efficient ways to space out the nodes.

### `leftCOUNTER`, `rightCOUNTER`, `downCOUNTER`  (in `OriginalTreeDrawer.tsx`)
For the Binary Tree mode, it is necessary to identify how far the tree stretches left / right away from the centre (the root node), in order to generate sufficient space to show the tree in the visualizer itself. 

As the tree is being rendered box by box, the field `leftCounter` is incremented whenever a new node group is created towards the left of the root node, and is further left than any previous node. Similarly, the field `rightCounter` is incremented whenever a new node group is created towards the right of the root node, and is further right than any previous node. Lastly, the field `downCounter` is incremented whenever a new node group is created below the root node, and is further down than any previous node.

These 3 fields are used in the subsequent calculations of the variables EY1 and EY2, used in the generation of space in the visualizer for the Binary Tree mode. The `downCounter` is also used in the generation of space in the visualizer for the General Tree mode.

### `scalerV` (in `BinaryTreeDrawer.tsx`)
For the Binary Tree mode, in order to make the tree appear compact, the horizontal spacing between distinct node groups should be inversely proportional to level of these node groups, i.e. the larger / deeper the level in the tree, the closer the node groups.

This is done through a `scalerV`, applied to the boxes when they are being rendered.

Example in `BinaryTreeDrawer`:
```js
if (index === 0 && y === parentY + Config.DistanceY) {
  myY = y + Config.DistanceY * 2;
  myX = x - Config.NWidth * scalerV;
  OriginalTreeDrawer.colorCounter++;
  colorIndex = OriginalTreeDrawer.colorCounter;
}
```

Since scalerV should be inversely proportional to the level of the node groups, the calculation for scalerV is equivalent to:
- 2<sup>depth of tree</sup> divided by 2<sup>current level</sup>

This way, as the current level increases (going down the tree), the resultant scalerV decreases. The current level can be determined by dividing the y value of the box to be rendered by 6 * Config.BoxHeight, which is the amount of height used by each node group + vertical spacing between levels.<br>
Powers of 2 are used to appropriately space the binary tree, given that each node group can have 2 subtrees.

Equation for scalerV:
```js
let scalerV = Math.round(
  Math.pow(2, DataVisualizer.TreeDepth) /
  Math.pow(2, Math.round(y / (6 * Config.BoxHeight))));
```

### `EY1`, `EY2` (in `BinaryTreeDrawer.tsx`)
Purpose of the EY Variables:
- `EY1`: Get the maximum of the fields `leftCounter` and `rightCounter`.
- `EY2`: Used to set the horizontal width for Binary Tree mode.<br>
Due to `scalerV`, as one goes lower down the tree, the horizontal spacing between the distinct node groups decreases, allowing the tree to appear compact. This decreasing space is equivalent to decreasing powers of 2 * `Config.NWidth` as explained in the section for `scalerV`.<br>
Thus, to calculate how much offset is required before generating the tree, it is equivalent to: 2<sup>1</sup> + 2<sup>2</sup> + 2<sup>3</sup> + ... + 2<sup>EY1-1</sup>. This is a sum of a finite geometric progression with first term 2, common ratio 2, and (EY1-1) terms. Hence, using the formula for the sum of a finite geometric progression, we get the following equation for EY2:
```js
EY2 = 2 * (Math.pow(2, EY1 - 1) - 1) + 1;
```

## Coloring
All boxes belonging to the same node would be the same color. The coloring mechanism uses two key variables: `TreeDrawer.colorCounter` and `colorIndex`.

- `TreeDrawer.colorCounter` is a static counter that starts at 0 for each new tree drawing (reset in `Tree.draw()`). It increments each time a new node is encountered during the recursive drawing process, ensuring each unique node in the tree gets a distinct color index.

- `colorIndex` is a parameter passed to the `createDrawable` method of each `ArrayTreeNode`. It determines the actual color by indexing into a predefined array of colors: `this.Colors[colorIndex % this.Colors.length]`, where `this.Colors` is an array of 9 colors defined in `ArrayTreeNode.tsx`.

In binary tree mode:
- When drawing a new branch (left or right child), `colorCounter` increments, assigning a new `colorIndex` to the child node.
- Boxes within the same node (e.g., the three boxes representing a binary tree node) share the same `colorIndex`, thus the same color, hence `colorIndex` is set to `parentIndex`.

In general tree mode, similar logic applies, with `colorCounter` incrementing for each new child subtree.

In original mode, `colorIndex` is set to 0, resulting in all boxes being black.

## Tree verification
### Binary Tree mode
The input data would be checked to ensure that it is a binary tree using `isBinaryTree()`. This is done by recursively checking if every node is made up of 3 boxes. If the given input is not a binary tree and the binary tree mode is selected, an error would be shown.

### General Tree mode
The input array would be iterated through to ensure that the length of nested arrays, checking if their size exceed 2. This is because trees are list, and lists are stored as pairs, hence the size of the input array and nested arrays should be less than 2.