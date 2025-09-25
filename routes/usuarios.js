const express = require('express');
const { body, validationResul } = require('express-validator');
const router = express.Router();

const {
    obtenerUsuarios
} = require('../controllers/usuarioController');

//RUTAS
router.get('/',obtenerUsuarios);

module.exports = router;