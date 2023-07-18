import { Router } from 'express';
import {
  addComment,
  createThread,
  editThread,
  getCategoriesAndTags,
  getChildComments,
  getRootComments,
  getThread,
  getThreadList,
  likeComment,
  likeThread
} from '../controllers/thread';

export default (router: Router) => {
  router.get('/thread/:threadId', getThread);
  router.get('/rootComments', getRootComments);
  router.get('/childComments', getChildComments);
  router.post('/comment', addComment); // need authentiate
  router.post('/thread', createThread); // need authenticate
  router.get('/threads', getThreadList);
  router.get('/likeThread', likeThread); // needd authenticate
  router.get('/likeComment', likeComment); // need authenticate
  router.get('/thread_categories_tags', getCategoriesAndTags);
  router.post('/editThread', editThread); // nedd authenticate
};
