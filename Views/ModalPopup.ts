import { App, Modal, Setting, TFile } from 'obsidian';
import { CommentFile, CommentFiles } from './CommentView/json/CustomCommentFile';

export class CreateCommentModal extends Modal {

  constructor(
    app: App,
    startPos: number,
    endPos: number,
    onSubmit: () => void,
    activeFile?: TFile | null
  ) {
    super(app);
    this.setTitle('Commenting');

    let comment = '';
    let startP = 0;
    let endP = 0;
    startP = startPos;
    endP = endPos;

    new Setting(this.contentEl)
      .setName('Comment')
      .addTextArea((textArea) => {
        // Make the text area larger and more usable
        textArea.inputEl.rows = 5;
        textArea.inputEl.style.minWidth = '400px';
        textArea.inputEl.style.maxWidth = '400px';
        textArea.inputEl.style.width = '100%';
        textArea.inputEl.style.minHeight = '100px';
        textArea.onChange((value) => {
          comment = value;
        });
      });

    // --- ADVANCED SETTINGS DROPDOWN ---
    const advancedToggle = this.contentEl.createEl('div', {
      cls: 'setting-item',
    });

    const header = advancedToggle.createEl('div', {
      text: 'Advanced Settings ▾',
      cls: 'setting-item-name',
    });
    header.style.cursor = 'pointer';
    header.style.fontWeight = 'bold';
    header.style.marginTop = '1em';

    const advancedContainer = this.contentEl.createDiv();
    advancedContainer.style.display = 'none'; // Hidden by default

    // Toggle logic
    header.addEventListener('click', () => {
      const isOpen = advancedContainer.style.display === 'block';
      advancedContainer.style.display = isOpen ? 'none' : 'block';
      header.setText(isOpen ? 'Advanced Settings ▾' : 'Advanced Settings ▴');
    });

    // Start Position Input
    new Setting(advancedContainer)
      .setName('Start Position')
      .addText((text) => {
        text.inputEl.type = 'number';
        text.inputEl.min = '0';
        text.inputEl.placeholder = 'e.g., 0';
        text.inputEl.value = startP.toString();
        text.onChange((value) => {
          startP = Number(value);
        });
      });

    // End Position Input
    new Setting(advancedContainer)
      .setName('End Position')
      .addText((text) => {
        text.inputEl.type = 'number';
        text.inputEl.min = '0';
        text.inputEl.placeholder = 'e.g., 42';
        text.inputEl.value = endP.toString();
        text.onChange((value) => {
          endP = Number(value);
        });
      });

    new Setting(this.contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('Submit')
          .setCta()
          .onClick(() => {
            this.close();
            this.CreateComment(comment, startP, endP, activeFile).then(() => {
              onSubmit();
            });
          }
        ));
  }

  private async CreateComment(text: string, startPos: number, endPos: number, activeFile?: TFile | null) {
    if (activeFile) {
      // Build the comment file path by prepending a dot and appending .comments.json
      const commentFilePath = activeFile.path.replace(/([^/]+)$/, (match) => `${match}.comments.json`);

      // Check if the comment file exists
      const commentFile = this.app.vault.getAbstractFileByPath(commentFilePath);

      // create & write if file doesn't exist yet
      if (!commentFile || !(commentFile instanceof TFile)) {
        let comments: CommentFiles = {
          comments: []
        };

        comments.comments.push({
          comment: text,
          startPos: startPos,
          endPos: endPos
        });

        console.log('No comment file found:', commentFilePath);
        console.log('Creating comment file')
        const json = JSON.stringify(comments, null, 2);
        await this.app.vault.create(commentFilePath, json);
      } else {
        // Build the comment file path by prepending a dot and appending .comments.json
        const commentFilePath = activeFile.path.replace(/([^/]+)$/, (match) => `${match}.comments.json`);

        // Check if the comment file exists
        const commentFile = this.app.vault.getAbstractFileByPath(commentFilePath);

        if (!commentFile) {
          console.log('No comment file found:', commentFilePath);
          // No comment file yet, maybe create or just return
          return;
        }

        if (!commentFile || !(commentFile instanceof TFile)) {
          console.log('Comment file not found or is not a TFile:', commentFilePath);
          return;
        }

        // Read the comment file content
        const content = await this.app.vault.read(commentFile);

        // Parse JSON
        try {
          let comments: CommentFiles = JSON.parse(content);
          comments.comments.push({
            comment: text,
            startPos: startPos,
            endPos: endPos
          });

          const json = JSON.stringify(comments, null, 2);
          await this.app.vault.modify(commentFile, json);


        } catch (e) {
          console.error('Failed to parse comments JSON:', e);
          return;
        }
      }

      if (!commentFile || !(commentFile instanceof TFile)) {
        console.log('Comment file not found or is not a TFile:', commentFilePath);
        return;
      }
    }
  }
}
