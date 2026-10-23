import express from 'express';
import formidable,{ errors as formidableErrors } from 'formidable';
import path from 'path';
import fsPromises from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import mongoose, { Schema,model } from 'mongoose';
import { Writable } from 'node:stream';

const fileSchema = new Schema({
  name:String,
  ext:String,
  mimetype:String,
  file:Buffer,
  createTime:{
    type:Date,
    default:Date.now
  }
});
const FileModel = model('upload_file',fileSchema);

const router = express.Router();
const pad = (n) => String(n).padStart(2,"0");
router.post("/",async (req,res,next) => {
  const form = formidable({
    fileWriteStreamHandler(file){
      console.log(file)
      let chunks = [];
      const fileWriteable = new Writable({
        write(chunk,encoding,callback){
          chunks.push(chunk);
          callback();
        },
        async final(cb){
          try{  
            let buf = Buffer.concat(chunks);
            let { originalFilename, mimetype} = file;
            let ext =  originalFilename.split(".").pop() || "";
            let fileDoc = new FileModel({
              file:buf,
              name:originalFilename,
              mimetype,
              ext
            });
            await fileDoc.save();
            file._mongoId = fileDoc._id;
            cb();
          }catch(error){
            cb();
          }
        }
      });
      return fileWriteable;
    },
  });
  let fields;
  let files;
  try{
    [fields,files] = await form.parse(req);
    // console.log(files);
    res.json({files});
  }catch(error){
    next(error);
  }
  // let nowDate= new Date();
  // let year = nowDate.getFullYear();
  // let month = nowDate.getMonth()+1;
  // let day = nowDate.getDate();
  // const uploadDir = path.resolve(import.meta.dirname,`../UploadFile/${year}${pad(month)}${pad(day)}`);
  // try{
  //   let stat = await fsPromises.stat(uploadDir);
  //   if(!stat.isDirectory()){  
  //     await fsPromises.mkdir(uploadDir,{recursive:true});
  //   }
  // }catch(error){
  //   await fsPromises.mkdir(uploadDir);
  // }
  // const form = formidable({
  //   filename:(name,ext,part,form) => {
  //     const unique = randomUUID().replace(/-/g,""); 
  //     const { originalFilename, mimetype} = part;
  //     return `${unique}_${originalFilename}`;
  //   },
  //   // uploadDir
  // });
  // form.parse(req,(err,fields,files) => {
  //   if(err){
  //     next(err);
  //     return;
  //   }

  //   res.json({fields,files});
  // })
});
export default router;