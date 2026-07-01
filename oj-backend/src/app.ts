import "dotenv/config";
import express from "express";
import submissionRoutes from "./routes/submission.routes";
import healthRoutes from "./routes/health.routes";
import questionRoutes from "./routes/question.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import reviewRoutes from "./routes/review.routes";
import battleRoutes from "./routes/battle.routes";
import discussionRoutes from "./routes/discussion.routes";
import roomRoutes from "./routes/room.routes";
import feedbackRoutes from "./routes/feedback.routes";
import practiceRoutes from "./routes/practice.routes";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000"
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use("/api/submissions", submissionRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/battle", battleRoutes);
app.use("/api/discussion", discussionRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/practice", practiceRoutes);

export default app;

