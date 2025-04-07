<template>
    <div>
        <div v-if="loading" class="loading-state">
            <el-skeleton :rows="10" animated />
        </div>
        <div v-else-if="post" class="post-detail-container">
            <el-page-header @back="goBack" class="page-header">
                <template #content>
                    <span class="header-content">帖子详情</span>
                </template>
            </el-page-header>

            <div class="post-content-card">
                <!-- Author Info -->
                <div class="author-info">
                    <el-avatar :size="40" :src="post.author?.avatar || defaultAvatar" class="author-avatar" />
                    <div class="author-details">
                        <span class="author-username">{{ post.author?.username || '未知作者' }}</span>
                        <span class="post-time">{{ formatRelativeTime(post.createdAt) }}</span>
                    </div>
                </div>

                <!-- Post Body -->
                <div class="post-body" v-html="formattedContent(post.content)"></div>

                <!-- Post Images -->
                <div v-if="post.imageUrls && post.imageUrls.length > 0" class="post-images">
                    <el-image v-for="(imgUrl, index) in post.imageUrls" :key="index" :src="imgUrl"
                        :preview-src-list="post.imageUrls" :initial-index="index" fit="cover" loading="lazy"
                        class="post-image-item" />
                </div>

                <!-- Actions -->
                <div class="post-actions">
                    <el-button 
                        @click="handleLikePost" 
                        :loading="likeLoading">
                        <el-icon :color="isLiked ? 'var(--el-color-primary)' : ''" class="like-icon">
                            <component :is="isLiked ? StarFilled : Star" />
                        </el-icon>
                        <span class="like-count">{{ likeCount }} 赞</span>
                    </el-button>
                    <el-button text :icon="ChatDotRound">
                        {{ commentsCount }} 评论
                    </el-button>
                    <!-- Add Collection Button -->
                    <el-button 
                        type="warning" 
                        text 
                        :icon="CollectionTag" 
                        @click="handleAddToCollection"
                        :disabled="isAlreadyCollected || addingToCollection"
                        :loading="addingToCollection">
                        {{ isAlreadyCollected ? '已收藏' : '收藏' }}
                    </el-button>
                    <!-- Share Button Placeholder -->
                    <el-button text :icon="Share" @click="handleShare">分享</el-button>
                </div>
            </div>

            <!-- Comments Section -->
            <div class="comments-section-card">
                <h3 class="comments-title">评论 ({{ commentsCount }})</h3>
                <CommentList 
                    ref="commentListRef"
                    :post-id="postId" 
                    :comments="comments" 
                    :has-more="hasMoreComments" 
                    :loading="commentsLoading" 
                    @load-more="loadMoreComments" 
                    @add-comment="handleAddComment" 
                    @reply-clicked="handleReply" />
            </div>

        </div>
        <div v-else class="not-found">
            <el-empty description="帖子未找到或已被删除" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { ElPageHeader, ElAvatar, ElButton, ElSkeleton, ElEmpty, ElMessage, ElIcon, ElImage } from 'element-plus';
import { Star, StarFilled, ChatDotRound, Share, CollectionTag } from '@element-plus/icons-vue';
import CommentList from '@/components/business/CommentList.vue';
import api from '@/services/api';
import { formatRelativeTime } from '@/utils/timeFormatter';
import type { PostInfo as PostListInfo } from '@/types/post.d.ts';
import type { CommentInfo, PostAuthorInfo, PaginatedList } from '@/types/api';
import defaultAvatar from '@/assets/images/default-avatar.png';

// Define a more detailed type for the post detail view
interface PostDetailInfo {
    id: number;
    title: string;
    content: string;
    imageUrls?: string[]; // Optional array of strings
    createdAt: string | Date;
    updatedAt: string | Date;
    authorId: number;
    author: { // Nested author object
        id: number;
        username: string;
        avatar?: string;
    };
    _count: { // Counts object
        comments: number;
        likes: number;
    };
    // Add isLiked later when backend supports it
    // isLiked?: boolean; 
}

// --- State ---
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const post = ref<PostDetailInfo | null>(null);
const comments = ref<CommentInfo[]>([]);
const loading = ref(true);
const commentsLoading = ref(false);
const likeLoading = ref(false);
const hasMoreComments = ref(true);
const commentsPage = ref(1);
const commentsPageSize = 10;
const addingToCollection = ref(false);

