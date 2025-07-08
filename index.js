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
    let where = "WHERE ";
    let values = []
    for(const attr in req.query){
        where += `${attr}=$${values.length + 1} AND `;
        values.push(req.query[attr]);
    }
    where = where.slice(0, where.length - 5);
    
    if(where == "where ") where = "";

    const resp = (await client.query("SELECT id, name, description, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_event_location, id_creator_user FROM events " + where, values)).rows;
    res.json(resp);
});

app.get("/api/event/:id", async(req, res) => {
    const resp = (await client.query("SELECT * FROM events e INNER JOIN event_locations el ON e.id_event_location=el.id INNER JOIN locations l ON el.id_location=l.id INNER JOIN provinces p ON l.id_province=p.id INNER JOIN users u ON e.id_creator_user=u.id")).rows;
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

    const resp = (await client.query("SELECT * FROM users WHERE username=$1 AND password=$2", [username, password])).rows;
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

    await client.query("INSERT INTO users(first_name, last_name, username, password) VALUES ($1, $2, $3, $4)", [first_name, last_name, username, password]);
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
        idusuario = parseInt(jwt.verify(token, secretkey).id);
    } catch{
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }

    if(!name || !description || name.length < 3 || description < 3){
        res.status(400).json({ error: "Nombre o descripción inválida" });
        return;
    }

    if(parseInt(max_assistance) > parseInt(max_capacity)){
        res.status(400).json({ error: "La asistencia máxima excede la capacidad máxima" });
        return;
    }

    if(parseInt(price) < 0 || parseInt(duration_in_minutes) < 0){
        res.status(400).json({ error: "El precio o la duración son menores que cero" });
        return;
    }

    const id_location = (await client.query("INSERT INTO locations(name, id_province, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id", [location, id_province, latitude, longitude])).rows[0].id;
    const id_event_location = (await client.query("INSERT INTO event_locations(id_location, name, full_adress, max_capacity, latitude, longitude, id_creator_user) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id", [parseInt(id_location), location, full_address, parseInt(max_capacity), parseInt(latitude), parseInt(longitude), idusuario])).rows[0].id;
    await client.query("INSERT INTO events(name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [name, description, parseInt(id_event_location), start_date, parseInt(duration_in_minutes), parseInt(price), enabled_for_enrollment, parseInt(max_assistance), idusuario]);

    res.status(201).send();
});

app.put("/api/event", async(req, res) => {
    const {
        name,
        id_event,
        description,
        start_date,
        duration_in_minutes,
        price,
        enabled_for_enrollment,
        max_assistance,
        max_capacity,
        token
    } = req.body;
    
    let idusuario;
    try{
        idusuario = parseInt(jwt.verify(token, secretkey).id);
    } catch{
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }

    const event = (await client.query("SELECT * FROM events WHERE id=$1", [id_event])).rows;
    if(event.length == 0 || event[0].id_creator_user != idusuario){
        res.status(404).json({ error: "Evento no encontrado" });
        return;
    }

    if((name && name.length < 3) || (description && description < 3)){
        res.status(400).json({ error: "Nombre o descripción inválida" });
        return;
    }

    if(max_assistance && max_capacity && parseInt(max_assistance) > parseInt(max_capacity)){
        res.status(400).json({ error: "La asistencia máxima excede la capacidad máxima" });
        return;
    }

    if((price && parseInt(price) < 0) || (duration_in_minutes && parseInt(duration_in_minutes) < 0)){
        res.status(400).json({ error: "El precio o la duración son menores que cero" });
        return;
    }

    await client.query("UPDATE events SET name=$1, description=$2, start_date=$3, duration_in_minutes=$4, price=$5, enabled_for_enrollment=$6, max_assistance=$7 WHERE id=$8",
    [name, description, start_date, parseInt(duration_in_minutes), parseInt(price), enabled_for_enrollment, parseInt(max_assistance), id_event]);

    res.status(201).send();
});

app.delete("/api/event/:id", async(req, res) => {
    const { token } = req.body;
    
    let idusuario;
    try{
        idusuario = parseInt(jwt.verify(token, secretkey).id);
    } catch{
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }
    
    const event = (await client.query("SELECT * FROM events WHERE id=$1", [req.params.id])).rows;
    if(event.length == 0 || event[0].id_creator_user != idusuario){
        res.status(404).json({ error: "Evento no encontrado" });
        return;
    }

    await client.query("DELETE FROM events WHERE id=$1", [req.params.id]);

    res.status(200).send(event[0]);
});

app.listen(3128, () => console.log("Corriendo")); 