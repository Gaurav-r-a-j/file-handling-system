import express, { Express } from "express";
import cors from "cors";
import "dotenv/config";
import serverless from "serverless-http";
import imageRoutes from "./routes/imageRoutes";

// dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5002;
app.use(cors())

app.use(express.json());
app.use("/api/images", imageRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something broke!" });
  }
);

// For local development
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// For serverless deployment
export const handler = serverless(app);
