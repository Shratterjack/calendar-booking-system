import express from "express";

import { loadEnvFile } from "node:process";
loadEnvFile(); // Loads .env

import cors from "cors";
import { getFirebaseApp } from "./config/firebase.ts";

import eventRouter from "./events/routes/events.route.ts";

const app = express();
const router = express.Router();

const port = process.env.PORT;

app.use(cors());
app.use(express.json()); // for parsing application/json

router.use("/events", eventRouter);
app.use("/", router);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  getFirebaseApp();
});
