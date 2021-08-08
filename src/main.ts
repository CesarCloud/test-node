import app from './app';
import {APP_PORT} from './app/app.config';
import {connection} from './app/database/mysql';

app.listen(APP_PORT,()=>{
  console.log('服务已启动');
})

/**
 * 测试使用数据连接服务
 */
connection.connect(error=>{
  if(error){
    console.log('数据库连接失败',error.message);
    return;
  }
  console.log('成功连接数据库');
})