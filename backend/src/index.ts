import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
require("dotenv").config();
import path from "path";
import fs from "fs";

const app = express();

// router
import router from '../routes/index.route';

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    // origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// make upload dir
const uploadDir = path.join(__dirname, "../public/upload");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// routes
app.use("/api", router);

// app.use("/file", express.static(path.join(__dirname, "../public/upload")));

// server
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
