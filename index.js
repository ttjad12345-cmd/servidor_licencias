const express = require('express');
const app = express();
app.use(express.json());

const licenciasNube = {
    "PRO-2026-JUAN": { plan: "pro", areas: 6, activa: true, hardwareId: null },
    "START-2026-ANA": { plan: "starter", areas: 2, activa: true, hardwareId: null }
};

app.post('/api/validar', (req, res) => {
    const { licencia, hardwareId } = req.body;
    const registro = licenciasNube[licencia];

    if (!registro || !registro.activa) {
        return res.json({ valido: false, mensaje: "Licencia inválida o inactiva." });
    }

    if (!registro.hardwareId) {
        registro.hardwareId = hardwareId;
    } else if (registro.hardwareId !== hardwareId) {
        return res.json({ valido: false, mensaje: "La licencia ya está en uso en otro equipo." });
    }

    res.json({ valido: true, plan: registro.plan, areas: registro.areas });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
