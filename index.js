import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { Client } from "pg"

import auth from "./routes/auth.js";
import events_crud from "./routes/events_crud.js";
import events from "./routes/events.js";

dotenv.config();
const client = new Client({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDB,
})

client.connect();
const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(auth);
app.use(events_crud);
app.use(events);

app.listen(3128, () => console.log("Corriendo")); 