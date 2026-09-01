const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Asegúrate de que tu modelo de Mongoose esté apuntando correctamente a la colección de licencias
const Licencia = mongoose.model('Licencia', new mongoose.Schema({
  clave: String,
  plan: String,
  areas: Number,
  activa: Boolean
}));

app.post('/api/activar', async (req, res) => {
  try {
    const { clave } = req.body;
    if (!clave) {
      return res.json({ exito: false, mensaje: "Clave no proporcionada." });
    }

    // Limpiamos espacios y pasamos a mayúsculas
    const claveLimpia = clave.trim().toUpperCase();

    // Buscamos ignorando espacios accidentales guardados en la base de datos
    const licenciaEncontrada = await Licencia.findOne({ 
      clave: { $regex: new RegExp(`^\\s*${claveLimpia}\\s*$`, "i") } 
    });

    if (!licenciaEncontrada || !licenciaEncontrada.activa) {
      return res.json({ exito: false, mensaje: "Clave inválida o inactiva." });
    }

    res.json({
      exito: true,
      plan: licenciaEncontrada.plan,
      areas: licenciaEncontrada.areas || licenciaEncontrada.areasPermitidas || 1
    });

  } catch (error) {
    res.json({ exito: false, mensaje: "Error interno en el servidor." });
  }
});

// Mantén tu conexión a MongoDB y puerto de la manera en que ya los tengas configurados aquí abajo...
