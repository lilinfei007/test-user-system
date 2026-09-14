const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const writeError = fs.createWriteStream(path.join(__dirname,"./Error/error.log"),{flags:"w+"})
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.post("/api/user/register",(req,res) => {
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
  res.json({status:0,message:"注册成功"});
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