import type { TreeNode } from '../core/types.js';
import { SelectionState } from './selection_state.js';

/** Keep branches that have a selected id or a selected descendant. */
export function filterTreeSelected(root: TreeNode, selectedIds: Set<string>): TreeNode | null {
  function cloneIfSelected(n: TreeNode): TreeNode | null {
    const kids = n.children.map(cloneIfSelected).filter((x): x is TreeNode => x !== null);
    const keep = selectedIds.has(n.id) || kids.length > 0;
    if (!keep) return null;
    return { ...n, children: kids };
  }
  return cloneIfSelected(root);
}

export function createSelectionState(tree: TreeNode): SelectionState {
  return new SelectionState(tree);
}
