import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getAllVideosOfUser,
  getVideoById,
  getVideoSuggestions,
  publishAVideo,
  searchQuery,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/signature").get(verifyJWT, getUploadSignature);
router
  .route("/")
  .get(verifyJWT, getAllVideos)

  .post(
    verifyJWT,
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

router.route("/search").get(searchQuery) 
router.route("/:userId").get(getAllVideosOfUser)  
router
  .route("/c/:videoId")
  .get(verifyJWT,getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

router.route("/suggested/:videoId").get(getVideoSuggestions);
export default router;
