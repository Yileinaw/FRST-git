/**
 * 帖子信息接口
 */
export interface PostInfo {
    id: number;
    title: string; // 帖子标题
    authorId: number; // 作者 ID
    authorName: string; // 作者昵称
    authorAvatar?: string; // 作者头像 URL (可选)
    createdAt: string | Date; // 创建时间
    lastReplyAt?: string | Date; // 最后回复时间 (可选, 用于排序)
    replyCount: number; // 回复数
    likeCount: number; // 点赞数
    // 可以添加其他字段，如 contentSnippet, tags, isTop, isFeatured 等
} 