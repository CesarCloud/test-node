import express from 'express';
import * as userController from './user.controller';
import {
  validateUserData,
  hashPassword,
  validateUpdateUserData,
} from './user.middleware';
import { authGuard } from '../auth/auth.middleware';
import { accessLog } from '../access-log/access-log.middleware';

const router = express.Router();

/**
 * 创建用户
 */
router.post(
  '/users',
  validateUserData,
  hashPassword,
  accessLog({
    action: 'createUser',
    resourceType: 'user',
    payloadParam: 'body.name',
  }),
  userController.store,
);
/**
 * 用户账户
 */
router.get(
  '/users/:userId',
  accessLog({
    action: 'getUserById',
    resourceType: 'user',
    resourceParamName: 'userId',
  }),
  userController.show,
);
/**
 * 更新用户
 */
router.patch(
  '/users',
  authGuard,
  validateUpdateUserData,
  accessLog({
    action: 'updateUser',
    resourceType: 'user',
    payloadParam: 'body.update.name',
  }),
  userController.update,
);
/**
 * 导出路由
 */
export default router;
