import { socketIoServer } from '../app/app.service';
import { connection } from '../app/database/mysql';
import { AccessLogModel } from './access-log.model';

/**
 * 创建访问日志
 */
export const createAccessLog = async (accessLog: AccessLogModel) => {
  //准备查询
  const statement = `
        INSERT INTO access_log
        SET ?
    `;
  //执行查询
  const [data] = await connection.promise().query(statement, accessLog);
  //触发日志已创建事件
  socketIoServer.emit('accessLogCreated', accessLog.action);
  //提供数据
  return data;
};
