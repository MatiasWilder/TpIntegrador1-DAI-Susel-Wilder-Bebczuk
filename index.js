import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
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
const app = express();
const secretkey = "vendo brownies vendo brownies 12345678 ay AY $!$&&/$#";

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/api/event", async(req, res) => {
    let where = "where ";
    for(const attr in req.query)
        where += `${attr}=${req.query[attr]} and `;
    where = where.slice(0, where.length - 5);
    
    if(where == "where ") where = "";

    const resp = (await client.query("select id, name, description, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_event_location, id_creator_user from events " + where)).rows;
    res.json(resp);
});

app.get("/api/event/:id", async(req, res) => {
    const resp = (await client.query("select * from events e inner join event_locations el on e.id_event_location=el.id inner join locations l on el.id_location=l.id inner join provinces p on l.id_province=p.id inner join users u on e.id_creator_user=u.id")).rows;
    res.json(resp[0]);
});

app.post("/api/user/login", async(req, res) => {
    const { username, password } = req.body;

    if(!username.match(/.+@.+\..+/)){
        res.status(400).json({
            success: false,
            message: "El email es inválido.",
            token: ""
        });
        return;
    }

    const resp = (await client.query(`select * from users where username='${username}' and password='${password}'`)).rows;
    if(!resp || resp.length == 0){
        res.status(401).json({
            success: false,
            message: "Usuario o clave inválida.",
            token: ""
        });
        return;
    }

    const payload = {
        id: resp[0].id
    };

    const options = {
        expiresIn: "3h",
        issuer: "TP Susel Bebczuk Wilder"
    };

    res.json({
        success: true,
        message: "",
        token: jwt.sign(payload, secretkey, options)
    });
});

app.post("/api/user/register", async(req, res) => {
    const { first_name, last_name, username, password } = req.body;
    if(!first_name || !last_name || first_name.length < 3 || last_name.length < 3){
        res.status(400).json({ error: "Nombre o apellido inválidos" });
        return;
    }

    if(!username.match(/.+@.+\..+/)){
        res.status(400).json({ error: "Email/Nombre de usuario inválido" });
        return;
    }

    if(!password || password.length < 3){
        res.status(400).json({ error: "Contraseña inválida" });
        return;
    }

    await client.query(`INSERT INTO users(first_name, last_name, username, password) OUTPUT id VALUES ('${first_name}', '${last_name}', '${username}', '${password}')`);
    res.status(201).send();
});

app.post("/api/event", async(req, res) => {
    const {
        name,
        description,
        start_date,
        duration_in_minutes,
        price,
        enabled_for_enrollment,
        max_assistance,
        location,
        full_address,
        max_capacity,
        latitude,
        longitude,
        id_province,
        token
    } = req.body;

    let idusuario;
    try{
        idusuario = jwt.verify(token, secretkey);
    } catch{
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }

    if(!name || !description || name.length < 3 || description < 3){
        res.status(400).json({ error: "Nombre o descripción inválida" });
        return;
    }

    if(max_assistance > max_capacity){
        res.status(400).json({ error: "La asistencia máxima excede la capacidad máxima" });
        return;
    }

    if(price < 0 || duration_in_minutes < 0){
        res.status(400).json({ error: "El precio o la duración son menores que cero" });
        return;
    }

    await client.query(`INSERT INTO locations(name, id_province, latitude, longitude) VALUES ('${location}', ${id_province}, ${latitude}, ${longitude})`);
    //await client.query("INSERT INTO event_locations(id_location, name, full_adress, max_capacity, latitude, longitude, id_creator_user) VALUES (?, ?, ?, ?, ?, ?, ?);");

    res.status(201).send();
});

app.listen(3128, () => console.log("Corriendo")); 