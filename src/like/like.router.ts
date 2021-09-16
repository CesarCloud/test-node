import express from 'express';
import * as likeController from './like.controller';
import { authGuard } from '../auth/auth.middleware';
import { accessLog } from '../access-log/access-log.middleware';

const router = express.Router();
/**
 * 点赞内容
 */
router.post(
  '/posts/:postId/like',
  authGuard,
  accessLog({
    action: 'createUserLikePost',
    resourceType: 'post',
    resourceParamName: 'postId',
  }),
  likeController.storeUserLikePost,
);
/**
 * 取消点赞内容
 */
router.delete(
  '/posts/:postId/like',
  authGuard,
  accessLog({
    action: 'deleteUserLikePost',
    resourceType: 'post',
    resourceParamName: 'postId',
  }),
  likeController.destroyUserLikePost,
);
/**
 * 导出路由
 */
export default router;
