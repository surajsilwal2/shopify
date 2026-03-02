import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser'
import {errorMiddleware} from '@repo/shared'
import router from "./routes/auth-route.js";
import SwaggerUi from "swagger-ui-express"
// @ts-ignore: allow importing JSON from api-contract package without types
import openapi from "@repo/api-contract/openapi.json";
import { initSessionCleanup } from "./jobs/session-cleanup.js";


const app = express();
// Start the cron job
initSessionCleanup();

app.use(
  cors({
    origin: "http://localhost:3000",
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

//Swagger FIRST
app.use("/docs", SwaggerUi.serve, SwaggerUi.setup(openapi));

// Routes
app.use("/api", router);

// health/root routes
app.get("/", (req, res) => {
  res.send({ message: "Hello API" });
});

// ERROR LAST ALWAYS
app.use(errorMiddleware)

const port = process.env.PORT || 6001;

const server = app.listen(port, () => {
  console.log(`Auth Service is running on http://localhost:${port}/api`);
});

server.on("error", (err) => {
  console.log(`Server Error`, err);
});
