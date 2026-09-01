const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conexión a MongoDB usando la variable de entorno configurada en Render
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado a MongoDB correctamente'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

const Licencia = mongoose.model('Licencia', new mongoose.Schema({
  clave: String,
  plan: String,
  areas: Number,
  activa: Boolean
}));

app.post(['/api/activar', '/api/validar-licencia'], async (req, res) => {
  try {
    const { clave } = req.body;
    if (!clave) {
      return res.json({ exito: false, mensaje: "Clave no proporcionada." });
    }

    const claveLimpia = clave.trim().toUpperCase();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de licencias corriendo en puerto ${PORT}`);
});
