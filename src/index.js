import express from "express";
import bcrypt  from "bcryptjs";
import mongoose from "mongoose";
import fs from "fs";
import { fileURLToPath } from 'url'; 
import path, { dirname } from "path";
import {randomString} from "./utils.js";
import middleware from "./middleware.js";
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
const __dirname = dirname(fileURLToPath(import.meta.url));
const writeError = fs.createWriteStream(path.join(__dirname,"./Error/error.log"),{flags:"a"})
const app = express();
middleware(app);
const requireLogin = (req,res,next) => {
  if(!req.session.userId) return res.json({status:1,message:"用户未登录或登录已超时"});
  next();
}

app.get("/test-session", (req,res) => {
  req.session.views = (req.session.views || 0) + 1;
  res.send(`这是第${req.session.views}次访问`);
});

app.post("/api/user/update/password",requireLogin,async (req,res) => {
  let findOne = await User.findOne({_id:req.session.id})
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

app.post("/api/user/update",requireLogin,async (req,res) => {
  let findOne = await User.findOne({_id:req.session.userId})
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

app.post("/api/user/login",async (req,res) => {
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
  req.session.userId = findOne._id;
  req.session.username = findOne.username;
  res.json({status:0,message:"登录成功",userId:findOne._id});
});

app.post("/api/user/logout",requireLogin,async (req,res) => {
  req.session = null;
  res.json({status:0,message:"登出成功"});
});

app.get("/api/user/info",requireLogin, async (req,res) => {
  let findOne = await User.findOne({_id:req.session.userId}).select(["_id", ...Object.keys(extraUserInfo)]);
  if(!findOne){
    return res.json({status:1,message:"用户不存在"});
  }else{
    res.json({status:0,message:"获取用户信息成功",user:findOne});
  }
})

app.post("/api/user/register",async (req,res) => {
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
  req.session.userId = user._id;
  req.session.username = req.body.username;
  res.json({status:0,message:"注册成功"});
});

app.get("/api/return-cookie",(req,res) => {
  res.send(req.cookies)
});

app.use((err,req,res,next) => {
  writeError.write(err.stack+'\n');
  res.status(500).send(err.message);
});

async function main(){
  await mongoose.connect("mongodb://127.0.0.1:27017/test_user_system")
}

main().then( () => {
  app.listen(3000,() => {
    console.log("Server is listening on port 3000");
  })
}).catch((error => {
  console.log(error);
}))