const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conexión a MongoDB usando la variable de entorno que guardaste en Render
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado a MongoDB Atlas exitosamente'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Definir cómo se guarda una licencia en la base de datos
const licenciaSchema = new mongoose.Schema({
  clave: { type: String, required: true, unique: true },
  plan: { type: String, required: true },
  areas: { type: Number, required: true },
  activa: { type: Boolean, default: true },
  hardwareId: { type: String, default: null }
});

const Licencia = mongoose.model('Licencia', licenciaSchema);

// Ruta para validar la licencia desde tu aplicación de escritorio
app.post('/api/validar', async (req, res) => {
  try {
    const { clave, hardwareId } = req.body;

    if (!clave) {
      return res.status(400).json({ valido: false, mensaje: 'Clave no proporcionada' });
    }

    // Buscar la licencia en MongoDB (ignorando mayúsculas/minúsculas)
    const licenciaEncontrada = await Licencia.findOne({ 
      clave: clave.trim().toUpperCase() 
    });

    if (!licenciaEncontrada) {
      return res.json({ valido: false, mensaje: 'La clave de licencia no existe.' });
    }

    if (!licenciaEncontrada.activa) {
      return res.json({ valido: false, mensaje: 'Esta licencia está desactivada.' });
    }

    // Si ya tiene un hardwareId registrado y es diferente, rechazar (evita compartir licencia en otra PC)
    if (licenciaEncontrada.hardwareId && licenciaEncontrada.hardwareId !== hardwareId) {
      return res.json({ valido: false, mensaje: 'Esta licencia ya está en uso en otro equipo.' });
    }

    // Si no tiene hardwareId registrado, se lo asociamos a esta PC
    if (!licenciaEncontrada.hardwareId && hardwareId) {
      licenciaEncontrada.hardwareId = hardwareId;
      await licenciaEncontrada.save();
    }

    // Si todo es correcto, devolvemos los datos del plan y áreas
    res.json({
      valido: true,
      plan: licenciaEncontrada.plan,
      areas: licenciaEncontrada.areas,
      mensaje: 'Licencia válida'
    });

  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ valido: false, mensaje: 'Error interno en el servidor' });
  }
});

// Ruta auxiliar para agregar licencias fácilmente desde el navegador o Postman (Opcional)
app.post('/api/crear', async (req, res) => {
  try {
    const { clave, plan, areas } = req.body;
    const nuevaLicencia = new Licencia({
      clave: clave.trim().toUpperCase(),
      plan,
      areas,
      activa: true
    });
    await nuevaLicencia.save();
    res.json({ exito: true, mensaje: 'Licencia creada correctamente en MongoDB' });
  } catch (error) {
    res.status(400).json({ exito: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
