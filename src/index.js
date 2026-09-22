import 'dotenv/config';
import express from "express";
import fs from "fs";
import { fileURLToPath } from 'url'; 
import path, { dirname } from "path";
import middleware from "./middleware.js";
import mongoose from "mongoose";
import router from "./router/index.js";
import { exec } from "child_process"; 
const __dirname = dirname(fileURLToPath(import.meta.url));
const writeError = fs.createWriteStream(path.join(__dirname,"./Error/error.log"),{flags:"a"})
const app = express();
middleware(app);
router(app);

app.use((err,req,res,next) => {
  writeError.write(err.stack+'\n');
  res.status(500).send(err.message);
});

async function main(){
  await mongoose.connect("mongodb://127.0.0.1:27017/test_user_system")
}

main().then( () => {
  app.listen(3000,() => {
    exec("start chrome http://localhost:3000");
    console.log("Server is listening on port 3000");
  })
}).catch((error => {
  console.log(error);
}))