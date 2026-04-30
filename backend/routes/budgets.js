import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import { checkBudgetLimit } from '../middleware/checkPlanLimits.js';

const protectRoute = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Sesión no encontrada.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error al verificar token de cookie:", error.message);
    res.status(401).json({ error: 'Token no válido o expirado' });
  }
};

// ==========================================
// 1. OBTENER PRESUPUESTOS (GET)
// ==========================================
router.get('/', protectRoute, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const budgets = await Budget.find({ userId });

    // ✅ Solo transacciones de tipo 'expense' del mes actual
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

    const transactions = await Transaction.find({
      userId,
      type: 'expense', // ✅ coincide con el valor normalizado
      createdAt: { $gte: startOfMonth } // ✅ solo del mes actual
    });

    const budgetsWithSpent = budgets.map(budget => {
      const matching = transactions.filter(t => {
        const txCat = t.category.replace(/^\p{Emoji}\s*/u, '').trim().toLowerCase();
        const budgetCat = budget.category.toLowerCase();
        return txCat.includes(budgetCat) || budgetCat.includes(txCat);
      });

      const spent = matching.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return { ...budget.toJSON(), id: budget._id, spent };
    });

    res.json(budgetsWithSpent);
  } catch (error) {
    console.error("🔥 Error en GET /budgets:", error);
    res.status(500).json({ error: 'Error al obtener presupuestos' });
  }
});

// ==========================================
// 2. CREAR PRESUPUESTO (POST)
// ==========================================
router.post('/', protectRoute, checkBudgetLimit, async (req, res) => {
  try {
    const { category, limit, emoji } = req.body;

    const newBudget = new Budget({
      category,
      limit,
      emoji,
      userId: req.user.id
    });

    await newBudget.save();

    const formattedLimit = Number(limit).toLocaleString('es-CO');
    const newNotif = await Notification.create({
      userId: req.user.id,
      message: `Has establecido un límite de $${formattedLimit} para la categoría ${category}.`,
      type: 'reminder'
    });

    if (global.io) global.io.to(req.user.id).emit('notification', newNotif);

    res.status(201).json(newBudget);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear el presupuesto' });
  }
});

// ==========================================
// 3. ACTUALIZAR (PUT)
// ==========================================
router.put('/:id', protectRoute, async (req, res) => {
  try {
    // ✅ userId como ObjectId
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const updated = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId }, // ✅ usar la variable convertida
      { $set: req.body },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Presupuesto no encontrado' });

    const formattedLimit = Number(updated.limit).toLocaleString('es-CO');
    const updateNotif = await Notification.create({
      userId: req.user.id,
      message: `Presupuesto actualizado: "${updated.category}" ahora tiene un límite de $${formattedLimit}.`,
      type: 'reminder'
    });

    if (global.io) global.io.to(req.user.id).emit('notification', updateNotif);

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar' });
  }
});

// ==========================================
// 4. ELIMINAR (DELETE)
// ==========================================
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    // ✅ userId como ObjectId
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const result = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId // ✅ usar la variable convertida
    });

    if (!result) return res.status(404).json({ error: 'No encontrado' });

    const deleteNotif = await Notification.create({
      userId: req.user.id,
      message: `El presupuesto para "${result.category}" ha sido eliminado correctamente.`,
      type: 'reminder'
    });

    if (global.io) global.io.to(req.user.id).emit('notification', deleteNotif);

    res.json({ message: 'Presupuesto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

export default router;