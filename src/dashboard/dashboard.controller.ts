import { Request, Response, NextFunction } from 'express';
import { getAccessCounts, getAccessCountByAction } from './dashboard.service';
/**
 * 访问次数列表
 */

export const accessCountIndex = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  //准备数据
  const { filter } = request;
  try {
    const accessCounts = await getAccessCounts({ filter });
    response.send(accessCounts);
  } catch (error) {
    next(error);
  }
};
/**
 * 按动作分时段的访问次数
 */
export const accessCountShow = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  //准备数据
  const {
    params: { action },
    filter,
  } = request;
  const accessCount = await getAccessCountByAction({ action, filter });
  //做出响应
  response.send(accessCount);
  try {
  } catch (error) {
    next(error);
  }
};
