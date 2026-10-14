import express from 'express';
import formidable,{ errors as formidableErrors } from 'formidable';
import path from 'path';
import fsPromises from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const router = express.Router();
const pad = (n) => String(n).padStart(2,"0");
router.post("/",async (req,res,next) => {
  let nowDate= new Date();
  let year = nowDate.getFullYear();
  let month = nowDate.getMonth()+1;
  let day = nowDate.getDate();
  const uploadDir = path.resolve(import.meta.dirname,`../UploadFile/${year}${pad(month)}${pad(day)}`);
  try{
    let stat = await fsPromises.stat(uploadDir);
    if(!stat.isDirectory()){  
      await fsPromises.mkdir(uploadDir,{recursive:true});
    }
  }catch(error){
    await fsPromises.mkdir(uploadDir);
  }
  const form= formidable({
    filename:(name,ext,part,form) => {
      const unique = randomUUID().replace(/-/g,""); 
      const { originalFilename, mimetype} = part;
      return `${unique}_${originalFilename}`;
    },
    uploadDir
  });
  form.parse(req,(err,fields,files) => {
    if(err){
      next(err);
      return;
    }

    res.json({fields,files});
  })
});
export default router;