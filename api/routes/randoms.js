const express = require('express');
const { fork } = require("child_process");
const randomsRoutes = express.Router();

randomsRoutes.get('/', async (req, res) => {
    console.log('sin parametro');
    let cant = 100000000;
    const child = fork("./api/helper/number.js");
    const information = {
        message: "start",
        min: 1,
        max: 1000,
        quantity: cant
    }
    child.send(information);
    child.on("message", (result) => {
        res.send(result);
    });
});

randomsRoutes.get('/:cant', async (req, res) => {
    console.log('con parametro');
    let cant = req.params.cant;
    const child = fork("./api/helper/number.js");
    const information = {
        message: "start",
        min: 1,
        max: 1000,
        quantity: cant
    }
    child.send(information);
    child.on("message", (result) => {
      res.send(result);
    });
});

randomsRoutes.use(function(req, res, next) {
    if (!req.route) {
        let message = { error : -2, descripcion: `ruta ${req.baseUrl} método ${req._parsedUrl.pathname} no implementada` }
        res.send(message);
    }
});

module.exports = randomsRoutes;