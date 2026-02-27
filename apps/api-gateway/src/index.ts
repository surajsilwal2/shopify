import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import proxy from 'express-http-proxy'

const app = express();
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: true }))
app.use(morgan("dev"));

app.use(cors({
    origin: 'http://localhost:3001',
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: any) => (req.user ? 1000 : 100),
  message: { error: "too many request" },
 keyGenerator: (req: any) => `${ipKeyGenerator(req)}:${req.user?.id ?? "anon"}`,
  legacyHeaders: true,
  standardHeaders: true,
});
app.use(limiter)

app.get("/gateway-health", (req, res) => {
  res.send({ message: "Welcome to api-gateway!" });
});

app.use("/", proxy("http://localhost:6001"));


const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on("error", console.error);
