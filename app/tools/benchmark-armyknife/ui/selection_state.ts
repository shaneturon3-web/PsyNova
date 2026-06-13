import type { TreeNode } from '../core/types.js';

export class SelectionState {
  selected = new Set<string>();
  partial = new Set<string>();

  constructor(public treeSnapshot: TreeNode) {}

  findNode(id: string, n: TreeNode = this.treeSnapshot): TreeNode | null {
    if (n.id === id) return n;
    for (const c of n.children) {
      const f = this.findNode(id, c);
      if (f) return f;
    }
    return null;
  }

  private collectIds(n: TreeNode): string[] {
    return [n.id, ...n.children.flatMap((c) => this.collectIds(c))];
  }

  /** Check parent → marks all descendants (spec). */
  setChecked(id: string, on: boolean): void {
    const node = this.findNode(id);
    if (!node) return;
    for (const i of this.collectIds(node)) {
      if (on) this.selected.add(i);
      else this.selected.delete(i);
    }
    this.refreshPartial();
  }

  toggle(id: string): void {
    this.setChecked(id, !this.selected.has(id));
  }

  /** Recompute partial: internal node partial when some but not all subtree ids selected. */
  refreshPartial(): void {
    this.partial.clear();
    const subtreeIds = (n: TreeNode): string[] => this.collectIds(n);
    const walk = (n: TreeNode): void => {
      for (const c of n.children) walk(c);
      if (n.children.length === 0) return;
      const ids = subtreeIds(n);
      const sel = ids.filter((id) => this.selected.has(id));
      if (sel.length > 0 && sel.length < ids.length) this.partial.add(n.id);
    };
    walk(this.treeSnapshot);
  }

  exportSelectedIds(): string[] {
    return [...this.selected];
  }
}
