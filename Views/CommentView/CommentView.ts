import { ItemView, TFile, WorkspaceLeaf, MarkdownView, Editor, setIcon } from 'obsidian';
import { CommentFile, CommentFiles } from './json/CustomCommentFile';
import { CreateCommentModal } from 'Views/ModalPopup';

export const VIEW_TYPE_EXAMPLE = 'comments-view';

export class CommentsView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return 'Example view';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.createEl('h4', { text: 'Comments' });
  }

  async onClose() {
    // Nothing to clean up.
  }

  async LoadComments(activeFile?: TFile | null): Promise<void> {
    this.CacheEditor();
    // Makes Sure That An Active File Is Open
    if (activeFile) {
      // Build the comment file path by prepending a dot and appending .comments.json
      const commentFilePath = activeFile.path.replace(/([^/]+)$/, (match) => `${match}.comments.json`);

      // Check if the comment file exists
      const commentFile = this.app.vault.getAbstractFileByPath(commentFilePath);

      if (!commentFile) {
        console.log('No comment file found:', commentFilePath);
        // No comment file yet, maybe create or just return
        this.DrawNoCommentsYet();
        return;
      }

      if (!commentFile || !(commentFile instanceof TFile)) {
        console.log('Comment file not found or is not a TFile:', commentFilePath);
        this.DrawNoCommentsYet();
        return;
      }

      // Read the comment file content
      const content = await this.app.vault.read(commentFile);

      // Parse JSON
      try {
        let comments: CommentFiles = JSON.parse(content);
        const editorContent = this.editor?.getValue() ?? '';
        const editorLength = editorContent.length;
        console.log("length ", editorLength)

        // Filter comments based on the current editor content length
        // const filteredComments = {
        //   comments: comments.comments.filter(c => c.startPos < editorLength && c.endPos <= editorLength)
        // };

        this.Render(comments);
      } catch (e) {
        console.error('Failed to parse comments JSON:', e);
        return;
      }
    }
  }

  private Render(comments: CommentFiles) {
    const container = this.containerEl.children[1];
    container.empty(); // Clear previous comments

    // Create a DocumentFragment to hold all comment elements
    const fragment = document.createDocumentFragment();

    if (comments.comments.length < 1) {
      this.DrawNoCommentsYet();
      return;
    }

    for (const c of comments.comments) {
      const commentEl = this.GenerateCommentElement(c.comment, c.startPos, c.endPos, c.uuid);
      fragment.appendChild(commentEl);
    }

    // Append all comment elements at once
    container.appendChild(fragment);
  }

  private DrawNoCommentsYet() {
    const container = this.containerEl.children[1];
    container.empty();

    const commentElTop = document.createElement('div');
    commentElTop.textContent = "No comments found.";
    commentElTop.classList.add("empty-comment-item");
    container.appendChild(commentElTop);
  }

  private editor: Editor | undefined;

  CacheEditor() {
    if (!this.editor) {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      const currentEditor = view?.editor;
      if (currentEditor) this.editor = currentEditor;
    }
  }

  private GenerateCommentElement(comment: string, startPos: number, endPos: number, uuid: string): HTMLElement {
    const commentEl = document.createElement('div');
    commentEl.textContent = comment;
    commentEl.classList.add("comment-item");

    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-comment-btn')

    const iconEl = document.createElement('span');
    iconEl.classList.add('mod-icon');
    setIcon(iconEl, 'info')
    editBtn.appendChild(iconEl);

    // Opens The Modal To Edit The Comment
    // This Will Probably Require An Id System To Be Implemented
    editBtn.addEventListener('mousedown', () => {
      new CreateCommentModal(
        this.app,
        startPos,
        endPos,
        () => this.LoadComments(this.app.workspace.getActiveFile()),
        this.app.workspace.getActiveFile(),
        comment,
        uuid
      ).open();
    });

    commentEl.appendChild(editBtn);

    // Focus Functionality Which Highlights Text When Hover Over Comment
    commentEl.addEventListener('mouseenter', () => {
      // Editor has to at least been loaded once for comment hover to work.
      // Unable to find a way to make it work any other way.
      if (!this.editor) {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const currentEditor = view?.editor;
        if (currentEditor) this.editor = currentEditor;
      }
      this.editor?.focus();
      if (this.editor) {
        this.editor.setSelection(
          this.editor.offsetToPos(startPos),
          this.editor.offsetToPos(endPos)
        );
      } else {

      }
    });

    commentEl.addEventListener('mouseleave', () => {
      if (this.editor) {
        const cursor = this.editor.getCursor();
        this.editor.setSelection(cursor, cursor);
      }
    });

    return commentEl;
  }
}