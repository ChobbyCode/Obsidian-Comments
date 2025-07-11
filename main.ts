import { MarkdownView, Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { CommentsView, VIEW_TYPE_EXAMPLE as COMMENT_VIEW_TYPE } from 'Views/CommentView/CommentView';
import { CreateCommentModal } from 'Views/ModalPopup';

export default class CommentsPlugin extends Plugin {
  async onload() {
    this.registerView(
      COMMENT_VIEW_TYPE,
      (leaf) => new CommentsView(leaf)
    );

    this.addRibbonIcon('dice', 'Activate view', () => {
      this.activateView();
    });

    this.app.workspace.on("active-leaf-change", () => {
      this.ReloadComments();
    });

    this.app.workspace.on("file-open", (file) => {
      console.log("file changed")
      this.ReloadComments(file);
    })

    this.addCommand({
      id: 'add-comment',
      name: 'Add Comment',
      callback: () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const editor = view?.editor;
        if (editor) {
          new CreateCommentModal(
            this.app,
            editor.posToOffset(editor.getCursor('from')),
            editor.posToOffset(editor.getCursor('to')),
            () => this.ReloadComments(),
            this.app.workspace.getActiveFile()
          ).open();
        }

        // if (editor) {
        //   console.log(editor.posToOffset(editor.getCursor('from')))
        //   console.log(editor.posToOffset(editor.getCursor('to')))
        // }
      },
    });


    // Adds 'Add Comment' Option To Right Click Selection Menu
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        const selection = editor.getSelection();

        if (selection && selection.length > 0) {
          menu.addItem((item) =>
            item
              .setTitle('Add Comment')
              .setIcon('message-square') // Optional: any Obsidian icon
              .onClick(() => {
                new CreateCommentModal(
                  this.app,
                  editor.posToOffset(editor.getCursor('from')),
                  editor.posToOffset(editor.getCursor('to')),
                  () => this.ReloadComments(),
                  this.app.workspace.getActiveFile()
                ).open();
              })
          );
        }
      })
    );

    
    // Delete Comment File If Markdown File Is Deleted
    this.registerEvent(
      this.app.vault.on('delete', async (file) => {
        if (!(file instanceof TFile)) return;

        // Check if it's a markdown file
        if (file.extension !== 'md') return;

        // Build path to .comments.json file
        const commentFilePath = file.path.replace(/([^/]+)$/, (match) => `${match}.comments.json`);
        const commentFile = this.app.vault.getAbstractFileByPath(commentFilePath);

        if (commentFile && commentFile instanceof TFile) {
          try {
            await this.app.vault.delete(commentFile);
            console.log(`Deleted comment file for: ${file.path}`);
          } catch (err) {
            console.error('Failed to delete associated comment file:', err);
          }
        }
      })
    );


    // Rename Comment File If Markdown File Is Renamed
    this.registerEvent(
      this.app.vault.on('rename', async (file, oldPath) => {
        if (!(file instanceof TFile)) return;

        // Only process markdown files
        if (file.extension !== 'md') return;

        // Construct the old comment file path
        const oldCommentFilePath = oldPath.replace(/([^/]+)$/, (match) => `${match}.comments.json`);
        const newCommentFilePath = file.path.replace(/([^/]+)$/, (match) => `${match}.comments.json`);

        const oldCommentFile = this.app.vault.getAbstractFileByPath(oldCommentFilePath);

        if (oldCommentFile && oldCommentFile instanceof TFile) {
          try {
            await this.app.fileManager.renameFile(oldCommentFile, newCommentFilePath);
            console.log(`Renamed comment file from ${oldCommentFilePath} to ${newCommentFilePath}`);
          } catch (err) {
            console.error('Failed to rename associated comment file:', err);
          }
        }
      })
    );
  }

  // Gets all the leaves that exist of the view type we created
  private ReloadComments(sigmaFile?: TFile | null) {
    const leaves = this.app.workspace.getLeavesOfType(COMMENT_VIEW_TYPE)
    leaves.forEach(leaf => {
      const view = leaf.view as CommentsView;
      let file = this.app.workspace.getActiveFile();
      if (sigmaFile) file = sigmaFile; // I couldn't think of a better variable name that sigmaFile
      view.LoadComments(file);
    })
  }

  async onunload() {
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(COMMENT_VIEW_TYPE);

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
      await leaf.setViewState({ type: COMMENT_VIEW_TYPE, active: true });
    }

    // "Reveal" the leaf in case it is in a collapsed sidebar
    workspace.revealLeaf(leaf);
  }
}