import express from 'express';
const router = express.Router();
import Debt from '../models/Debt.js';
import Notification from '../models/Notification.js';
import auth from '../middleware/auth.js';
import { checkDebtLimit } from '../middleware/checkPlanLimits.js';

// Mensaje para confirmar que el archivo se cargó al iniciar el servidor
console.log("✅ Router de Deudas (/api/debts) cargado correctamente");

// 1. OBTENER TODAS LAS DEUDAS
router.get('/', auth, async (req, res) => {
    try {
        const debts = await Debt.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(debts);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener deudas' });
    }
});

// 2. CREAR NUEVA DEUDA
// Nota: Asegúrate de que checkDebtLimit llame a next() al final
router.post('/', auth, checkDebtLimit, async (req, res) => {
    console.log("📩 Petición POST recibida en /api/debts");
    console.log("Cuerpo recibido:", req.body);
    
    try {
        const newDebt = new Debt({ 
            ...req.body, 
            userId: req.user.id 
        });
        await newDebt.save();
        console.log("✅ Deuda creada con éxito:", newDebt.name);
        res.status(201).json(newDebt);
    } catch (err) {
        console.error("❌ Error al guardar deuda:", err.message);
        res.status(400).json({ error: 'Error al crear deuda', details: err.message });
    }
});

// 3. AGREGAR UN ABONO (Pagar ahora)
router.post('/:id/payments', auth, async (req, res) => {
    try {
        const { amount, date } = req.body;
        const debt = await Debt.findOne({ _id: req.params.id, userId: req.user.id });
        if (!debt) return res.status(404).json({ error: 'Deuda no encontrada' });

        debt.payments.push({ amount, date, status: 'completado' });
        await debt.save();

        const formattedAmount = Number(amount).toLocaleString('es-CO');
        const newNotif = new Notification({
            userId: req.user.id,
            message: `¡Abono Realizado! 💸 Has abonado $${formattedAmount} a la deuda "${debt.name}".`,
            type: 'reminder'
        });
        await newNotif.save();

        if (global.io) global.io.to(req.user.id).emit('notification', newNotif);

        res.json(debt);
    } catch (err) {
        console.error("🚨 Error en abono:", err);
        res.status(500).json({ error: 'Error al procesar el abono' });
    }
});

// 4. PROGRAMAR UN ABONO
router.post('/:id/schedule', auth, async (req, res) => {
    try {
        const { amount, date } = req.body;
        const debt = await Debt.findOne({ _id: req.params.id, userId: req.user.id });
        if (!debt) return res.status(404).json({ error: 'Deuda no encontrada' });

        debt.payments.push({ amount, date, status: 'programado', notified: false });
        await debt.save();
        res.json(debt);
    } catch (err) {
        res.status(500).json({ error: 'Error al programar abono' });
    }
});

// 5. COMPLETAR UN ABONO PROGRAMADO
router.patch('/:debtId/payments/:paymentId/complete', auth, async (req, res) => {
    try {
        const debt = await Debt.findOne({ _id: req.params.debtId, userId: req.user.id });
        if (!debt) return res.status(404).json({ error: 'Deuda no encontrada' });

        const payment = debt.payments.id(req.params.paymentId);
        if (!payment) return res.status(404).json({ error: 'Abono no encontrado' });

        payment.status = 'completado';
        payment.date = new Date();
        await debt.save();

        const formattedAmount = Number(payment.amount).toLocaleString('es-CO');
        const confirmNotif = new Notification({
            userId: req.user.id,
            message: `¡Pago Confirmado! ✅ El abono programado de $${formattedAmount} para "${debt.name}" ha sido completado.`,
            type: 'reminder'
        });
        await confirmNotif.save();

        if (global.io) global.io.to(req.user.id).emit('notification', confirmNotif);

        res.json(debt);
    } catch (err) {
        console.error("🚨 Error en confirmación:", err);
        res.status(500).json({ error: 'Error al confirmar abono' });
    }
});

// 6. EDITAR ABONO
router.put('/:debtId/payments/:paymentId', auth, async (req, res) => {
    try {
        const { amount, date } = req.body;
        const debt = await Debt.findOne({ _id: req.params.debtId, userId: req.user.id });
        if (!debt) return res.status(404).json({ error: 'Deuda no encontrada' });

        const payment = debt.payments.id(req.params.paymentId);
        if (!payment) return res.status(404).json({ error: 'Abono no encontrado' });

        payment.amount = Number(amount);
        payment.date = date;
        await debt.save();

        res.json(debt);
    } catch (err) {
        res.status(500).json({ error: 'Error al editar abono' });
    }
});

// 7. EDITAR DEUDA (CABECERA)
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, totalAmount, dueDate } = req.body;
        const updatedDebt = await Debt.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { name, totalAmount, dueDate },
            { new: true }
        );
        res.json(updatedDebt);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar deuda' });
    }
});

// 8. ELIMINAR DEUDA
router.delete('/:id', auth, async (req, res) => {
    try {
        await Debt.deleteOne({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Deuda eliminada correctamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

export default router;