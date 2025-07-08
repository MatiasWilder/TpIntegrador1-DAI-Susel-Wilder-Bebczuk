import { Router } from "express";
import jwt from "jsonwebtoken";
import client from "../bd.js";

const router = Router();
const secretkey = "vendo brownies vendo brownies 12345678 ay AY $!$&&/$#";

router.get("/api/event-location", async(req, res) => {
    const { token } = req.body;

    let idusuario;
    try{
        idusuario = parseInt(jwt.verify(token, secretkey).id);
    } catch{
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }

    let data = (await client.query("SELECT el.name, el.max_capacity, el.full_address, el.latitude, el.longitude FROM event_enrollments ee INNER JOIN events e ON ee.id_event=e.id INNER JOIN event_locations el ON e.id_event_location=el.id WHERE ee.id_user=$1", [idusuario])).rows;
    res.status(200).send(data);
});

router.get("/api/event-location/:id", async(req, res) => {
    const { token } = req.body;

    let idusuario;
    try{
        idusuario = parseInt(jwt.verify(token, secretkey).id);
    } catch{
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }

    const event = (await client.query("SELECT * FROM events WHERE id=$1", [req.params.id])).rows;
    if(event.length == 0){
        res.status(404).json({ error: "Evento no encontrado" });
        return;
    }

    let data = (await client.query("SELECT el.name, el.max_capacity, el.full_address, el.latitude, el.longitude FROM event_enrollments ee INNER JOIN events e ON ee.id_event=e.id INNER JOIN event_locations el ON e.id_event_location=el.id WHERE ee.id_user=$1 AND ee.id_event=$2", [idusuario, req.params.id])).rows;
    if(data.length == 0){
        res.status(404).json({ error: "Evento no encontrado" });
        return;
    }
    
    res.status(200).send(data[0]);
});

export default router;