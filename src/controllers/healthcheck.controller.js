import { httpCodes } from "../constants.js";

import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    return res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, {}, "Application is up and running"));
});

export { healthcheck };
