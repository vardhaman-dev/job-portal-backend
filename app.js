// app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (_, res) => res.send("Job Portal API Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
