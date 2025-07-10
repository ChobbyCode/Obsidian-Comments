export interface CommentFile {
    comment: string;
    startPos: number;
    endPos: number;
}

export interface CommentFiles {
    comments: CommentFile[];
}