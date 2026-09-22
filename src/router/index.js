import user from './user.js';
const base = '/api';
export default function(app){
  app.use(`${base}/user`,user);
}