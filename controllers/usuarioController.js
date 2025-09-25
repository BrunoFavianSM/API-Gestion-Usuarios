const { Usuario } = require('../models');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const obtenerUsuarios = async(req, res) => {
    try{
        const usuarios = await Usuario.findAll({
            attributes: { exclude: ['password'] },//no se envia contraseña
        order: [['createdAt','DESC']]
        });

        res.json({
            success: true,
            message: 'Usuarios Obtenidos Correctamente',
            data: usuarios,
            total: usuarios.length
        });
    }catch(error){
        console.error('Error al obtener usuarios', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

const crearUsuario = async(req, res) => {
    try{
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const { nombre, email, password } = req.body;

        // Verificar si el email ya existe
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Encriptar contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Crear usuario
        const nuevoUsuario = await Usuario.create({
            nombre,
            email,
            password: hashedPassword,
            activo: true
        });

        // Excluir password de la respuesta
        const usuarioResponse = {
            id: nuevoUsuario.id,
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email,
            activo: nuevoUsuario.activo,
            createdAt: nuevoUsuario.createdAt,
            updatedAt: nuevoUsuario.updatedAt
        };

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: usuarioResponse
        });

    }catch(error){
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

const actualizarUsuario = async(req, res) => {
    try{
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { nombre, email, password, activo } = req.body;

        // Buscar usuario
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar si el email ya existe en otro usuario
        if (email && email !== usuario.email) {
            const emailExistente = await Usuario.findOne({ 
                where: { 
                    email,
                    id: { [require('sequelize').Op.ne]: id }
                } 
            });
            if (emailExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado por otro usuario'
                });
            }
        }

        // Preparar datos para actualizar
        const datosActualizacion = {};
        if (nombre !== undefined) datosActualizacion.nombre = nombre;
        if (email !== undefined) datosActualizacion.email = email;
        if (password !== undefined) {
            const saltRounds = 10;
            datosActualizacion.password = await bcrypt.hash(password, saltRounds);
        }
        if (activo !== undefined) datosActualizacion.activo = activo;

        // Actualizar usuario
        await usuario.update(datosActualizacion);

        // Obtener usuario actualizado sin password
        const usuarioActualizado = await Usuario.findByPk(id, {
            attributes: { exclude: ['password'] }
        });

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: usuarioActualizado
        });

    }catch(error){
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

const eliminarUsuario = async(req, res) => {
    try{
        const { id } = req.params;

        // Buscar usuario
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Eliminar usuario
        await usuario.destroy();

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente',
            data: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email
            }
        });

    }catch(error){
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

const obtenerUsuarioPorId = async(req, res) => {
    try{
        const { id } = req.params;
        
        const usuario = await Usuario.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Usuario obtenido correctamente',
            data: usuario
        });

    }catch(error){
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

module.exports = {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
};