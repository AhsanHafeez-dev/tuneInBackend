import multer from "multer";

// const storage = multer.diskStorage(
//     {
//         destination: function (req, file, cb) {
//             cb(null,"./public/temp")
//         },
//         filename: function (req, file, cv) {
//             cb(null, file.originalname)
//         }
//     }
// )

const storage = multer.memoryStorage();
export const upload = multer({ storage });
