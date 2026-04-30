import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Notification from '../models/Notification.js';

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
// 1. OBTENER TRANSACCIONES (GET)
// ==========================================
router.get('/', protectRoute, async (req, res) => {
  try {
    // ✅ userId como ObjectId
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const transactions = await Transaction.find({ userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
});

// ==========================================
// 2. CREAR TRANSACCIÓN + ALERTA DE PRESUPUESTO (POST)
// ==========================================
router.post('/', protectRoute, async (req, res) => {
  try {
    let { amount, category, description, type, date } = req.body;

    let finalAmount = Number(amount);
    if (type === 'Gasto' && finalAmount > 0) finalAmount = -finalAmount;
    if (type === 'Ingreso' && finalAmount < 0) finalAmount = Math.abs(finalAmount);

    // ✅ Normalizar type a 'expense'/'income' para que coincida con el filtro de presupuestos
    const normalizedType = type === 'Gasto' ? 'expense' : 'income';

    const newTransaction = new Transaction({
      userId: req.user.id,
      amount: finalAmount,
      category,
      description,
      type: normalizedType, // ✅ guardar como 'expense' o 'income'
      date: date || new Date()
    });
    await newTransaction.save();

    // --- LÓGICA DE NOTIFICACIÓN DE PRESUPUESTO ---
    if (normalizedType === 'expense') {
      const userId = new mongoose.Types.ObjectId(req.user.id);
      const budget = await Budget.findOne({
        userId,
        category: { $regex: new RegExp(`^${category}$`, 'i') }
      });

      if (budget) {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const transactions = await Transaction.find({
          userId,
          category: budget.category,
          type: 'expense', // ✅ filtrar con el valor normalizado
          date: { $gte: startOfMonth }
        });

        const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const percentage = (totalSpent / budget.limit) * 100;

        if (percentage >= 80) {
          const io = req.app.get('socketio');
          const alertMsg = percentage >= 100
            ? `🚫 ¡Límite excedido! Has gastado el ${percentage.toFixed(0)}% en ${category}`
            : `⚠️ ¡Cuidado! Has gastado el ${percentage.toFixed(0)}% de tu presupuesto en ${category}`;

          if (io) {
            io.to(req.user.id.toString()).emit('notification', {
              title: 'Jade Finance: Presupuesto',
              message: alertMsg,
              type: 'warning',
              createdAt: new Date()
            });
          }

          await Notification.create({
            userId: req.user.id,
            message: alertMsg,
            read: false
          });
        }
      }
    }

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Error al crear transacción:", error);
    res.status(400).json({ error: 'Error al procesar la transacción' });
  }
});

// ==========================================
// 3. ELIMINAR TRANSACCIÓN (DELETE)
// ==========================================
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    // ✅ userId como ObjectId
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const deletedTx = await Transaction.findOneAndDelete({ _id: req.params.id, userId });
    if (!deletedTx) return res.status(404).json({ error: 'No se encontró la transacción' });
    res.json({ message: 'Transacción eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

export default router;