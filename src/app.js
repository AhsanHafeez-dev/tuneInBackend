import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
// import { logger } from "./utils/logger.js";
import morgan from "morgan";

const app = express();

// const morganFormat = ":method :url :status :response-time ms";
// const morganStream = {
//   write: (message) => {
//     logger.info(message.trim());
//   },
// };
// app.use(morgan(morganFormat, { stream: morganStream }));

app.use(cookieParser());
app.use(
  cors({
    origin: [
      "*",
      "https://tune-in-frontend.vercel.app/",
      "https://tune-in-frontend.vercel.app",
    ],
    allowedHeaders: ["Authorization","Content-Type"],
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));



import { ApiError } from "./utils/ApiError.js";
import { httpCodes } from "./constants.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import { errorHandler } from "./utils/ErrorHanlder.js";



import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";



//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)






app.get("/api/v1/error", (req, res) => {
  throw new ApiError(httpCodes.notImplemented, "fine");
});
app.get("/",(req,res)=>{res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok,{message:"everything is fine"},"hello"))})


app.use(errorHandler);
export { app };