// Separate refs for reactive counts and like state, initialized from post
const likeCount = ref(0);
const commentsCount = ref(0);
const isLiked = ref(false); // Default to false, will be initialized

const commentListRef = ref<InstanceType<typeof CommentList> | null>(null);
const replyingTo = ref<PostAuthorInfo | null>(null);
const commentInputContent = ref('');

// --- Computed ---
const postId = computed(() => {
    const id = route.params.id;
    const idString = Array.isArray(id) ? id[0] : id;
    const parsedId = Number(idString);
    return isNaN(parsedId) ? 0 : parsedId;
});

const isAlreadyCollected = computed(() => {
    if (!post.value || !postId.value) return false;
    return userStore.isCollected('post', Number(postId.value));
});

// --- Methods ---
const goBack = () => {
    router.back();
};

const fetchPostDetails = async () => {
    loading.value = true;
    post.value = null;
    try {
        const id = postId.value;
        if (!id) {
            console.error("Post ID is missing or invalid.");
            ElMessage.error("无法加载帖子，ID无效");
            return;
        }
        console.log(`Fetching post details for ID: ${id}`);
        const response = await api.get<PostDetailInfo & { isLiked?: boolean }>(`/posts/${id}`);
        console.log(`[PostDetail fetch] Received raw data: likes=${response.data?._count?.likes}, isLiked=${response.data?.isLiked}`);
        post.value = response.data;
        likeCount.value = post.value?._count?.likes ?? 0;
        commentsCount.value = post.value?._count?.comments ?? 0;
        isLiked.value = response.data.isLiked ?? false;
        console.log(`[PostDetail fetch] State updated: likeCount=${likeCount.value}, isLiked=${isLiked.value}`);
        comments.value = [];
        commentsPage.value = 1;
        hasMoreComments.value = true;
        await fetchComments();
    } catch (error: any) {
        console.error("Error fetching post details:", error);
        if (error.response?.status === 404) {
            ElMessage.warning("帖子未找到或已被删除");
        } else {
            ElMessage.error("加载帖子详情失败");
        }
        post.value = null;
    } finally {
        loading.value = false;
    }
};

const fetchComments = async () => {
    if (!postId.value || commentsLoading.value) return;
    commentsLoading.value = true;
    try {
        console.log(`Fetching comments for post ID: ${postId.value}, Page: ${commentsPage.value}`);
        const response = await api.get<{ data: CommentInfo[], pagination: { totalItems: number } }>(`/posts/${postId.value}/comments`, {
            params: {
                page: commentsPage.value,
                limit: commentsPageSize,
            }
        });
        console.log("Comments response:", response.data);

        const fetchedComments = response.data?.data || [];
        const pagination = response.data?.pagination || { totalItems: 0 };
        comments.value = [...comments.value, ...fetchedComments];
        hasMoreComments.value = comments.value.length < pagination.totalItems;
        commentsPage.value += 1;
    } catch (error) {
        console.error("Error fetching comments:", error);
        ElMessage.error("加载评论失败");
    } finally {
        commentsLoading.value = false;
    }
};

const loadMoreComments = () => {
    if (!commentsLoading.value && hasMoreComments.value) {
        fetchComments();
    }
};

const handleLikePost = async () => {
    if (!post.value || likeLoading.value || !userStore.userInfo) {
        if (!userStore.userInfo) {
            ElMessage.warning('请先登录再点赞');
        }
        return;
    }
    likeLoading.value = true;
    try {
        console.log(`Toggling like for post ID: ${postId.value}`);
        const response = await api.post<{ likes: number; isLiked: boolean }>(`/posts/${postId.value}/like`);
        console.log(`[PostDetail like] Received raw data: likes=${response.data?.likes}, isLiked=${response.data?.isLiked}`);
        likeCount.value = response.data.likes;
        isLiked.value = response.data.isLiked;
        console.log(`[PostDetail like] State updated: likeCount=${likeCount.value}, isLiked=${isLiked.value}`);
    } catch (error: any) {
        console.error("Error toggling post like:", error);
        const message = error.response?.data?.message || "操作失败，请稍后再试";
        ElMessage.error(message);
    } finally {
        likeLoading.value = false;
    }
};

