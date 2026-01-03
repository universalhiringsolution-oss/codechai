const asyncHandler_utils =(requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));

    }
}




export { asyncHandler_utils }





























// const asyncHandler_utils = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json({ success: false, message: error.message || ' Server Error' });
//     }
// }







