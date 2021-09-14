import path from 'path';
import Jimp from 'jimp';
import fs, { Stats } from 'fs';
import { connection } from '../app/database/mysql';
import { FileModel } from './file.model';
import { TokenPayload } from '../auth/auth.interface';
import { getPostById, PostStatus } from '../post/post.service';
import { getAuditLogByResource } from '../audit-log/audit-log.service';
import { AuditLogStatus } from '../audit-log/audit-log.model';

/**
 * 存储文件信息
 */
export const createFile = async (file: FileModel) => {
  //准备查询
  const statement = `
        INSERT INTO file
        SET ?
    `;
  //执行查询
  const [data] = await connection.promise().query(statement, file);
  //提供数据
  return data;
};

/**
 * 按照ID查找文件
 */
export const findFileById = async (fileId: number) => {
  //准备查询
  const statement = `
        SELECT * FROM file
        WHERE id = ?
    `;
  //执行查询
  const [data] = await connection.promise().query(statement, fileId);
  //提供数据

  return data[0];
};
/**
 * 调整图像尺寸
 */
export const imageResizer = async (image: Jimp, file: Express.Multer.File) => {
  //图像尺寸
  const { imageSize } = image['_exif'];
  //文件路径
  const filePath = path.join(file.destination, 'resized', file.filename);
  //大尺寸
  if (imageSize.width > 1280) {
    image
      .resize(1280, Jimp.AUTO)
      .quality(85)
      .write(`${filePath}-large`);
  }
  //中尺寸
  if (imageSize.width > 640) {
    image
      .resize(640, Jimp.AUTO)
      .quality(85)
      .write(`${filePath}-medium`);
  }
  //小尺寸
  if (imageSize.width > 320) {
    image
      .resize(320, Jimp.AUTO)
      .quality(85)
      .write(`${filePath}-thumbnail`);
  }
};
/**
 * 找出内容相关文件
 */

export const getPostFiles = async (postId: number) => {
  const statement = `
        SELECT
            file.filename
        FROM
            file
        WHERE
            postId=?
    `;
  //执行
  const [data] = await connection.promise().query(statement, postId);
  //提供数据
  return data as any;
};

/**
 * 删除内容文件
 */
export const deletePostFiles = async (files: Array<FileModel>) => {
  const uploads = 'uploads';
  const resized = [uploads, 'resized'];
  files.map(file => {
    const filesToDelete = [
      [uploads, file.filename],
      [...resized, `${file.filename}-thumbnail`],
      [...resized, `${file.filename}-medium`],
      [...resized, `${file.filename}-large`],
    ];
    filesToDelete.map(item => {
      const filePath = path.join(...item);
      fs.stat(filePath, (error, stats) => {
        if (stats) {
          fs.unlink(filePath, error => {
            if (error) throw error;
          });
        }
      });
    });
  });
};

/**
 * 检查文件权限
 */
interface FileAccessControlOptions {
  file: FileModel;
  currentUser: TokenPayload;
}
export const fileAccessControl = async (options: FileAccessControlOptions) => {
  const { file, currentUser } = options;
  const ownFile = file.userId === currentUser.id;
  const isAdmin = currentUser.id === 1;
  const parentPost = await getPostById(file.postId, { currentUser });
  const [parentPostAuditLog] = await getAuditLogByResource({
    resourceId: file.postId,
    resourceType: 'post',
  });
  const isPublished = parentPost.status === PostStatus.published;
  const isApproved =
    parentPostAuditLog && parentPostAuditLog.status === AuditLogStatus.approved;
  const canAccess = ownFile || isAdmin || (isPublished && isApproved);
  if (!canAccess) {
    throw new Error('FORBIDDEN');
  }
};
