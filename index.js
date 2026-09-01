const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conexión a MongoDB (Render usa la variable de entorno MONGO_URI que ya configuraste)
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

app.post('/api/activar', async (req, res) => {
  try {
    const { clave } = req.body;
    if (!clave) {
      return res.json({ exito: false, mensaje: "Clave no proporcionada." });
    }

    const claveLimpia = clave.trim().toUpperCase();

    // Busca ignorando espacios accidentales en la base de datos
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
