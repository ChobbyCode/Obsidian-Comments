export interface CommentFile {
    comment: string;
    startPos: number;
    endPos: number;
    uuid: string;
}

export interface CommentFiles {
    comments: CommentFile[];
}