import { MarkdownView, Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { ExampleView, VIEW_TYPE_EXAMPLE } from 'Views/CommentView/CommentView';
import { ExampleModal } from 'Views/ModalPopup';

export default class ExamplePlugin extends Plugin {
  async onload() {
    this.registerView(
      VIEW_TYPE_EXAMPLE,
      (leaf) => new ExampleView(leaf)
    );

    this.addRibbonIcon('dice', 'Activate view', () => {
      this.activateView();
    });

    this.app.workspace.on("active-leaf-change", () => {
      this.ReloadComments();
    });

    this.addCommand({
      id: 'add-comment',
      name: 'Add Comment',
      callback: () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const editor = view?.editor;
        if (editor) {
          new ExampleModal(
            this.app,
            editor.posToOffset(editor.getCursor('from')),
            editor.posToOffset(editor.getCursor('to')),
            this.app.workspace.getActiveFile()
          ).open();
        }

        // if (editor) {
        //   console.log(editor.posToOffset(editor.getCursor('from')))
        //   console.log(editor.posToOffset(editor.getCursor('to')))
        // }
      },
    });

  }

  private ReloadComments() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)
    leaves.forEach(leaf => {
      const view = leaf.view as ExampleView;
      const file = this.app.workspace.getActiveFile();
      view.LoadComments(file);
    })
  }

  async onunload() {
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

    if (leaves.length > 0) {
      // A leaf with our view already exists, use that
      leaf = leaves[0];
    } else {
      // Our view could not be found in the workspace, create a new leaf
      // in the right sidebar for it
      leaf = workspace.getRightLeaf(false);
      if (leaf == null) {
        console.log("leaf was null");
        return;
      }
      await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
    }

    // "Reveal" the leaf in case it is in a collapsed sidebar
    workspace.revealLeaf(leaf);
  }
}