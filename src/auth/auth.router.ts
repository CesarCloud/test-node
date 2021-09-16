import express from 'express';
import * as authController from './auth.controller';
import { authGuard, validateLoginData } from './auth.middleware';
import { accessLog } from '../access-log/access-log.middleware';

const router = express.Router();
/**
 * 用户登录
 */
router.post(
  '/login',
  validateLoginData,
  accessLog({
    action: 'login',
    resourceType: 'auth',
    payloadParam: 'body.name',
  }),
  authController.login,
);

/**
 * 定义验证登录接口
 */
router.post('/auth/validate', authGuard, authController.validate);
/**
 * 导出路由
 */
export default router;
