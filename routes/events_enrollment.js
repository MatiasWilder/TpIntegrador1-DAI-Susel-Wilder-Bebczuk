import { Router } from "express";
import jwt from "jsonwebtoken";
import client from "../bd.js";

const router = Router();
const secretkey = "vendo brownies vendo brownies 12345678 ay AY $!$&&/$#";

router.post("/api/event/:id/enrollment", async(req, res) => {
    const { token } = req.body;

    let idusuario;
    try{
        idusuario = parseInt(jwt.verify(token, secretkey).id);
    } catch{
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }

    let events = (await client.query("SELECT * FROM events WHERE id=$1", [req.params.id])).rows;
    if(events.length == 0){
        res.status(404).json({ error: "Evento no encontrado" });
        return;
    }

    const event = events[0];

    const asistencia = (await client.query("SELECT * FROM event_enrollments WHERE id_event=$1", [req.params.id])).rows;
    if(asistencia.length == event.max_assistance){
        res.status(400).json({ error: "Asistencia máxima alcanzada" });
        return;
    }

    if(new Date(event.start_date) <= new Date((new Date()).toISOString().split("T")[0])){
        res.status(400).json({ error: "El evento ya comenzó" });
        return;
    }

    if(!event.enabled_for_enrollment){
        res.status(400).json({ error: "Las inscripciones al evento no están habilitadas" });
        return;
    }

    if(asistencia.filter(el => el.id_user == idusuario).length != 0){
        res.status(400).json({ error: "El usuario ya está inscripto en el evento" });
        return;
    }

    await client.query("INSERT INTO event_enrollments(id_event, id_user, description, registration_date_time, attended, observations, rating) VALUES ($1, $2, $3, $4, $5, $6, $7)", [parseInt(req.params.id), idusuario, "Inscripción", (new Date()).toISOString().split("T")[0], 0, "Inscripción de un usuario mediante API", 0]);

    res.status(201).send();
});

router.delete("/api/event/:id/enrollment", async(req, res) => {
    const { token } = req.body;

    let idusuario;
    try{
        idusuario = parseInt(jwt.verify(token, secretkey).id);
    } catch{
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }

    let events = (await client.query("SELECT * FROM events WHERE id=$1", [req.params.id])).rows;
    if(events.length == 0){
        res.status(404).json({ error: "Evento no encontrado" });
        return;
    }

    const event = events[0];

    const asistencia = (await client.query("SELECT * FROM event_enrollments WHERE id_event=$1", [req.params.id])).rows;

    if(new Date(event.start_date) <= new Date((new Date()).toISOString().split("T")[0])){
        res.status(400).json({ error: "El evento ya comenzó" });
        return;
    }

    if(asistencia.filter(el => el.id_user == idusuario).length == 0){
        res.status(400).json({ error: "El usuario no está inscripto en el evento" });
        return;
    }

    await client.query("DELETE FROM event_enrollments WHERE id_user=$1", [idusuario]);
    res.status(200).send();
});

export default router;