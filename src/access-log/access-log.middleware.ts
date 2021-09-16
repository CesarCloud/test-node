import { Request, Response, NextFunction, request } from 'express';
import { createAccessLog } from './access-log.service';
import _ from 'lodash';

/**
 * 访问日志
 */
interface AccessLogOptions {
  action: string;
  resourceType?: string;
  resourceParamName?: string;
  payloadParam?: string;
}

export const accessLog = (options: AccessLogOptions) => (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  //解构选项
  const {
    action,
    resourceType,
    resourceParamName = null,
    payloadParam = null,
  } = options;
  let payload = null;
  if (payloadParam) {
    payload = _.get(request, payloadParam, null);
  }
  //当前用户
  const { id: userId, name: userName } = request.user;
  //资源ID
  const resourceId = resourceParamName
    ? parseInt(request.params[resourceParamName], 10)
    : null;
  //头部数据
  const {
    referer,
    origin,
    'user-agent': agent,
    'access-language': language,
  } = request.headers;

  //请求
  const {
    ip,
    originalUrl,
    method,
    query,
    params,
    route: { path },
  } = request;
  //日志数据
  const accessLog = {
    userId,
    userName,
    action,
    resourceType,
    resourceId,
    payload,
    ip,
    origin,
    referer,
    agent,
    language,
    originalUrl,
    method,
    query: Object.keys(query).length ? JSON.stringify(query) : null,
    params: Object.keys(params).length ? JSON.stringify(params) : null,
    path,
  };
  //创建日志
  createAccessLog(accessLog);
  //下一步
  next();
};
