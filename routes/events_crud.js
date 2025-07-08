import { Router } from "express";
import jwt from "jsonwebtoken";
import client from "../bd.js";

const router = Router();
const secretkey = "vendo brownies vendo brownies 12345678 ay AY $!$&&/$#";

router.post("/api/event", async(req, res) => {
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

router.put("/api/event", async(req, res) => {
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

router.delete("/api/event/:id", async(req, res) => {
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

export default router;