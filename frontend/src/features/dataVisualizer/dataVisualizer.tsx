import {Stage } from 'react-konva';

import { Config } from './Config';
import { Data, Step } from './dataVisualizerTypes';
import { Tree } from './tree/Tree';
import { DataTreeNode } from './tree/TreeNode';


/**
 * The data visualizer class.
 * Exposes three function: init, drawData, and clear.
 *
 * init is used by SideContentDataVisualizer as a hook.
 * drawData is the draw_data function in source.
 * clear is used by WorkspaceSaga to reset the visualizer after every "Run" button press
 */
export default class DataVisualizer {
  private static counter = 1;
  private static empty(step: Step[]) {}
  private static setSteps: (step: Step[]) => void = DataVisualizer.empty;
  private static _instance = new DataVisualizer();
  public static treeMode: boolean = false;
  public static BinTreeMode: boolean = false;
  private static dataList: Data []=[]; 
  public static binaryTreeDepth: number = 0;
  public static isBinTree: boolean = false;

  private steps: Step[] = [];
  private nodeLabel = 0;
  private nodeToLabelMap: Map<DataTreeNode, number> = new Map();

  private constructor() {}

  public static get_depth(structures: Data[]): number { //works assuming is a binary tree
    let depth=0;
    if (!(structures instanceof Array)||structures[0]===null){
      return 0;
    }
    else{
      if (!(structures[0] instanceof Array && structures[1] instanceof Array)){
        depth++;
      }
      depth+=Math.max(this.get_depth(structures[0]), this.get_depth(structures[1][0]));
      console.log(depth);
      return depth;

    }
  }
  public static isBinaryTree(structures: Data[]): boolean {
    if (structures[0]===null){
      return true;
    }
    let next=structures[0];
    let ans=false
    let count=0;
    while(next instanceof Array){
      count++;
      next=next[1];
    }
    if (count==3){
      ans=true
    }
    return ans&&this.isBinaryTree(structures[0][1]);
  }


  public static init(setSteps: (step: Step[]) => void): void {
    DataVisualizer.setSteps = setSteps;
  }

  public static toggleBinTreeMode(): void {
    DataVisualizer.BinTreeMode = !DataVisualizer.BinTreeMode;
  }

  public static toggleTreeMode(): void {
    DataVisualizer.treeMode = !DataVisualizer.treeMode;
  }

  public static getBinTreeMode(): boolean {
    return DataVisualizer.BinTreeMode;
  }

  public static getTreeMode(): boolean {
    return DataVisualizer.treeMode;
  }

  public static drawData(structures: Data[]): void {
    if (!DataVisualizer.setSteps) {
      throw new Error('Data visualizer not initialized');
    }
    DataVisualizer.isBinTree=this.isBinaryTree(structures);
    if (DataVisualizer.isBinTree){
      DataVisualizer.binaryTreeDepth = this.get_depth(structures[0]);
    }
    this.dataList=structures;
    DataVisualizer._instance.addStep(structures);
    DataVisualizer.setSteps(DataVisualizer._instance.steps);
  }

  public static clear(): void {
    DataVisualizer._instance = new DataVisualizer();
    DataVisualizer.setSteps(DataVisualizer._instance.steps);
  }

  public static displaySpecialContent(dataNode: DataTreeNode): number {
    return DataVisualizer._instance.displaySpecialContent(dataNode);
  }

  private displaySpecialContent(dataNode: DataTreeNode): number {
    if (this.nodeToLabelMap.has(dataNode)) {
      return this.nodeToLabelMap.get(dataNode) ?? 0;
    } else {
      console.log('*' + this.nodeLabel + ': ' + dataNode.data);
      this.nodeToLabelMap.set(dataNode, this.nodeLabel);
      return this.nodeLabel++;
    }
  }

  private addStep(structures: Data[]) {
    const step = structures.map(xs => this.createDrawing(xs));
    this.steps.push(step);
  }

  /**
   *  For student use. Draws a structure by converting it into a tree object, attempts to draw on the canvas,
   *  Then shift it to the left end.
   */
  private createDrawing(xs: Data): JSX.Element {
    const treeDrawer = Tree.fromSourceStructure(xs).draw();

    // To account for overflow to the left side due to a backward arrow
    // const leftMargin = Config.ArrowMarginHorizontal + Config.StrokeWidth;
    const leftMargin = (Config.StrokeWidth / 2);

    // To account for overflow to the top due to a backward arrow
    const topMargin = Config.StrokeWidth / 2;

    const layer = treeDrawer.draw(leftMargin, topMargin);
    //const treeLayer=treeDrawer.draw(leftMargin, topMargin, true);
    // if (DataVisualizer.treeMode){
    //   layer=treeLayer;
    // }
    // me added, below is + leftMargin for default extra space on the right, and + one node width cuz gotta include the very root node
    
    if (DataVisualizer.counter == 1) {
      return (
        <Stage key={xs} width={treeDrawer.width + leftMargin} height={treeDrawer.height + topMargin}>
          {layer}
        </Stage>
      );
    }

    //for general tree mode
    if (DataVisualizer.treeMode){
      return (
        <Stage key={xs} width={treeDrawer.width + leftMargin} height={treeDrawer.height + topMargin}>
          {layer}
        </Stage>
      );
    }
    if(!DataVisualizer.isBinTree&&DataVisualizer.BinTreeMode){
      return (
        <Stage key={xs} width={400} height={100}>
          {layer}
        </Stage>
      )
    }
    else { //for binary tree mode
      // const EvanVariable1 = Math.max(treeDrawer.leftCOUNTER, treeDrawer.rightCOUNTER);
      const EvanVariable2 = 2 * (Math.pow(2, DataVisualizer.binaryTreeDepth) - 1);
      return (
        <Stage key={xs} width={(EvanVariable2 * Config.NWidth) * 2 + leftMargin + Config.NWidth} height={treeDrawer.downCOUNTER * Config.DistanceY * 3 + topMargin}>
          {layer}
        </Stage>
      );
    }
    
    return (
      <Stage key={xs} width={treeDrawer.width + leftMargin} height={treeDrawer.height + topMargin}>
        {layer}
      </Stage>
    );
  }
  static redraw(){
    this.clear();
    DataVisualizer.counter = - DataVisualizer.counter;
    return this.drawData(this.dataList);
  }

}
