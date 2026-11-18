import express from "express"
import {listComments, listNews, getNews, addComment} from "../controllers/news.controller.js"
const router = express.Router();


// Public news routes
router.get('/news', listNews);
router.get('/news/:id', getNews);
router.get('/news/:id/comments', listComments);
router.post('/news/:id/comments', addComment);

export default router;