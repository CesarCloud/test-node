import { Request, Response, NextFunction, request } from 'express';
import _ from 'lodash';
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  createPostTag,
  postHasTag,
  deletePostTag,
  getPostsTotalCount,
  getPostById,
  PostStatus,
} from './post.service';
import { TagModel } from '../tag/tag.model';
import { createTag, getTagByName } from '../tag/tag.service';
import { deletePostFiles, getPostFiles } from '../file/file.service';
import { authGuard } from '../auth/auth.middleware';
import { AuditLogStatus } from '../audit-log/audit-log.model';
import { getAuditLogByResource } from '../audit-log/audit-log.service';
/**
 * 内容列表
 */
export const index = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  //解构查询符号
  const { status = '', auditStatus } = request.query;
  try {
    //统计内容数量
    const totalCount = await getPostsTotalCount({
      filter: request.filter,
      status: status as PostStatus,
      auditStatus: auditStatus as AuditLogStatus,
    });
    //设置响应头部
    response.header('X-Total-Count', totalCount);
  } catch (error) {
    next(error);
  }
  try {
    const posts = await getPosts({
      sort: request.sort,
      filter: request.filter,
      pagination: request.pagination,
      currentUser: request.user,
      status: status as PostStatus,
      auditStatus: auditStatus as AuditLogStatus,
    });
    response.send(posts);
  } catch (error) {
    next(error);
  }
};

/**
 * 创建内容
 */
export const store = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  //准备数据
  const { title, content } = request.body;
  const { id: userId } = request.user;
  //创建内容
  try {
    const data = await createPost({ title, content, userId });
    response.status(201).send(data);
  } catch (error) {
    next(error);
  }
};
/**
 * 更新内容
 */
export const update = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  //获取ID
  const { postId } = request.params;

  //准备数据
  const post = _.pick(request.body, ['title', 'content']);

  //更新

  try {
    const data = await updatePost(parseInt(postId, 10), post);
    response.send(data);
  } catch (error) {
    next(error);
  }
};

/**
 * 删除内容
 */
export const destroy = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  //获取内容ID
  const { postId } = request.params;
  //删除内容
  try {
    const files = await getPostFiles(parseInt(postId, 10));
    if (files.length) {
      await deletePostFiles(files);
    }
    const data = await deletePost(parseInt(postId, 10));
    response.send(data);
  } catch (error) {
    next(error);
  }
};

/**
 * 添加内容标签
 */
export const stortPostTag = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  //准备数据
  const { postId } = request.params;
  const { name } = request.body;

  let tag: TagModel;

  //查找标签
  try {
    tag = await getTagByName(name);
  } catch (error) {
    return next(error);
  }
  //找到标签，验证内容标签
  if (tag) {
    try {
      const postTag = await postHasTag(parseInt(postId, 10), tag.id);
      if (postTag) return next(new Error('POST_ALLREADY_HAS_THIS_TAG'));
    } catch (error) {
      return next(error);
    }
  }
  //没找到标签，创建这个标签
  if (!tag) {
    try {
      const data = await createTag({ name });
      tag = { id: data.insertId };
    } catch (error) {
      return next(error);
    }
  }
  //给内容打上标签
  try {
    await createPostTag(parseInt(postId, 10), tag.id);
    response.sendStatus(201);
  } catch (error) {
    return next(error);
  }
};
/**
 * 移除内容标签
 */
export const destroyPostTag = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  //准备数据
  const { postId } = request.params;
  const { tagId } = request.body;
  //移除内容标签
  try {
    await deletePostTag(parseInt(postId, 10), tagId);
    response.sendStatus(200);
  } catch (error) {
    next(error);
  }
};
/**
 * 单个内容
 */
export const show = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  //准备数据
  const { postId } = request.params;
  const { user: currentUser } = request;
  //调取内容
  try {
    const post = await getPostById(parseInt(postId, 10), {
      currentUser: request.user,
    });
    //审核日志
    const [auditLog] = await getAuditLogByResource({
      resourceId: parseInt(postId, 10),
      resourceType: 'post',
    });
    //检查权限
    const ownPost = post.user.id === currentUser.id;
    const isAdmin = currentUser.id === 1;
    const isPublished = post.status === PostStatus.published;
    const isApproved = auditLog && auditLog.status === AuditLogStatus.approved;
    const canAccess = isAdmin || ownPost || (isPublished && isApproved);

    if (!canAccess) {
      throw new Error('FORBIDDEN');
    }
    //做出响应
    response.send(post);
  } catch (error) {
    next(error);
  }
};
