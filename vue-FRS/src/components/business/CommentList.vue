<template>
  <div class="comment-list">
    <!-- 发表评论输入框 -->
    <div class="add-comment">
      <el-input ref="commentInputRef" v-model="newCommentContent" placeholder="留下你的精彩评论吧..." :rows="2" type="textarea" resize="none"
        maxlength="200" show-word-limit />
      <el-button type="primary" @click="submitComment" :disabled="!newCommentContent"
        :loading="isSubmitting">发表评论</el-button>
    </div>

    <!-- 评论列表 -->
    <div v-if="comments && comments.length">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <el-avatar :size="32" :src="comment.author.avatar || defaultAvatar" class="comment-avatar" />
        <div class="comment-body">
          <div class="comment-header">
            <span class="username">{{ comment.author.username }}</span>
            <span class="time">{{ formatRelativeTime(comment.createdAt) }}</span>
          </div>
          <div class="comment-content">
            <span v-if="comment.replyTo">回复 <span class="reply-user">@{{ comment.replyTo.username }}</span>: </span>
            {{ comment.content }}
          </div>
          <div class="comment-actions">
            <el-button text size="small" @click="replyToComment(comment.author)">
              <el-icon style="margin-right: 4px;"><ChatLineRound /></el-icon>
              回复
            </el-button>
            <!-- 可以添加点赞评论等操作 -->
          </div>
        </div>
      </div>

      <!-- 加载更多评论 -->
      <div class="load-more" v-if="hasMore">
        <el-button text @click="$emit('load-more')" :loading="loading">加载更多评论</el-button>
      </div>
    </div>
    <el-empty description="还没有评论，快来抢沙发吧！" v-else-if="!loading"></el-empty>

  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, nextTick } from 'vue';
import type { CommentInfo, PostAuthorInfo } from '@/types/api';
import { ElInput, ElButton, ElAvatar, ElEmpty, ElMessage, ElIcon } from 'element-plus';
import defaultAvatar from '@/assets/images/default-avatar.png';
import { formatRelativeTime } from '@/utils/timeFormatter.ts';
import { ChatLineRound } from '@element-plus/icons-vue';

const props = defineProps<{
  postId: number | string;
  comments: CommentInfo[];
  hasMore: boolean;
  loading: boolean;
}>();

const emit = defineEmits(['load-more', 'add-comment', 'reply-clicked']);

const newCommentContent = ref('');
const isSubmitting = ref(false);
const commentInputRef = ref<InstanceType<typeof ElInput> | null>(null);

const submitComment = async () => {
  if (!newCommentContent.value.trim()) {
    ElMessage.warning('评论内容不能为空');
    return;
  }
  isSubmitting.value = true;
  try {
    emit('add-comment', newCommentContent.value);
    newCommentContent.value = '';
  } catch (error) {
    console.error('Error occurred during submitComment (likely in parent handler):', error);
  } finally {
    isSubmitting.value = false;
  }
};

const replyToComment = (author: PostAuthorInfo) => {
  emit('reply-clicked', author);
  nextTick(() => {
    commentInputRef.value?.focus();
  });
};

</script>

<style scoped lang="scss">
.comment-list {
  padding: 15px 0;
}

.add-comment {
  display: flex;
  align-items: flex-start; // 让按钮和文本域顶部对齐
  margin-bottom: 25px;

  .el-textarea {
    margin-right: 10px;
  }

  .el-button {
    flex-shrink: 0; // 防止按钮被压缩
  }
}

.comment-item {
  display: flex;
  padding: 15px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }

  .comment-avatar {
    margin-right: 12px;
    flex-shrink: 0;
  }

  .comment-body {
    flex-grow: 1;

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;

      .username {
        font-weight: bold;
        font-size: 14px;
        color: #555;
      }

      .time {
        font-size: 12px;
        color: #999;
      }
    }

    .comment-content {
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      white-space: pre-wrap;

      .reply-user {
        color: var(--el-color-primary);
        cursor: pointer;
      }
    }

    .comment-actions {
      margin-top: 8px;
      text-align: right;

      .el-button {
        padding: 0 5px; // 减小按钮间距
      }
    }
  }
}

.load-more {
  text-align: center;
  margin-top: 15px;
}
</style>