const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado a MongoDB Atlas exitosamente'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

const licenciaSchema = new mongoose.Schema({
  clave: { type: String, required: true, unique: true },
  plan: { type: String, required: true },
  areas: { type: Number, required: true },
  activa: { type: Boolean, default: true },
  hardwareId: { type: String, default: null }
});

const Licencia = mongoose.model('Licencia', licenciaSchema);

app.post('/api/validar', async (req, res) => {
  try {
    const { clave, hardwareId } = req.body;

    if (!clave) {
      return.status(400).json({ valido: false, mensaje: 'Clave no proporcionada' });
    }

    const claveLimpia = clave.trim().toUpperCase();
    let licenciaEncontrada = await Licencia.findOne({ clave: claveLimpia });

    // Si la clave es la de administrador y no existe, la creamos automáticamente en este instante
    if (!licenciaEncontrada && claveLimpia === 'ADMIN_TKD_2026') {
      licenciaEncontrada = new Licencia({
        clave: 'ADMIN_TKD_2026',
        plan: 'pro',
        areas: 10,
        activa: true
      });
      await licenciaEncontrada.save();
    }

    if (!licenciaEncontrada) {
      return.json({ valido: false, mensaje: 'La clave de licencia no existe.' });
    }

    if (!licenciaEncontrada.activa) {
      return.json({ valido: false, mensaje: 'Esta licencia está desactivada.' });
    }

    if (licenciaEncontrada.hardwareId && licenciaEncontrada.hardwareId !== hardwareId) {
      return.json({ valido: false, mensaje: 'Esta licencia ya está en uso en otro equipo.' });
    }

    if (!licenciaEncontrada.hardwareId && hardwareId) {
      licenciaEncontrada.hardwareId = hardwareId;
      await licenciaEncontrada.save();
    }

    res.json({
      valido: true,
      plan: licenciaEncontrada.plan,
      areas: licenciaEncontrada.areas,
      mensaje: 'Licencia válida'
    });

  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ valido: false, mensaje: 'Error interno en el servidor: ' + error.message });
  }
});

app.post('/api/crear', async (req, res) => {
  try {
    const { clave, plan, areas } = req.body;
    const claveLimpia = clave.trim().toUpperCase();
    
    // Si ya existe, la actualizamos en lugar de dar error
    await Licencia.findOneAndUpdate(
      { clave: claveLimpia },
      { plan, areas, activa: true },
      { upsert: true, new: true }
    );

    res.json({ exito: true, mensaje: 'Licencia guardada correctamente en MongoDB' });
  } catch (error) {
    res.status(400).json({ exito: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
