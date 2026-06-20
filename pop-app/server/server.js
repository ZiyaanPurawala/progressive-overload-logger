const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const workoutRoutes = require("./routes/workoutRoutes");

require("dotenv").config();
console.log("JWT_SECRET =", process.env.JWT_SECRET);

const app = express();

// Middleware

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", workoutRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Progressive Overload Logger API Running");
});


// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });