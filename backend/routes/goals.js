import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken';
import Goal from '../models/Goal.js';
import { checkGoalLimit } from '../middleware/checkPlanLimits.js';

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

// GET: Obtener todas las metas
router.get('/', protectRoute, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id });
    res.json(goals);
  } catch (error) { res.status(500).json({ error: 'Error al obtener metas' }); }
});

// POST: Crear una meta nueva
router.post('/', protectRoute, checkGoalLimit, async (req, res) => {
  try {
    const newGoal = new Goal({ ...req.body, userId: req.user.id });
    await newGoal.save();
    res.status(201).json(newGoal);
  } catch (error) { res.status(400).json({ error: 'Error al crear meta' }); }
});

router.put('/:id', protectRoute, async (req, res) => {
  try {
    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: {
        title: req.body.title,
        targetAmount: req.body.targetAmount,
        emoji: req.body.emoji
      }},
      { new: true }
    );
    if (!updatedGoal) return res.status(404).json({ error: 'Meta no encontrada' });
    res.json(updatedGoal);
  } catch (error) { 
    res.status(500).json({ error: 'Error al actualizar meta' }); 
  }
});
// PUT: SUMAR DINERO A LA META (La solución a tu error 404)
router.put('/:id/add', protectRoute, async (req, res) => {
  try {
    const { amount } = req.body;
    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $inc: { currentAmount: Number(amount) } }, // $inc suma automáticamente
      { new: true }
    );
    // Después de const updatedGoal = await Goal.findOneAndUpdate(...)
const goalProgress = (updatedGoal.currentAmount / updatedGoal.targetAmount) * 100;

if (goalProgress >= 90 && goalProgress < 100) {
  await new Notification({
    userId: req.user.id,
    type: 'goal_success',
    message: `🚀 ¡Estás a punto de cumplir tu meta: ${updatedGoal.title}! Falta muy poco.`
  }).save();
}
    if (!updatedGoal) return res.status(404).json({ error: 'Meta no encontrada' });
    res.json(updatedGoal);
  } catch (error) { res.status(500).json({ error: 'Error al actualizar ahorro' }); }
});

// DELETE: Borrar una meta
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Eliminado' });
  } catch (error) { res.status(500).json({ error: 'Error al eliminar' }); }
});

export default router;