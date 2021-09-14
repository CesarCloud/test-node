import { AuditLogStatus } from 'src/audit-log/audit-log.model';
import { TokenPayload } from 'src/auth/auth.interface';
import { connection } from '../app/database/mysql';
import { PostModel } from './post.model';
import { sqlFragment } from './post.provider';

/**
 * 获取内容列表
 */
export interface GetPostsOptionsFilter {
  name: string;
  sql?: string;
  param?: string;
  params?: Array<string>;
}
export interface GetPostsOptionsPagination {
  limit: number;
  offset: number;
}
export enum PostStatus {
  published = 'published',
  draft = 'draft',
  archived = 'archived',
}
interface GetPostsOptions {
  sort?: string;
  filter?: GetPostsOptionsFilter;
  pagination?: GetPostsOptionsPagination;
  currentUser?: TokenPayload;
  status?: PostStatus;
  auditStatus?: AuditLogStatus;
}

export const getPosts = async (options: GetPostsOptions) => {
  const {
    sort,
    filter,
    pagination: { limit, offset },
    currentUser,
    status,
    auditStatus,
  } = options;

  //SQL参数
  let params: Array<any> = [limit, offset];
  //设置SQL参数
  if (filter.param) {
    params = [filter.param, ...params];
  }
  if (filter.params) {
    params = [...filter.params, ...params];
  }
  //当前用户
  const { id: userId } = currentUser;
  //发布状态条件
  const whereStatus = status
    ? `post.status='${status}'`
    : 'post.status IS NOT NULL';
  //审核状态
  const whereAuditStatus = auditStatus
    ? `AND audit.status='${auditStatus}'`
    : '';
  const statement = `
    SELECT
        post.id,
        post.title,
        post.content,
        post.status,
        ${sqlFragment.user},
        ${sqlFragment.totalComments},
        ${sqlFragment.file},
        ${sqlFragment.tags},
        ${sqlFragment.totalLikes},
        ${sqlFragment.audit},
        (
          SELECT COUNT(user_like_post.postId)
          FROM user_like_post
          WHERE
            user_like_post.postId=post.id
            && user_like_post.userId = ${userId}
        )as liked
    FROM post
        ${sqlFragment.leftJoinUser}
        ${sqlFragment.innerJoinOneFile}
        ${sqlFragment.leftJoinTag}
        ${sqlFragment.leftJoinOneAuditLog}
        ${(filter.name = 'userLiked' ? sqlFragment.innerJoinUserLikePost : '')}
    WHERE ${filter.sql} AND ${whereStatus} ${whereAuditStatus}
    GROUP BY post.id
    ORDER BY ${sort}
    LIMIT ?
    OFFSET ?
    `;
  const [data] = await connection.promise().query(statement, params);
  return data;
};

/**
 * 创建内容
 */
export const createPost = async (post: PostModel) => {
  const statement = `
    INSERT INTO post
    SET?
    `;
  //执行查询
  const [data] = await connection.promise().query(statement, post);
  //提供数据
  return data;
};

/**
 * 更新内容
 */
export const updatePost = async (postId: number, post: PostModel) => {
  //准备查询
  const statement = `
    UPDATE post
    SET ?
    WHERE id = ?
    `;

  //执行查询

  const [data] = await connection.promise().query(statement, [post, postId]);
  //提供数据
  return data;
};

/**
 * 删除内容
 */
export const deletePost = async (postId: number) => {
  //准备查询
  const statement = `
        DELETE FROM post
        WHERE id =?
    `;
  //执行查询
  const [data] = await connection.promise().query(statement, postId);

  //提供数据
  return data;
};

/**
 * 保存内容标签
 */
export const createPostTag = async (postId: number, tagId: number) => {
  //准备查询
  const statement = `
        INSERT INTO post_tag(postId,tagId)
        VALUES(?,?)
    `;
  //执行查询
  const [data] = await connection.promise().query(statement, [postId, tagId]);
  //提供数据
  return data;
};

/**
 * 检查内容标签
 */
export const postHasTag = async (postId: number, tagId: number) => {
  //准备查询
  const statement = `
       SELECT * FROM post_tag
       WHERE postId=? AND tagId=?
    `;
  //执行查询
  const [data] = await connection.promise().query(statement, [postId, tagId]);
  //提供数据
  return data[0] ? true : false;
};

/**
 * 移除内容标签
 */
export const deletePostTag = async (postId: number, tagId: number) => {
  //准备查询
  const statement = `
    DELETE FROM post_tag
    WHERE postId =? AND tagId=?
  `;
  //执行查询
  const [data] = await connection.promise().query(statement, [postId, tagId]);
  //提供数据
  return data;
};
/**
 * 统计内容数量
 */
export const getPostsTotalCount = async (options: GetPostsOptions) => {
  const { filter, status, auditStatus } = options;
  //SQL参数
  let params = [filter.param];
  if (filter.params) {
    params = [...filter.params, ...params];
  }
  //发布状态条件
  const whereStatus = status
    ? `post.status='${status}'`
    : 'post.status IS NOT NULL';
  //审核状态
  const whereAuditStatus = auditStatus
    ? `AND audit.status='${auditStatus}'`
    : '';
  //准备查询
  const statement = `
        SELECT
            COUNT(DISTINCT post.id) AS total
        FROM post
        ${sqlFragment.leftJoinUser}
        ${sqlFragment.innerJoinFile}
        ${sqlFragment.leftJoinTag}
        ${sqlFragment.leftJoinOneAuditLog}
        ${(filter.name = 'userLiked' ? sqlFragment.innerJoinUserLikePost : '')}
        WHERE ${filter.sql} AND ${whereStatus} ${whereAuditStatus}
    `;
  //执行查询
  const [data] = await connection.promise().query(statement, params);
  //提供结果
  return data[0].total;
};
/**
 * 按ID调取内容
 */
export interface GetPostByIdOptions {
  currentUser: TokenPayload;
}
export const getPostById = async (
  postId: number,
  options: GetPostByIdOptions = {
    currentUser: undefined,
  },
) => {
  const {
    currentUser: { id: userId },
  } = options;
  //准备查询
  const statement = `
    SELECT
        post.id,
        post.title,
        post.content,
        post.status,
        ${sqlFragment.user},
        ${sqlFragment.totalComments},
        ${sqlFragment.file},
        ${sqlFragment.tags},
        ${sqlFragment.totalLikes},
        ${sqlFragment.audit},
        (
          SELECT COUNT(user_like_post.postId)
          FROM user_like_post
          WHERE
            user_like_post.postId=post.id
            && user_like_post.userId = ${userId}
        )as liked
    FROM post
    ${sqlFragment.leftJoinUser}
    ${sqlFragment.innerJoinOneFile}
    ${sqlFragment.leftJoinTag}
    ${sqlFragment.leftJoinOneAuditLog}
    WHERE post.id =?
  `;
  //执行查询
  const [data] = await connection.promise().query(statement, postId);
  //没有找到内容
  if (!data[0].id) {
    throw new Error('NOT_FOUND');
  }
  //提供数据
  return data[0];
};
