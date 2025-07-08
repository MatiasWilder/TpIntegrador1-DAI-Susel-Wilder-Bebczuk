import { Router } from "express";
const router = Router();

router.get("/api/event", async(req, res) => {
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

router.get("/api/event/:id", async(req, res) => {
    const resp = (await client.query("SELECT * FROM events e INNER JOIN event_locations el ON e.id_event_location=el.id INNER JOIN locations l ON el.id_location=l.id INNER JOIN provinces p ON l.id_province=p.id INNER JOIN users u ON e.id_creator_user=u.id")).rows;
    res.json(resp[0]);
});

export default router;