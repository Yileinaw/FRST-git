<template>
  <div class="community-view">
    <div class="header-section">
      <h2>交流分享</h2>
      <el-button type="primary" :icon="EditPen" @click="openCreatePostDialog">发布新帖</el-button>
    </div>

    <el-tabs v-model="activeSortTab" @tab-change="handleSortChange">
      <el-tab-pane label="最新发布" name="createdAt"></el-tab-pane>
      <el-tab-pane label="热门帖子" name="hot"></el-tab-pane>
    </el-tabs>

    <div class="post-list-wrapper" data-cy="post-list-wrapper">
      <el-skeleton :rows="5" animated v-if="loading" data-cy="skeleton-loading" />
      <PostList
        v-else-if="posts.length > 0"
        :posts="posts"
        @post-clicked="goToPostDetail"
        @like-toggled="handlePostLikeToggled"
        data-cy="post-list"
      />
      <el-empty description="还没有帖子呢，快来发布第一条吧！" v-else data-cy="empty-posts" />
    </div>

    <el-pagination
      v-if="!loading && totalPosts > pageSize"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="totalPosts"
      @current-change="handlePageChange"
      layout="prev, pager, next"
      background
      class="community-pagination"
    />

    <CreatePostDialog v-model="createPostDialogVisible" @post-success="handlePostSuccess" />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { EditPen } from '@element-plus/icons-vue';
import type { PostInfo } from '@/types/post.d.ts';
import api from '@/services/api';
import PostList from './components/PostList.vue';
import { useUserStore } from '@/store/modules/user';
import { ElMessage } from 'element-plus';
import CreatePostDialog from '@/components/business/CreatePostDialog.vue';

// Log the imported api instance to check its structure
console.log('[CommunityView] Imported API service:', api);

const router = useRouter();
const loading = ref(false);
const posts = ref<PostInfo[]>([]);
const activeSortTab = ref('createdAt');
const currentPage = ref(1);
const pageSize = ref(15);
const totalPosts = ref(0);
const totalPages = ref(1);
const userStore = useUserStore();
const createPostDialogVisible = ref(false);

const sortMapping: { [key: string]: { sortBy: string, sortOrder: 'asc' | 'desc' } } = {
  createdAt: { sortBy: 'createdAt', sortOrder: 'desc' },
  hot: { sortBy: 'hot', sortOrder: 'desc' },
};

const fetchPosts = async () => {
  console.log('[CommunityView] fetchPosts called.'); // Log start of fetchPosts
  loading.value = true;
  posts.value = [];
  try {
    const sortParams = sortMapping[activeSortTab.value] || sortMapping.createdAt;
    console.log(`[CommunityView] Preparing to fetch posts. Page: ${currentPage.value}, Limit: ${pageSize.value}, Sort:`, sortParams); // Log before API call

    // --- API Call (Corrected Path) --- 
    // Assuming baseURL in api.ts already includes /api
    const response = await api.get('/posts', {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        sortBy: sortParams.sortBy,
        sortOrder: sortParams.sortOrder,
      }
    });
    // --- End API Call ---

    console.log('[CommunityView] API response received:', response.data); // Log successful response data

    const fetchedPosts = response.data.posts.map((post: any) => {
      console.log(`[CommunityView fetch] Mapping post ID ${post.id}: likes=${post._count?.likes}, isLiked=${post.isLiked}`);
      return {
        id: post.id,
        title: post.title,
        authorId: post.author.id,
        authorName: post.author.username,
        createdAt: post.createdAt,
        replyCount: post._count.comments,
        likeCount: post._count.likes,
        isLiked: post.isLiked ?? false,
      };
    });

    posts.value = fetchedPosts;
    totalPosts.value = response.data.totalPosts;
    totalPages.value = response.data.totalPages;
    currentPage.value = response.data.currentPage;

  } catch (error: any) { // Catch specific error type if known, or use any
    console.error("[CommunityView] Error fetching posts:", error);
    // Log more details from the error object if available
    if (error.response) {
      console.error("[CommunityView] Error response data:", error.response.data);
      console.error("[CommunityView] Error response status:", error.response.status);
      console.error("[CommunityView] Error response headers:", error.response.headers);
    } else if (error.request) {
      console.error("[CommunityView] Error request:", error.request);
    } else {
      console.error("[CommunityView] Error message:", error.message);
    }
    // Optionally show user message here
  } finally {
    loading.value = false;
    console.log('[CommunityView] fetchPosts finished.'); // Log end of fetchPosts
  }
};

const handleSortChange = (tabName: string | number) => {
  console.log(`[CommunityView] Sort changed to: ${tabName}`);
  if (typeof tabName === 'string') {
    activeSortTab.value = tabName;
    currentPage.value = 1;
    fetchPosts();
  }
};

const handlePageChange = (page: number) => {
  console.log(`[CommunityView] Page changed to: ${page}`);
  currentPage.value = page;
  fetchPosts();
};

const goToPostDetail = (postId: number) => {
  router.push(`/post/${postId}`);
};

const openCreatePostDialog = () => {
  if (!userStore.userInfo) {
    ElMessage.warning('请先登录再发帖');
    return;
  }
  createPostDialogVisible.value = true;
};

const handlePostSuccess = () => {
  createPostDialogVisible.value = false;
  fetchPosts();
};

const handlePostLikeToggled = async ({ postId, currentState }: { postId: number, currentState: boolean }) => {
    if (!userStore.userInfo) {
        ElMessage.warning('请先登录再点赞');
        return;
    }
    
    console.log(`[CommunityView] Like toggled for post ${postId}, current state: ${currentState}`);
    
    const postIndex = posts.value.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    try {
        const response = await api.post<{ likes: number; isLiked: boolean }>(`/posts/${postId}/like`);
        console.log(`[CommunityView like] Received raw data for post ${postId}: likes=${response.data?.likes}, isLiked=${response.data?.isLiked}`);
        if (postIndex !== -1) {
            posts.value[postIndex].likeCount = response.data.likes;
            posts.value[postIndex].isLiked = response.data.isLiked;
            console.log(`[CommunityView like] Post ${postId} state updated: likeCount=${posts.value[postIndex].likeCount}, isLiked=${posts.value[postIndex].isLiked}`);
        }

    } catch (error: any) {
        console.error(`[CommunityView] Error toggling like for post ${postId}:`, error);
        ElMessage.error(error.response?.data?.message || "操作失败，请稍后再试");
    }
};

onMounted(() => {
  console.log('[CommunityView] Component mounted, calling fetchPosts...'); // Log onMounted start
  fetchPosts();
});

</script>

<style scoped lang="scss">
.community-view {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
  }
}

.post-list-wrapper {
  min-height: 300px;
  margin-bottom: 20px;
}

.community-pagination {
  margin-top: 30px;
  justify-content: center;
}
</style>