import express from 'express';
import { accessControl, authGuard } from '../auth/auth.middleware';
import * as commentController from './comment.controller';
import { filter } from './comment.middleware';
import { paginate } from '../post/post.middleware';
import { COMMENTS_PER_PAGE } from '../app/app.config';
import { accessLog } from '../access-log/access-log.middleware';

const router = express.Router();
/**
 * 发表评论
 */
router.post(
  '/comments',
  authGuard,
  accessLog({
    action: 'createComment',
    resourceType: 'comment',
    resourceParamName: 'body.content',
  }),
  commentController.store,
);
/**
 * 回复评论
 */
router.post(
  '/comments/:commentId/reply',
  authGuard,
  accessLog({
    action: 'createCommentReply',
    resourceType: 'comment',
    resourceParamName: 'commentId',
    payloadParam: 'body.content',
  }),
  commentController.reply,
);
/**
 * 修改评论
 */
router.patch(
  '/comments/:commentId',
  authGuard,
  accessControl({ possession: true }),
  accessLog({
    action: 'updateComment',
    resourceType: 'comment',
    resourceParamName: 'commentId',
    payloadParam: 'body.content',
  }),
  commentController.update,
);
/**
 * 删除评论
 */
router.delete(
  '/comments/:commentId',
  authGuard,
  accessControl({ possession: true }),
  accessLog({
    action: 'deleteComment',
    resourceType: 'comment',
    resourceParamName: 'commentId',
  }),
  commentController.destroy,
);
/**
 * 评论列表
 */
router.get(
  '/comments',
  filter,
  paginate(COMMENTS_PER_PAGE),
  accessLog({
    action: 'getComment',
    resourceType: 'comment',
  }),
  commentController.index,
);
/**
 * 回复列表
 */
router.get(
  '/comments/:commentId/replies',
  accessLog({
    action: 'getCommentReplies',
    resourceType: 'comment',
  }),
  commentController.indexReplies,
);
/**
 * 导出路由
 */
export default router;
