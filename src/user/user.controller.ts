import { Request, Response, NextFunction, response } from 'express';
import * as userService from './user.service';
import _ from 'lodash';

/**
 * 创建用户
 */
export const store =async(
    request:Request,
    response:Response,
    next:NextFunction
)=>{
    //准备数据
    const {name,password}=request.body;
    //创建用户
    try {
        const data =await userService.createUser({name,password});
        response.status(201).send(data);
    } catch (error) {
        next(error);
    }
};
/**
 * 用户账户
 */
 export const show= async(
    request:Request,
    response:Response,
    next:NextFunction
)=>{
    //准备数据
    const {userId}=request.params;
    //调取用户
    try {
        const user = await userService.getUserById(parseInt(userId,10));
        if(!user){
            return next(new Error('USER_NOT_FOUNT'));
        }
        //做出响应
        response.send(user);
    } catch (error) {
        next(error);
    }
};

/**
 * 更新用户
 */
 export const update= async(
    request:Request,
    response:Response,
    next:NextFunction
)=>{
    //准备数据
    const{id}=request.user;
    const userData=_.pick(request.body.update,['name','password']);
    //更新用户
    try {
        const data=await userService.updateUser(id,userData);
        //做出响应
        response.send(data);
    } catch (error) {
        next(error);
    }
};