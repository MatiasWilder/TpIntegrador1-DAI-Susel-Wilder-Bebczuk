import { Router } from "express";
import jwt from "jsonwebtoken";
import client from "../bd.js";

const router = Router();
const secretkey = "vendo brownies vendo brownies 12345678 ay AY $!$&&/$#";

router.post("/api/user/login", async(req, res) => {
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

router.post("/api/user/register", async(req, res) => {
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

export default router;