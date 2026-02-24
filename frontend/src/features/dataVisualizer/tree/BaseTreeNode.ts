export class TreeNode {
  public children: TreeNode[] | null;
  public nodePos: number;

  constructor() {
    this.children = null;
    this.nodePos=0;
  }
}
