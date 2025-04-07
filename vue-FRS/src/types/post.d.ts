/**
 * 社区帖子信息接口
 */
export interface PostInfo {
    id: number;
    title: string;
    content?: string; // 帖子内容，列表可能不需要，详情需要
    authorId: number;
    authorName: string;
    createdAt: Date | string; // 创建时间
    lastReplyAt?: Date | string | null; // 最后回复时间，可能没有回复
    replyCount: number; // 回复数
    likeCount: number; // 点赞数
    isLiked?: boolean; // 是否点赞
    // 根据需要可以添加更多字段，例如：
    // tags?: string[];
    // status?: 'published' | 'draft' | 'deleted';
    // coverImage?: string;
}

// 可以根据需要定义更多与帖子相关的类型
// export interface PostComment { ... }
// export interface PostLike { ... } 