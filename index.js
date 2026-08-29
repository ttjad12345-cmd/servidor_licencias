const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL: La variable MONGO_URI no está definida en las variables de entorno.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado a MongoDB Atlas exitosamente'))
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  });

const licenciaSchema = new mongoose.Schema({
  clave: { type: String, required: true, unique: true, uppercase: true, trim: true },
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
      return res.status(400).json({ valido: false, mensaje: 'Clave no proporcionada' });
    }

    const claveLimpia = clave.trim().toUpperCase();
    let licenciaEncontrada = await Licencia.findOne({ clave: claveLimpia });

    if (!licenciaEncontrada && claveLimpia === 'ADMIN_TKD_2026') {
      licenciaEncontrada = await Licencia.create({
        clave: 'ADMIN_TKD_2026',
        plan: 'pro',
        areas: 10,
        activa: true
      });
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

    return res.json({
      valido: true,
      plan: licenciaEncontrada.plan,
      areas: licenciaEncontrada.areas,
      mensaje: 'Licencia válida'
    });

  } catch (error) {
    console.error('Error en validación:', error);
    return res.status(500).json({ valido: false, mensaje: 'Error interno en el servidor' });
  }
});

app.post('/api/crear', async (req, res) => {
  try {
    const { clave, plan, areas } = req.body;
    if (!clave || !plan || areas === undefined) {
      return res.status(400).json({ exito: false, error: 'Faltan datos obligatorios (clave, plan, areas)' });
    }

    const claveLimpia = clave.trim().toUpperCase();
    
    await Licencia.findOneAndUpdate(
      { clave: claveLimpia },
      { plan, areas, activa: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ exito: true, mensaje: 'Licencia guardada correctamente en MongoDB' });
  } catch (error) {
    console.error('Error al crear licencia:', error);
    return res.status(400).json({ exito: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de licencias corriendo en el puerto ${PORT}`);
});