const handleAddComment = async (content: string): Promise<boolean> => {
    if (!post.value || !postId.value || !userStore.userInfo) {
        ElMessage.warning('请先登录再发表评论');
        return false;
    }
    if (!content.trim()) {
        ElMessage.warning('评论内容不能为空');
        return false;
    }

    const finalContent = replyingTo.value ? `@${replyingTo.value.username} ${content}` : content;

    console.log(`Adding comment for post ID: ${postId.value}, Content: ${finalContent}`);
    try {
        const response = await api.post<CommentInfo>(`/posts/${postId.value}/comments`, { 
            content: finalContent
        });
        
        ElMessage.success('评论发表成功');
        replyingTo.value = null;
        comments.value = [];
        commentsPage.value = 1;
        hasMoreComments.value = true;
        await fetchComments();
        commentsCount.value = (post.value?._count?.comments ?? 0) + 1; 
        if(post.value?._count) post.value._count.comments += 1;

        return true;

    } catch (error: any) {
        console.error("Error adding comment:", error);
        const message = error.response?.data?.message || "评论失败，请稍后再试";
        ElMessage.error(message);
        return false;
    }
};

const handleReply = (author: PostAuthorInfo) => {
    console.log('Replying to:', author);
    replyingTo.value = author;
};

const formattedContent = (content?: string) => {
    return content ? content.replace(/\n/g, '<br>') : '';
};

const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        ElMessage.success('链接已复制到剪贴板');
    }, () => {
        ElMessage.error('复制链接失败');
    });
    console.log('Sharing URL:', url);
};

const handleAddToCollection = async () => {
    if (!post.value || isAlreadyCollected.value || addingToCollection.value) return;
    addingToCollection.value = true;
    try {
        const collectionData = {
            collectedId: Number(post.value.id),
            type: 'post' as const,
            title: post.value.title || '社区帖子',
            imageUrl: post.value.imageUrls?.[0] || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=Post',
            link: `/post/${post.value.id}`
        };
        console.log("Adding to collection:", collectionData);
        await userStore.addCollection(collectionData);
        ElMessage.success('收藏成功');
    } catch (error) {
        console.error("Error adding post to collection:", error);
        ElMessage.error('收藏失败');
    } finally {
        addingToCollection.value = false;
    }
};

onMounted(() => {
    if (postId.value) {
        fetchPostDetails();
    } else {
        console.error("Post ID is invalid on mount.");
        loading.value = false;
    }
});

watch(() => route.params.id, (newId, oldId) => {
    if (newId !== oldId && postId.value) {
        console.log(`Post ID changed from ${oldId} to ${newId}, refetching...`);
        fetchPostDetails();
    }
});

</script>

<style scoped lang="scss">
.post-detail-container {
    max-width: 800px;
    margin: 20px auto;
    padding: 0 15px;
}

.page-header {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .header-content {
        font-size: 18px;
        color: var(--el-text-color-primary);
    }
}

.post-content-card,
.comments-section-card {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
    padding: 20px 25px;
    margin-bottom: 20px;
}

.author-info {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .author-avatar {
        margin-right: 12px;
    }

    .author-details {
        display: flex;
        flex-direction: column;

        .author-username {
            font-weight: 600;
            font-size: 15px;
            color: var(--el-text-color-primary);
            margin-bottom: 3px;
        }

        .post-time {
            font-size: 12px;
            color: var(--el-text-color-secondary);
        }
    }
}

.post-body {
    font-size: 15px;
    line-height: 1.8;
    color: var(--el-text-color-regular);
    margin-bottom: 15px;
    white-space: pre-wrap;
    word-break: break-word;
}

.post-images {
    margin-bottom: 25px;
}

.post-image-item {
    max-width: 100%;
    max-height: 500px;
    border-radius: 4px;
    display: block;
    margin-bottom: 10px;
}

.post-actions {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    gap: 15px;

    .el-button {
        padding: 8px 5px;
    }
}

.comments-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.loading-state,
.not-found {
    padding: 40px 20px;
    text-align: center;
}

.like-icon {
    vertical-align: middle;
}

.like-count {
    margin-left: 4px;
    vertical-align: middle;
}
</style>