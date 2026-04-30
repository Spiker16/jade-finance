import express from 'express';
const router = express.Router();
import Notification from '../models/Notification.js';
import Subscription from '../models/Subscription.js';
import jwt from 'jsonwebtoken';
import { checkNotificationsLimit } from '../middleware/checkPlanLimits.js';
// Middleware de protección
const protectRoute = (req, res, next) => {
  // 1. Ahora buscamos el token en las cookies
  const token = req.cookies.token;

  // 2. Si no hay cookie, denegamos el acceso
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Sesión no encontrada.' });
  }

  try {
    // 3. Verificamos el token que sacamos de la cookie
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Guardamos los datos del usuario para las siguientes rutas
    req.user = decoded; 
    
    next();
  } catch (error) {
    console.error("Error al verificar token de cookie:", error.message);
    res.status(401).json({ error: 'Token no válido o expirado' });
  }
};

// --- NUEVA RUTA PARA GUARDAR SUSCRIPCIÓN WEB PUSH ---
router.post('/subscribe', protectRoute, async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.id;

    // Buscamos si ya existe esta suscripción para no duplicar
    const existingSub = await Subscription.findOne({ 
      userId, 
      endpoint: subscription.endpoint 
    });

    if (existingSub) {
      return res.status(200).json({ message: 'Suscripción ya registrada' });
    }

    // Guardamos la nueva "antena" del navegador en la DB
    const newSubscription = new Subscription({
      userId,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });

    await newSubscription.save();
    res.status(201).json({ message: 'Suscripción guardada con éxito' });
  } catch (error) {
    console.error("Error al guardar suscripción:", error);
    res.status(500).json({ error: 'Error interno al suscribir' });
  }
});

// Obtener todas las notificaciones del usuario
router.get('/', protectRoute, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Marcar como leídas
router.put('/read-all', protectRoute, async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
  res.json({ message: 'Actualizadas' });
});

// RUTA PARA ELIMINAR UNA NOTIFICACIÓN
router.delete('/:id', protectRoute, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ msg: 'Notificación no encontrada' });
        }

        // Verificar que la notificación pertenece al usuario
        if (notification.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'No autorizado' });
        }

        await Notification.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Notificación eliminada correctamente' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});

router.delete('/', protectRoute, async (req, res) => {
    try {
        // Borra todas las notificaciones de este usuario
        await Notification.deleteMany({ userId: req.user.id });
        res.json({ msg: 'Todas las notificaciones eliminadas' });
    } catch (err) {
        res.status(500).send('Error en el servidor');
    }
});

export default router;