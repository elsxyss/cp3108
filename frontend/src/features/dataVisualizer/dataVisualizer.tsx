import { Stage } from 'react-konva';

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
  private static counter = 0;
  private static empty(step: Step[]) {}
  private static setSteps: (step: Step[]) => void = DataVisualizer.empty;
  private static _instance = new DataVisualizer();
  private static treeMode: boolean = false;
  private static dataList: Data []=[]; 

  private steps: Step[] = [];
  private nodeLabel = 0;
  private nodeToLabelMap: Map<DataTreeNode, number> = new Map();

  private constructor() {}

  public static init(setSteps: (step: Step[]) => void): void {
    DataVisualizer.setSteps = setSteps;
  }

  public static toggleTreeMode(): void {
    DataVisualizer.treeMode = !DataVisualizer.treeMode;
  }

  public static getTreeMode(): boolean {
    return DataVisualizer.treeMode;
  }

  public static drawData(structures: Data[]): void {
    if (!DataVisualizer.setSteps) {
      throw new Error('Data visualizer not initialized');
    }
    this.dataList=structures;
    if (this.counter <= 1) {
        DataVisualizer._instance.addStep(structures);
    }
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

    const layer = treeDrawer.draw(leftMargin, topMargin, DataVisualizer.treeMode);
    //const treeLayer=treeDrawer.draw(leftMargin, topMargin, true);
    // if (DataVisualizer.treeMode){
    //   layer=treeLayer;
    // }
    // me added, below is + leftMargin for default extra space on the right, and + one node width cuz gotta include the very root node
    const EvanVariable = Math.max(treeDrawer.leftCOUNTER, treeDrawer.downCOUNTER); 

    return (
      <Stage key={xs} width={EvanVariable * Config.NWidth * 3 * 2 + leftMargin + Config.NWidth} height={EvanVariable * Config.DistanceY * 3 + topMargin}>
        {layer}
      </Stage>
    );
  }
  static redraw(){
    this.clear();
    return this.drawData(this.dataList);
  }

}
