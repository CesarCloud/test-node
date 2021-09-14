import { Request, Response, NextFunction } from 'express';
import { AuditLogStatus } from './audit-log.model';
import {
  createAuditLog,
  deleteAuditLog,
  getAuditLogByResource,
} from './audit-log.service';

/**
 * 创建审核日志
 */
export const store = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const data = await createAuditLog(request.body);
    //做出响应
    response.status(201).send(data);
  } catch (error) {
    next(error);
  }
};
/**
 * 取消审核
 */
export const revoke = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const { resourceId, resourceType } = request.body;
  const { id: userId } = request.user;
  try {
    const [auditLog] = await getAuditLogByResource({
      resourceId,
      resourceType,
    });
    const canRevokeAudit =
      auditLog &&
      auditLog.status === AuditLogStatus.pending &&
      auditLog.userId === userId;
    if (canRevokeAudit) {
      await deleteAuditLog(auditLog.id);
    } else {
      throw new Error('BAD_REQUEST');
    }
    response.send({ message: '成功取消审核' });
  } catch (error) {
    next(error);
  }
};
