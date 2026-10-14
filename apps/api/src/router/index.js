import user from './user.js';
import upload from './upload.js'
import test from './test.js';
const base = '/api';
export default function(app){
  app.use(`${base}/user`,user);
  app.use(`${base}/upload`,upload);
  app.use(`${base}/test`,test);
}