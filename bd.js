import dotenv from "dotenv";
import { Client } from "pg"

dotenv.config();
const client = new Client({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDB,
})

client.connect();
export default client;