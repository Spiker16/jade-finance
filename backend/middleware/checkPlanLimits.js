import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import Debt from '../models/Debt.js';

// ==========================================
// LÍMITES DEL PLAN BÁSICO
// ==========================================
const BASIC_LIMITS = {
  transactionsPerMonth: 50,
  budgets: 2,
  goals: 2,
  debts: 2
};

// ==========================================
// MIDDLEWARE: LÍMITE DE TRANSACCIONES
// ==========================================
const checkTransactionLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Si es premium, pasa directo
    if (user.plan === 'premium') return next();

    // Contar transacciones del mes actual
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const count = await Transaction.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: startOfMonth }
    });

    if (count >= BASIC_LIMITS.transactionsPerMonth) {
      return res.status(403).json({ 
        error: 'LIMIT_REACHED',
        message: `Has alcanzado el límite de ${BASIC_LIMITS.transactionsPerMonth} transacciones mensuales del plan Básico.`,
        limit: BASIC_LIMITS.transactionsPerMonth,
        current: count,
        upgradeRequired: true
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error en checkTransactionLimit:', error);
    res.status(500).json({ error: 'Error al verificar límites del plan' });
  }
};

// ==========================================
// MIDDLEWARE: LÍMITE DE PRESUPUESTOS
// ==========================================
const checkBudgetLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (user.plan === 'premium') return next();

    const count = await Budget.countDocuments({ userId: req.user.id });

    if (count >= BASIC_LIMITS.budgets) {
      return res.status(403).json({ 
        error: 'LIMIT_REACHED',
        message: `Has alcanzado el límite de ${BASIC_LIMITS.budgets} presupuestos del plan Básico.`,
        limit: BASIC_LIMITS.budgets,
        current: count,
        upgradeRequired: true
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error en checkBudgetLimit:', error);
    res.status(500).json({ error: 'Error al verificar límites del plan' });
  }
};

// ==========================================
// MIDDLEWARE: LÍMITE DE METAS
// ==========================================
const checkGoalLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    
    if (user.plan === 'premium') return next();
    
    const count = await Goal.countDocuments({ userId: req.user.id });

    if (count >= BASIC_LIMITS.goals) {
      return res.status(403).json({ 
        error: 'LIMIT_REACHED',
        message: `Has alcanzado el límite de ${BASIC_LIMITS.goals} metas del plan Básico.`,
        limit: BASIC_LIMITS.goals,
        current: count,
        upgradeRequired: true
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error en checkGoalLimit:', error);
    res.status(500).json({ error: 'Error al verificar límites del plan' });
  }
};

// ==========================================
// MIDDLEWARE: LÍMITE DE DEUDAS
// ==========================================
const checkDebtLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (user.plan === 'premium') return next();

    const count = await Debt.countDocuments({ userId: req.user.id });

    if (count >= BASIC_LIMITS.debts) {
      return res.status(403).json({ 
        error: 'LIMIT_REACHED',
        message: `Has alcanzado el límite de ${BASIC_LIMITS.debts} deudas del plan Básico.`,
        limit: BASIC_LIMITS.debts,
        current: count,
        upgradeRequired: true
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error en checkDebtLimit:', error);
    res.status(500).json({ error: 'Error al verificar límites del plan' });
  }
};
// ==========================================
// MIDDLEWARE: RESTRICCIÓN DE REPORTES
// ==========================================
export const canDownloadReports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.plan === 'premium') return next();

    return res.status(403).json({ 
      error: 'PREMIUM_REQUIRED',
      message: 'La descarga de reportes (PDF/Excel) es una función exclusiva de Jade Premium.',
      upgradeRequired: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar suscripción' });
  }
};

export { 
  checkTransactionLimit, 
  checkBudgetLimit, 
  checkGoalLimit, 
  checkDebtLimit,
  BASIC_LIMITS
};