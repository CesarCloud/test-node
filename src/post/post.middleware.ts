import { Request, Response, NextFunction } from 'express';
import { PostStatus } from './post.service';

/**
 * 排序方式
 */
export const sort = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  // 获取客户端的排序方式
  const { sort } = request.query;

  // 排序用的 SQL
  let sqlSort: string;

  // 设置排序用的 SQL
  switch (sort) {
    case 'earliest':
      sqlSort = 'post.id ASC';
      break;
    case 'latest':
      sqlSort = 'post.id DESC';
      break;
    case 'most_comments':
      sqlSort = 'totalComments DESC ,post.id DESC';
      break;
    default:
      sqlSort = 'post.id DESC';
      break;
  }

  // 在请求中添加排序
  request.sort = sqlSort;

  // 下一步
  next();
};

/**
 * 过滤列表
 */
export const filter = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  // 解构查询符
  const {
    tag,
    user,
    action,
    cameraMake,
    cameraModel,
    lensMake,
    lensModel,
  } = request.query;

  // 设置默认的过滤
  request.filter = {
    name: 'default',
    sql: 'post.id IS NOT NULL',
  };

  // 按标签名过滤
  if (tag && !user && !action) {
    request.filter = {
      name: 'tagName',
      sql: 'tag.name = ?',
      param: tag as string,
    };
  }

  // 过滤出用户发布的内容
  if (user && action == 'published' && !tag) {
    request.filter = {
      name: 'userPublished',
      sql: 'user.id = ?',
      param: user as string,
    };
  }

  // 过滤出用户赞过的内容
  if (user && action == 'liked' && !tag) {
    request.filter = {
      name: 'userLiked',
      sql: 'user_like_post.userId = ?',
      param: user as string,
    };
  }
  //过滤出用某种相机拍摄的内容
  if (cameraMake && cameraModel) {
    request.filter = {
      name: 'camera',
      sql: `file.metadata->'$.Make'=? AND file.metadata->'$.Model'=?`,
      params: [cameraMake as string, cameraModel as string],
    };
  }
  //过滤出用某种镜头拍摄的内容
  if (lensMake && lensModel) {
    request.filter = {
      name: 'camera',
      sql: `file.metadata->'$.Make'=? AND file.metadata->'$.Model'=?`,
      params: [lensMake as string, lensModel as string],
    };
  }

  // 下一步
  next();
};
/**
 * 内容分页
 */
export const paginate = (itemsPerPage: number) => {
  return async (request: Request, response: Response, next: NextFunction) => {
    //当前页码
    const { page = 1 } = request.query;
    //每页内容数量
    const limit = itemsPerPage || 30;
    //计算出偏移量
    const offset = limit * (Number(page) - 1);
    //设置请求中的分页
    request.pagination = { limit, offset };
    next();
  };
};
/**
 * 验证内容状态
 */
export const validatePostStatus = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const { status = '' } = request.query;
  //检查内容状态是否有效
  const isValidStatus = ['published', 'draft', 'archived', ''].includes(
    status as string,
  );
  if (!isValidStatus) {
    next(new Error('BAD_REQUEST'));
  } else {
    next();
  }
};

/**
 * 模式切换器
 */
export const modeSwitcher = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  //解构查询符
  let { manage, admin } = request.query;
  //管理模式
  const isManageMode = manage === 'true';
  //管理员模式
  const isAdminMode = isManageMode && admin === 'true' && request.user.id === 1;
  if (isManageMode) {
    if (isAdminMode) {
      request.filter = {
        name: 'adminManagePosts',
        sql: 'post.id IS NOT NULL',
        param: '',
      };
    } else {
      request.filter = {
        name: 'adminManagePosts',
        sql: 'user.id=?',
        param: `${request.user.id}`,
      };
    }
  } else {
    //普通模式
    request.query.status = PostStatus.published;
  }
  next();
};
