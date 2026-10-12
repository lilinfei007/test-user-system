import user from './user.js';
import upload from './upload.js'
const base = '/api';
export default function(app){
  app.use(`${base}/user`,user);
  app.use(`${base}/upload`,upload)
}