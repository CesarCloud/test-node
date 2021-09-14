import { Request, Response, NextFunction, request } from 'express';
import { possess } from '../auth/auth.service';
import { AuditLogStatus } from './audit-log.model';
import { getAuditLogByResource } from './audit-log.service';

/**
 * 审核日志守卫
 */
export const auditLogGuard = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  //准备用户
  const { id: userId, name: userName } = request.user;
  //准备数据
  const { resourceId, resourceType, note, status } = request.body;
  //验证资源类型
  const isValidResourceType = ['post', 'commnet'].includes(resourceType);
  if (!isValidResourceType) {
    return next(new Error('BAD_REQUEST'));
  }
  //准备日志数据
  request.body = {
    userId,
    userName,
    resourceType,
    resourceId,
    note,
    status,
  };
  //管理员
  const isAdmin = userId === 1;
  if (!isAdmin) {
    request.body.status = AuditLogStatus.pending;
    //检查是否拥有资源
    try {
      const ownResource = await possess({ resourceId, resourceType, userId });
      if (!ownResource) {
        return next(new Error('USER_DOES_NOT_OWN_RESOURCE'));
      }
    } catch (error) {
      return next(error);
    }
  }
  //检查审核日志状态是否相同
  try {
    const [auditLog] = await getAuditLogByResource({
      resourceId,
      resourceType,
    });
    const isSameStatus = auditLog && auditLog.status === status;
    if (isSameStatus) {
      return next(new Error('BAD_REQUEST'));
    }
  } catch (error) {
    return next(error);
  }
  //下一步
  next();
};
