const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      console.log(err);
      return next(err);
    });
  };
};

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res
//       .status(error.code || httpCodes.serverSideError)
//       .json({ success: false, message: error.message });
//   }
// };

export { asyncHandler };
