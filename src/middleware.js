import express from "express";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
export default function(app){
  app.use(express.json());
  app.use(express.urlencoded({extended:true}));
  app.use(cookieParser());
  app.use(cookieSession({
    name:"session",
    keys:["key1","key2"],
    maxAge:24*60*60*1000
  }));
}