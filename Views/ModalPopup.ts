import { App, Modal, Setting, TFile } from 'obsidian';
import { CommentFile, CommentFiles } from './CommentView/json/CustomCommentFile';
import { text } from 'stream/consumers';

export class CreateCommentModal extends Modal {

  constructor(
    app: App,
    startPos: number,
    endPos: number,
    onSubmit: () => void,
    activeFile?: TFile | null,
    existingComment?: string,
    uuid?: string
  ) {
    super(app);
    this.setTitle('Commenting');

    let comment = '';
    let startP = 0;
    let endP = 0;
    startP = startPos;
    endP = endPos;
    if (existingComment) comment = existingComment;

    new Setting(this.contentEl)
      .setName('Comment')
      .addTextArea((textArea) => {
        // Make the text area larger and more usable
        textArea.inputEl.value = comment
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

    const optionRow = new Setting(this.contentEl);

    if (existingComment) {
      optionRow
        .addButton((btn) =>
          btn
            .setButtonText('Delete')
            .setCta()
            .setWarning()
            .setClass('comment-delete-btn')
            .onClick(() => {
              this.close();
              this.DeleteComment(uuid, activeFile).then(() => {
                onSubmit();
              })
            }
            )
        )
    }

    optionRow
      .addButton((btn) =>
        btn
          .setButtonText('Save')
          .setCta()
          .onClick(() => {
            this.close();
            // If the comment is not existing then we will add the comment to the comment file
            if (!existingComment) {
              this.CreateComment(comment, startP, endP, activeFile).then(() => {
                onSubmit();
              });
            } else {
              // If it's existing we can assume that a comment file already exists, and need to modify the existing comment instead
              this.UpdateComment(comment, startP, endP, uuid, activeFile).then(() => {
                onSubmit();
              });
            }
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
          endPos: endPos,
          uuid: crypto.randomUUID()
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
            endPos: endPos,
            uuid: crypto.randomUUID()
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

  private async UpdateComment(text: string, startPos: number, endPos: number, uuid?: string | null, activeFile?: TFile | null) {
    if (activeFile) {
      // Build the comment file path by prepending a dot and appending .comments.json
      const commentFilePath = activeFile.path.replace(/([^/]+)$/, (match) => `${match}.comments.json`);

      // Check if the comment file exists
      const commentFile = this.app.vault.getAbstractFileByPath(commentFilePath);

      // We know comment file will be found because we're updating the file, this is for redundancy just in case and to stop vscode from erroring. 
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
      console.log(content);

      // Parse JSON
      try {
        let comments: CommentFiles = JSON.parse(content);
        let updatedComments: CommentFile[] = [];
        comments.comments.forEach(commentFile => {
          console.log(commentFile.comment, " | uuid: ", commentFile.uuid, " match: ", uuid)
          if (commentFile.uuid != uuid) updatedComments.push(commentFile);
          else {
            let changedComment: CommentFile = {
              comment: text,
              startPos: startPos,
              endPos: endPos,
              uuid: uuid
            }
            updatedComments.push(changedComment);
          }
        });

        const json = JSON.stringify({ comments: updatedComments }, null, 2);
        await this.app.vault.modify(commentFile, json);

      } catch (e) {
        console.error('Failed to parse comments JSON:', e);
        return;
      }
    }
  }

  private async DeleteComment(uuid?: string | null, activeFile?: TFile | null){
    if (activeFile) {
      // Build the comment file path by prepending a dot and appending .comments.json
      const commentFilePath = activeFile.path.replace(/([^/]+)$/, (match) => `${match}.comments.json`);

      // Check if the comment file exists
      const commentFile = this.app.vault.getAbstractFileByPath(commentFilePath);

      // We know comment file will be found because we're updating the file, this is for redundancy just in case and to stop vscode from erroring. 
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
      console.log(content);

      // Parse JSON
      try {
        let comments: CommentFiles = JSON.parse(content);
        let updatedComments: CommentFile[] = [];
        comments.comments.forEach(commentFile => {
          console.log(commentFile.comment, " | uuid: ", commentFile.uuid, " match: ", uuid)
          if (commentFile.uuid != uuid) updatedComments.push(commentFile);
        });

        const json = JSON.stringify({ comments: updatedComments }, null, 2);
        await this.app.vault.modify(commentFile, json);

      } catch (e) {
        console.error('Failed to parse comments JSON:', e);
        return;
      }
    }
  }
}
