import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});


import  app  from "./app.js";

// app.listen(process.env.PORT, () => {
//   console.log(`app running on ${process.env.PORT}`);
// });


export default app;