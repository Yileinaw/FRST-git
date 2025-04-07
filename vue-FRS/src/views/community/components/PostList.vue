<template>
  <div class="post-list-component">
    <el-empty description="还没有人发帖，快来抢沙发吧！" v-if="!posts.length"></el-empty>
    <ul class="post-list" v-else data-cy="post-list-ul">
      <li v-for="post in posts" :key="post.id" class="post-item" @click="onPostClick(post.id)" data-cy="post-item">
        <div class="post-avatar">
          <el-avatar :size="40"> {{ post.authorName.charAt(0) }} </el-avatar>
        </div>
        <div class="post-content">
          <h3 class="post-title">{{ post.title }}</h3>
          <div class="post-meta">
            <span class="author">{{ post.authorName }}</span>
            <!-- Ensure formatRelativeTime is available or passed if needed -->
            <span class="time">{{ formatRelativeTime(post.lastReplyAt || post.createdAt) }}</span>
          </div>
        </div>
        <div class="post-stats">
           <span class="replies" @click="onPostClick(post.id)"><el-icon><ChatDotRound /></el-icon>{{ post.replyCount }}</span>
           <el-button 
                text 
                size="small" 
                @click.stop="onLikeClick(post.id, post.isLiked)">
                <el-icon :color="post.isLiked ? 'var(--el-color-primary)' : ''" class="like-icon">
                   <component :is="post.isLiked ? StarFilled : Star" />
                </el-icon>
                <span class="like-count">{{ post.likeCount }}</span>
           </el-button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import type { PropType } from 'vue';
import type { PostInfo } from '@/types/post';
import { ChatDotRound, Pointer, Star, StarFilled } from '@element-plus/icons-vue';
// Import the formatter function
import { formatRelativeTime } from '@/utils/timeFormatter';

// Define Props
const props = defineProps({
  posts: {
    type: Array as PropType<PostInfo[]>,
    required: true,
    default: () => []
  }
});

// Define Emits
const emit = defineEmits(['post-clicked', 'like-toggled']);

// Methods
const onPostClick = (postId: number) => {
  emit('post-clicked', postId);
};

// Method to emit like toggle event
const onLikeClick = (postId: number, currentState: boolean | undefined) => {
    emit('like-toggled', { postId, currentState: !!currentState }); // Pass postId and current state
};
</script>

<style scoped lang="scss">
/* Reuse relevant styles from CommunityView.vue for post-list and post-item */
.post-list-component {
  width: 100%; /* Ensure it takes width */
}

.post-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.post-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &:last-child {
    border-bottom: none;
  }

  .post-avatar {
    margin-right: 15px;
    flex-shrink: 0;
  }

  .post-content {
    flex-grow: 1;
    overflow: hidden;
  }

  .post-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .post-meta {
    font-size: 13px;
    color: var(--el-text-color-secondary);

    .author {
      margin-right: 10px;
    }
  }

  .post-stats {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-left: 20px;
    flex-shrink: 0;

    span {
      display: inline-flex;
      align-items: center;
      margin-left: 15px;

      .el-icon {
        margin-right: 4px;
      }
    }

    .el-button {
        margin-left: 10px; /* Add some space */
        padding: 0 5px; /* Reduce padding */
     }
  }
}

/* Styles for el-empty if needed */
.el-empty {
  padding: 40px 0; /* Add some padding */
}

.like-icon {
  vertical-align: middle;
}
.like-count {
  margin-left: 4px; 
  vertical-align: middle;
}
.post-stats .el-button {
    padding: 0 5px;
}
</style>