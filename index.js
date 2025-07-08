import express from "express";
import bodyParser from "body-parser";

import auth from "./routes/auth.js";
import events_crud from "./routes/events_crud.js";
import events_enrollment from "./routes/events_enrollment.js";
import events_location from "./routes/events_location.js";
import events from "./routes/events.js";

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(auth);
app.use(events_crud);
app.use(events);
app.use(events_enrollment);
app.use(events_location);

app.listen(3128, () => console.log("Corriendo")); 