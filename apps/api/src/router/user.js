import express from "express";
import bcrypt  from "bcryptjs";
import mongoose from "mongoose";
import {randomString} from "../utils.js";
import jwt from "jsonwebtoken";
const router = express.Router();
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
const userSchema = new Schema({
  password:String,
});
const extraUserInfo = {
  username:String,
  phoneNumber:String,
  email:String
}

userSchema.add(extraUserInfo);

const User = mongoose.model("user",userSchema);

const requireLogin = (req,res,next) => {
  // console.log();
  if(!req.cookies.token) return res.json({status:1,message:"用户未登录或登录已超时"});
  try{
    let decoded = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    req.user = decoded;
    next();
  }catch(error){
    res.json({status:1,message:"用户未登录或登录已超时"});
  }
  // if(!req.user.userId) return res.json({status:1,message:"用户未登录或登录已超时"});
}

router.post("/update/password",requireLogin,async (req,res) => {
  let findOne = await User.findOne({_id:req.user.userId})
  if(!findOne){
    return res.json({status:1,message:"用户不存在"});
  }
  if(req.body.reset){
    let password = randomString(6);
    findOne.password = bcrypt.hashSync(password,10);
    await findOne.save();
    return res.json({status:0,message:"重置密码成功",password});
  }else{
    if(!req.body.password) return res.json({status:1,message:"旧密码不能为空"});
    let isSame = bcrypt.compareSync(req.body.password,findOne.password);
    if(!isSame){
      return res.json({status:1,message:"旧密码错误"});
    }
    if(!req.body.newPassword) return res.json({status:1,message:"新密码不能为空"});
    if(req.body.newPassword.length < 6) return res.json({status:1,message:"新密码长度不能小于6"});
    findOne.password = bcrypt.hashSync(req.body.newPassword,10);
    await findOne.save();
    return res.json({status:0,message:"修改密码成功"});
  }
});

router.post("/update",requireLogin,async (req,res) => {
  let findOne = await User.findOne({_id:req.user.userId})
  if(!findOne){
    return res.json({status:1,message:"用户不存在"});
  }
  let safeKeys = Object.keys(extraUserInfo);
  safeKeys.forEach(key => {
    if(key in req.body){
      findOne[key] = req.body[key];
    }
  });
  await findOne.save();
  res.json({status:0,message:"更新成功"});
});

router.post("/login",async (req,res) => {
  if(typeof req.body.username !== "string") return res.json({status:1,message:"用户名类型必须为字符串"});
  if(req.body.username.length == 0) return res.json({status:1,message:"用户名不能为空"});
  if(typeof req.body.password !== "string") return res.json({status:1,message:"密码类型必须为字符串"});
  if(req.body.password.length == 0){
    return res.json({status:1,message:"密码不能为空"});
  }
  let findOne = await User.findOne({username:req.body.username});
  if(!findOne){
    return res.json({status:1,message:"用户不存在或密码错误"});
  }
  let checkPassword = bcrypt.compareSync(req.body.password,findOne.password);
  if(!checkPassword){
    return res.json({status:1,message:"用户不存在或密码错误"});
  }
  const token = jwt.sign({
    userId:findOne._id,
    username:findOne.username
  },process.env.JWT_SECRET,{
    expiresIn:"1d"
  });
  res.cookie("token",token,{
    expires:new Date(Date.now() + 1000 * 60 * 60 * 24)
  });
  res.json({status:0,message:"登录成功",userId:findOne._id,token});
});

router.post("/logout",requireLogin,async (req,res) => {
  res.json({status:0,message:"登出成功"});
});

router.get("/info",requireLogin, async (req,res) => {
  let findOne = await User.findOne({_id:req.user.userId}).select(["_id", ...Object.keys(extraUserInfo)]);
  if(!findOne){
    return res.json({status:1,message:"用户不存在"});
  }else{
    res.json({status:0,message:"获取用户信息成功",user:findOne});
  }
})

router.post("/register",async (req,res) => {
  if(typeof req.body.username !== "string") return res.json({status:1,message:"用户名类型必须为字符串"});
  if(req.body.username.length == 0){
    return res.json({status:1,message:"用户名不能为空"});
  }
  if(typeof req.body.password !== "string") return res.json({status:1,message:"密码类型必须为字符串"});
  if(req.body.password.length == 0){
    return res.json({status:1,message:"密码不能为空"});
  }
  if(req.body.password.length < 6){
    return res.json({status:1,message:"密码长度不能小于6"});
  }

  let findOne = await User.findOne({username:req.body.username}).lean();
  if(findOne){
    return res.json({status:1,message:"用户已存在"});
  }
  let password= bcrypt.hashSync(req.body.password,10); 
  let user = new User({
    username:req.body.username,
    password:password
  });
  await user.save();
  const token = jwt.sign({
    userId:findOne._id,
    username:findOne.username
  },process.env.JWT_SECRET,{
    expiresIn:"1d"
  });
  res.cookie("token",token,{
    expires:new Date(Date.now() + 1000 * 60 * 60 * 24)
  });
  res.json({status:0,message:"注册成功"});
});

export default router;