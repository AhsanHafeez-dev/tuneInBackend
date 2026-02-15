import { Router } from "express";
import {
  addComment,
  addCommentToComment,
  deleteComment,
  getCommentReplies,
  getVideoComments,
  updateComment
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").get(getVideoComments).post(addComment);
route.route("/c/:commentId").post(addCommentToComment).get(getCommentReplies);

router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;
