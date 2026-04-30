import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';
import webpush from 'web-push';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import cookieParser from 'cookie-parser';
import auth from './middleware/auth.js';
import Goal from './models/Goal.js'; //
import { canDownloadReports } from './middleware/checkPlanLimits.js';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Importación de modelos externos
import Notification from './models/Notification.js';
import Subscription from './models/Subscription.js';
import Debt from './models/Debt.js';
import Budget from './models/Budget.js';
import User from './models/User.js';
import Transaction from './models/Transaction.js'; 





const protectRoute = async(req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Sesión expirada o no válida. Por favor, inicia sesión.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado.' });
    
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ ERROR DE TOKEN:", error.message);
    res.status(401).json({ error: 'Token no válido o expirado.' });
  }
};

import { 
  checkTransactionLimit, 
  checkBudgetLimit, 
  checkGoalLimit, 
  checkDebtLimit 
} from './middleware/checkPlanLimits.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verifica la conexión con Gmail al arrancar
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ ERROR DE CONFIGURACIÓN DE CORREO:");
    console.error(error);
  } else {
    console.log("📧 SERVIDOR LISTO: Gmail aceptó tus credenciales");
  }
});

// 1. INICIALIZACIÓN
const app = express();
const server = http.createServer(app); 
// ==========================================
// 2. MIDDLEWARES DE SEGURIDAD Y CORS
// ==========================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Configurable para producción
  credentials: true,               // Permite el intercambio de cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// ==========================================
// CONFIGURACIÓN DE WEB PUSH
// ==========================================
webpush.setVapidDetails(
  'mailto:tu-email@ejemplo.com',
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

// ==========================================
// CONFIGURACIÓN DE SOCKET.IO
// ==========================================
const io = new Server(server, {
  cors: { 
    origin: [process.env.FRONTEND_URL || "http://localhost:5173", "http://127.0.0.1:5173"], 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const io = req.app.get('socketio');

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`🔔 Usuario ${userId} conectado para notificaciones`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Usuario desconectado de sockets');
  });
});

app.get('/api/notifications', protectRoute, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json(notifications);
  } catch (error) { res.status(500).json({ error: 'Error al obtener notificaciones' }); }
});

app.delete('/api/notifications/:id', protectRoute, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Eliminada' });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.delete('/api/notifications', protectRoute, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ message: 'Limpias' });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.post('/api/notifications/subscribe', protectRoute, async (req, res) => {
  try {
    const subscription = req.body;
    await Subscription.findOneAndUpdate(
      { userId: req.user.id },
      { userId: req.user.id, ...subscription },
      { upsert: true }
    );
    res.status(201).json({ message: 'Suscrito' });
  } catch (error) { res.status(500).json({ error: 'Error en suscripción' }); }
});
// ==========================================
// 1. MIDDLEWARES GLOBALES
// ==========================================
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Demasiadas peticiones desde esta IP, intenta más tarde.' }
});
app.use('/api/', generalLimiter);

// ==========================================
// 2. CONEXIÓN A MONGO
// ==========================================
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, { family: 4 })
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error de conexión:', err));

// ==========================================
// 3. MODELOS (Actualizado para Jade Finance)
// ==========================================

// ==========================================
// 5. RUTAS DE AUTENTICACIÓN
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // Generar token y enviar via cookie HttpOnly
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ 
      user: { id: newUser._id, name, email, categories: newUser.categories } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Credenciales inválidas' });

    // 1. Generamos el token (igual que antes)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // 2. CONFIGURAMOS LA COOKIE
    res.cookie('token', token, {
      httpOnly: true,                          // El navegador la guarda pero JS no puede leerla (Protección XSS)
      secure: process.env.NODE_ENV === 'production', // true solo en producción (HTTPS)
      sameSite: 'lax',                         // Protege contra ataques CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000          // 7 días (coincide con el expiresIn del JWT)
    });

    // 3. ENVIAMOS LA RESPUESTA (Sin el token en el JSON)
    res.json({ 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        categories: user.categories 
      } 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el login' });
  }
});

// NUEVO: Ruta para solicitar recuperación (CORREGIDO PARA ENVIAR CORREO)
app.post('/api/auth/forgot-password', async (req, res) => {
  console.log('--- INICIANDO PROCESO DE RECUPERACIÓN ---');
  try {
    const { email } = req.body;
    console.log('Step 1: Buscando usuario con email:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Step 1.1: Usuario no encontrado');
      return res.status(404).json({ error: 'Correo no registrado' });
    }

    console.log('Step 2: Generando token...');
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
    console.log('Step 3: Intentando enviar correo a:', user.email);

    const mailOptions = {
      from: `"Jade Finance Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '🔐 Recupera tu acceso a Jade Finance',
      html: `
      <div style="background-color: #0f172a; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; border-radius: 20px; padding: 40px; border: 1px solid #10b98133;">
        
        <h1 style="color: #10b981; margin-bottom: 20px; font-size: 28px;">Jade Finance</h1>
        
        <div style="background-color: #10b9811a; border-radius: 50%; width: 60px; height: 60px; line-height: 60px; margin: 0 auto 20px; font-size: 30px;">🔑</div>
        
        <h2 style="color: #ffffff; margin-bottom: 10px;">¿Olvidaste tu contraseña?</h2>
        <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 30px;">
          No te preocupes, nos pasa a todos. Haz clic en el botón de abajo para elegir una nueva clave y seguir controlando tus finanzas.
        </p>
        
        <a href="${resetUrl}" style="background-color: #10b981; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
          Restablecer Contraseña
        </a>
        
        <p style="color: #64748b; font-size: 12px; margin-top: 40px; border-top: 1px solid #334155; padding-top: 20px;">
          Este enlace expirará en 1 hora por seguridad.<br>
          Si no solicitaste este cambio, puedes ignorar este correo.
        </p>
      </div>
    </div>
  `
};

    // Usamos await y capturamos el resultado del envío
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Step 4: ¡Correo enviado con éxito!');
    console.log('ID del mensaje:', info.messageId);

    res.json({ message: 'Enlace enviado a tu correo electrónico' });
  } catch (error) {
    console.log('❌ ERROR CRÍTICO EN LA RUTA:');
    console.error(error);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
});

// NUEVO: Ruta para restablecer contraseña
app.post('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Token inválido o expirado' });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
});

// ==========================================
// 6. RUTAS DE TRANSACCIONES
// ==========================================
app.get('/api/transactions', protectRoute, async (req, res) => {
  try {
    // 1. Obtenemos el inicio y fin del día actual (Hoy)
    // Usamos fechas de inicio (00:00:00) y fin (23:59:59)
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    // 2. Buscamos las transacciones
    const transactions = await Transaction.find({
      userId: req.user.id,
     createdAt: { $gte: start, $lte: end } // Buscamos por createdAt
    }).sort({ createdAt: -1 }); // Ordenamos por createdAt

    console.log(`🔎 Enviando ${transactions.length} movimientos al historial.`);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// ==========================================
// RUTA: VERIFICAR PERMISO DE EXPORTAR REPORTES
// ==========================================
app.get('/api/reports/can-export', protectRoute, canDownloadReports, async (req, res) => {
  res.json({ canExport: true });
});

app.set('socketio', io);
app.post('/api/transactions', protectRoute, checkTransactionLimit, async (req, res) => {
  try {
    const typeMap = {
      'gasto': 'expense', 'ingreso': 'income',
      'expense': 'expense', 'income': 'income'
    };
    const normalizedType = typeMap[req.body.type] || req.body.type;
    const montoNumerico = Number(String(req.body.amount).replace(/\./g, ''));

    const newTx = new Transaction({ 
      ...req.body, 
      amount: montoNumerico,
      type: normalizedType,
      userId: req.user.id,
      createdAt: new Date() 
    });
    await newTx.save();

    const socketIo = req.app.get('socketio'); 
    
    if (socketIo) {
      // ✨ EL TRUCO PARA LOS PUNTOS ✨
      // Tomamos el valor, nos aseguramos de que sea un número limpio, y luego 
      // lo obligamos a tener el formato con puntos separadores de miles.
      const valorLimpio = Number(String(req.body.amount).replace(/\./g, ''));
      const montoConPuntos = valorLimpio.toLocaleString('es-CO');

      // 1. NOTIFICACIÓN DE REGISTRO (Ahora garantizado 100% con puntos)
      const notifMovimiento = new Notification({
        userId: req.user.id,
        // 👇 Usamos la nueva variable "montoConPuntos"
        message: `Registraste un movimiento de $${montoConPuntos} en ${newTx.category}`,
        type: 'goal_success' 
      });
      await notifMovimiento.save();
      socketIo.to(req.user.id).emit('notification', notifMovimiento);

      // 2. ALERTAS DE PRESUPUESTO (Se mantiene intacto)
      if (normalizedType === 'expense') {
        const budget = await Budget.findOne({ userId: req.user.id, category: newTx.category });
        
        if (budget) {
          const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          const gastosMes = await Transaction.find({
            userId: req.user.id,
            category: newTx.category,
            type: 'expense',
            createdAt: { $gte: startOfMonth }
          });

          const totalGastado = gastosMes.reduce((sum, tx) => {
            const numeroLimpiado = Number(String(tx.amount).replace(/\./g, ''));
            return sum + (isNaN(numeroLimpiado) ? 0 : numeroLimpiado);
          }, 0);

          // Limpiamos también el valor del presupuesto por si viene con puntos en la BD
          const limitePresupuesto = Number(String(budget.amount).replace(/\./g, ''));

          if (totalGastado > limitePresupuesto) {
            // Formateamos el límite del presupuesto para que la alerta también tenga puntos
            const limiteConPuntos = limitePresupuesto.toLocaleString('es-CO');
            
            const notifAlerta = new Notification({
              userId: req.user.id,
              message: `¡Atención! Has excedido tu presupuesto de $${limiteConPuntos} para ${newTx.category}.`,
              type: 'budget_warning' 
            });
            await notifAlerta.save();
            socketIo.to(req.user.id).emit('notification', notifAlerta);
          }
        }
      }
    }

    res.status(201).json(newTx);

  } catch (e) {
    console.error('❌ Error en POST:', e.message); 
    res.status(400).json({ error: 'Error al registrar' });
  }
});

app.put('/api/user/update-settings', protectRoute, async (req, res) => {
  try {
    const { email, currency, notifications } = req.body;
    
    // Buscamos y actualizamos los 3 campos a la vez
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { email, currency, notifications },
      { new: true } // Para que devuelva el usuario ya cambiado
    ).select('-password');

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar los ajustes' });
  }
});


app.put('/api/transactions/:id', protectRoute, async (req, res) => {
  try {
    const tx = await Transaction.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    res.json(tx);
  } catch (e) { res.status(500).json({ error: 'Error al actualizar' }); }
});

app.delete('/api/transactions/:id', protectRoute, async (req, res) => {
  try {
    await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Transacción eliminada' });
  } catch (e) { res.status(500).json({ error: 'Error al eliminar' }); }
});


// ==========================================
// 7. RUTAS DE METAS
// ==========================================

app.put('/api/goals/:id', protectRoute, async (req, res) => {
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
    res.status(500).json({ error: 'Error al actualizar la meta' });
  }
});

app.get('/api/goals', protectRoute, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id });
    res.json(goals);
  } catch (e) { res.status(500).json({ error: 'Error al obtener metas' }); }
});
// Obtener categorías del usuario
app.get('/api/user/categories', protectRoute, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // Si el usuario no tiene el campo, devolvemos un array vacío en lugar de nada
    res.json(user.categories || []);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});


app.delete('/api/user/categories/:id', protectRoute, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // Filtramos el array: nos quedamos con todas las categorías EXCEPTO la que queremos borrar
    user.categories = user.categories.filter(
      (cat) => cat._id.toString() !== req.params.id
    );
    
    await user.save(); // Guardamos el cambio en MongoDB

    // Devolvemos la lista actualizada al frontend
    res.json(user.categories);
  } catch (error) {
    console.error("❌ Error al eliminar categoría:", error);
    res.status(500).json({ error: "Error interno al eliminar la categoría" });
  }
});

// Añadir una nueva categoría
app.post('/api/user/categories', protectRoute, async (req, res) => {
  try {
    const { name, emoji, type } = req.body;
    
    // 1. Buscamos al usuario
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // 2. Verificamos si la categoría ya existe
    const exists = user.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) return res.status(400).json({ error: "La categoría ya existe" });

    // 3. Guardamos la nueva categoría en el array del usuario
    const newCategory = { name, emoji, type };
    user.categories.push(newCategory);
    await user.save();

    // 5. IMPORTANTE: Devolvemos la lista actualizada
    res.status(201).json(user.categories);
    
  } catch (error) {
    console.error("❌ Error completo:", error);
    res.status(500).json({ error: "Error al crear la categoría" });
  }
});


app.post('/api/goals', protectRoute, checkGoalLimit, async (req, res) => {
  try {
    const newGoal = new Goal({ ...req.body, userId: req.user.id });
    await newGoal.save();
    res.status(201).json(newGoal);
  } catch (e) { 
    console.error('❌ ERROR REAL EN METAS:', e); // 👈 ¡AGREGA ESTA LÍNEA!
    res.status(400).json({ error: 'Error al crear meta' }); 
  }
});

app.post('/api/webhook/mercadopago', async (req, res) => {
  try {
      const { type, data } = req.body;

          // Solo procesamos si la notificación es de un pago
          if (type === 'payment') {
            const client = new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN
      });

      const payment = new Payment(client);

      const paymentData = await payment.get({ id: data.id });

        if (paymentData.status === 'approved') {
        const userId = paymentData.metadata?.user_id;
        const planType = paymentData.metadata?.plan_type; // 'monthly', 'six_months', 'yearly'

        if (!userId) {
          console.error('❌ Error: No se encontró user_id en metadata');
          return res.sendStatus(200);
        }

        const user = await User.findById(userId);
        if (!user) return res.sendStatus(200);

        // --- LÓGICA DE CALCULAR VENCIMIENTO ---
        let expirationDate = new Date();
        
        if (planType === 'yearly') {
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        } else if (planType === 'six_months') {
          expirationDate.setMonth(expirationDate.getMonth() + 6);
        } else {
          // Por defecto es mensual (1 mes)
          expirationDate.setMonth(expirationDate.getMonth() + 1);
        }

        // --- ACTUALIZAR BASE DE DATOS ---
        user.plan = 'premium';
        user.subscriptionStatus = 'active';
        user.subscriptionId = String(paymentData.id);
        user.planExpiration = expirationDate; 
        user.planUpdatedAt = new Date();
        await user.save();

        // --- CREAR NOTIFICACIÓN INTERNA ---
        const notif = await Notification.create({
          userId: user._id,
          message: `🎉 ¡Jade Premium activado! Tu plan vence el ${expirationDate.toLocaleDateString()}.`,
          type: 'goal_success'
        });

        // --- AVISAR POR SOCKET.IO (TIEMPO REAL) ---
        // Usamos global.io que acabas de configurar
        if (global.io) {
          global.io.to(userId).emit('notification', notif);
          global.io.to(userId).emit('planUpgraded', { 
            plan: 'premium', 
            expiration: expirationDate 
          });
        }

        console.log(`⭐ Usuario ${user.email} subió a Premium (${planType})`);
      }
    }

    // Mercado Pago requiere este status para confirmar que recibiste la info
    res.sendStatus(200);

  } catch (error) {
    console.error('❌ Error en Webhook Mercado Pago:', error.message);
    res.sendStatus(200); // Siempre 200 para evitar re-intentos infinitos de MP
  }
});



app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: "Sesión cerrada" });
});
// NUEVO: Ruta para sumar un abono a una meta con notificaciones de progreso
app.put('/api/goals/:id/add', protectRoute, async (req, res) => {
  try {
    const { amount } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    // Calculamos porcentajes antes y después para saber si cruzó un umbral
    const prevPercent = (goal.currentAmount / goal.targetAmount) * 100;
    goal.currentAmount += Number(amount);
    const newPercent = (goal.currentAmount / goal.targetAmount) * 100;
    
    await goal.save();

    const formattedTarget = Number(goal.targetAmount).toLocaleString('es-CO');
    const formattedCurrent = Number(goal.currentAmount).toLocaleString('es-CO');

    // Notificación al completar (100%)
    if (newPercent >= 100 && prevPercent < 100) {
      const completionNotif = new Notification({
        userId: req.user.id,
        message: `🎉 ¡FELICIDADES! Has completado tu meta "${goal.name}". Lograste ahorrar los $${formattedTarget}.`,
        type: 'reminder'
      });
      await completionNotif.save();
      if (global.io) global.io.to(req.user.id).emit('notification', completionNotif);
    } 
    // Notificación a la mitad (50%)
    else if (newPercent >= 50 && prevPercent < 50) {
      const halfNotif = new Notification({
        userId: req.user.id,
        message: `🚀 ¡Vas por la mitad! Has alcanzado el 50% de tu meta "${goal.name}". Llevas $${formattedCurrent} de $${formattedTarget}.`,
        type: 'reminder'
      });
      await halfNotif.save();
      if (global.io) global.io.to(req.user.id).emit('notification', halfNotif);
    }

    res.json(goal);
  } catch (e) {
    res.status(500).json({ error: 'Error al procesar el abono de la meta' });
  }
});

app.delete('/api/goals/:id', protectRoute, async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Meta eliminada' });
  } catch (e) { res.status(500).json({ error: 'Error al eliminar meta' }); }
});



// ==========================================
// 9. TAREAS PROGRAMADAS (CRON JOBS)
// ==========================================

cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Revisando deudas programadas próximas...');
  try {
    const hoy = new Date();
    const dentroDeTresDias = new Date();
    dentroDeTresDias.setDate(hoy.getDate() + 3);
    const dentroDeUnDia = new Date();
    dentroDeUnDia.setDate(hoy.getDate() + 1);

    const debts = await Debt.find({
      "payments.status": "programado",
      "payments.notified": false,
      "payments.date": { $lte: dentroDeTresDias }
    });

    for (let debt of debts) {
      for (let p of debt.payments) {
        if (p.status === 'programado' && !p.notified && p.date <= dentroDeTresDias) {
          // ✨ CORREGIDO: Formato de miles en cron de deudas
          const formattedPayment = Number(p.amount).toLocaleString('es-CO');
          const alertMsg = `⏰ Recordatorio: Tienes un abono de $${formattedPayment} para "${debt.name}" programado para el ${p.date.toLocaleDateString()}`;
          const debtNotif = new Notification({ userId: debt.userId, message: alertMsg, type: 'reminder' });
          await debtNotif.save();
          if (global.io) global.io.to(debt.userId.toString()).emit('notification', debtNotif);
          p.notified = true; 
        }
      }
      await debt.save();
    }
  } catch (err) { console.error("Error en cron de deudas:", err); }
});

cron.schedule('0 9 */2 * *', async () => {
  console.log('⏳ Ejecutando recordatorios periódicos de presupuesto...');
  try {
    const budgets = await Budget.find();
    const hoy = new Date();
    const startOfMonth = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    for (let budget of budgets) {
      const txs = await Transaction.find({ 
        userId: budget.userId, 
        category: { $regex: budget.category, $options: 'i' },
        createdAt: { $gte: startOfMonth },
        $or: [{ type: { $regex: 'gasto|expense', $options: 'i' } }, { amount: { $lt: 0 } }]
      });
      const totalSpent = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const porcentaje = (totalSpent / budget.limit) * 100;
      if (porcentaje >= 50) {
        const recordatorioNotif = new Notification({ 
          userId: budget.userId, 
          message: `Recordatorio: Tu presupuesto de "${budget.category}" sigue al ${porcentaje.toFixed(0)}%.`,
          type: 'budget_warning'
        });
        await recordatorioNotif.save();
        if (global.io) global.io.to(budget.userId.toString()).emit('notification', recordatorioNotif);
      }
    }
  } catch (err) { console.error("Error en Recordatorio Automático:", err); }
});
// RUTA PARA CAMBIAR CONTRASEÑA
app.put('/api/user/update-password', protectRoute, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'La clave actual no coincide' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Contraseña actualizada' });
  } catch (e) { res.status(500).json({ error: 'Error al cambiar clave' }); }
});

// RUTA PARA ACTUALIZAR PERFIL (FOTO Y NOMBRE)
app.put('/api/user/update-profile', protectRoute, async (req, res) => {
  try {
    const { name, profilePic } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { name, profilePic }, 
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});



// RUTA PARA ELIMINAR CUENTA
app.delete('/api/user/me', protectRoute, async (req, res) => {
  try {
    // Importa otros modelos si necesitas borrar sus datos también (Goals, Debts, etc.)

    const userId = req.user.id;

    // 1. (Opcional pero recomendado) Borrar todos los datos asociados al usuario
    await Transaction.deleteMany({ userId: userId });
    await Budget.deleteMany({ userId: userId });
    
    // 2. Borrar al usuario de la base de datos
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Cuenta y datos eliminados correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar la cuenta:", error);
    res.status(500).json({ error: "Error en el servidor al eliminar la cuenta" });
  }
});


// ==========================================
// CONFIGURACIÓN DE COSTOS (DeepSeek)
// ==========================================
let costoAcumulado = 0;
let llamadasTotales = 0;
const PRECIO_INPUT  = 0.28 / 1_000_000;
const PRECIO_OUTPUT = 0.42 / 1_000_000;

// ==========================================
// 1. CATEGORIZACIÓN AUTOMÁTICA (PREMIUM)
// ==========================================
app.post('/api/ai/categorizar', protectRoute, async (req, res) => {
  // 🛡️ BLOQUEO PREMIUM
  if (req.user.plan !== 'premium') {
    return res.status(403).json({ 
      error: 'LIMIT_REACHED', 
      message: 'La categorización inteligente es una función Premium.' 
    });
  }

  const { descripcion, categorias } = req.body;
  if (!descripcion || !categorias) return res.status(400).json({ error: 'Faltan datos' });

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Eres un clasificador financiero. Responde solo con el nombre de la categoría.' },
          { role: 'user', content: `Descripción: "${descripcion}". Categorías: ${categorias.join(', ')}` }
        ],
        max_tokens: 20
      })
    });

    const data = await response.json();
    const categoria = data?.choices?.[0]?.message?.content?.trim() || 'Otros';
    
    res.json({ categoria });
  } catch (error) {
    res.status(500).json({ error: 'Error al categorizar' });
  }
});

// ==========================================
// 2. ASISTENTE JADE (PREMIUM + CONTEXTO REAL)
// ==========================================
app.post('/api/ai/asistente', protectRoute, async (req, res) => {
  // 🛡️ BLOQUEO PREMIUM
  if (req.user.plan !== 'premium') {
    return res.status(403).json({ 
      error: 'LIMIT_REACHED', 
      message: 'El Asistente JADE es exclusivo para usuarios Premium.' 
    });
  }

  const { pregunta, historialChat } = req.body;

  try {
    // A. Obtener datos reales del usuario (60 días)
    const hace60Dias = new Date();
    hace60Dias.setDate(hace60Dias.getDate() - 60);
    const transacciones = await Transaction.find({
      userId: req.user.id,
      createdAt: { $gte: hace60Dias }
    }).sort({ createdAt: -1 }).limit(100).lean();

    const resumenFinanciero = generarResumen(transacciones);

    // B. Llamada a DeepSeek
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Eres JADE, asistente financiero. REGLA: Si preguntan algo no financiero, di que no puedes ayudar. 
            CONTEXTO: ${resumenFinanciero}`
          },
          ...(historialChat || []).slice(-8),
          { role: 'user', content: pregunta }
        ],
        temperature: 0.2
      })
    });

    const data = await response.json();
    
    // Registro de tokens y costos (Consola)
    const { prompt_tokens, completion_tokens } = data.usage;
    const costo = (prompt_tokens * PRECIO_INPUT) + (completion_tokens * PRECIO_OUTPUT);
    costoAcumulado += costo;
    console.log(`💰 Costo Sesión: $${costoAcumulado.toFixed(5)}`);

    res.json({ respuesta: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: 'Error en el asistente' });
  }
});

// ==========================================
// 3. ANÁLISIS MENSUAL (PREMIUM)
// ==========================================
app.post('/api/ai/analizar', protectRoute, async (req, res) => {
  // 🛡️ BLOQUEO PREMIUM
  if (req.user.plan !== 'premium') {
    return res.status(403).json({ 
      error: 'LIMIT_REACHED', 
      message: 'El análisis detallado es una función Premium.' 
    });
  }

  const { transacciones, mes } = req.body;
  try {
    const resumenTexto = transacciones.map(t => `${t.category}: $${t.amount}`).join(', ');

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Analiza estos gastos y da 3 consejos de ahorro específicos.' },
          { role: 'user', content: `Mes: ${mes}. Gastos: ${resumenTexto}` }
        ]
      })
    });

    const data = await response.json();
    res.json({ analisis: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: 'Error al analizar' });
  }
});

// ==========================================
// FUNCIÓN AUXILIAR: Resumen de Datos
// ==========================================
function generarResumen(transacciones) {
  if (!transacciones.length) return 'Sin transacciones aún.';

  const gastos = transacciones.filter(t => t.type === 'expense');
  const ingresos = transacciones.filter(t => t.type === 'income');

  const totalGastos = gastos.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalIngresos = ingresos.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  // Agrupar gastos por categoría
  const gastosPorCategoria = gastos.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});

  // Agrupar ingresos por categoría
  const ingresosPorCategoria = ingresos.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});

  const resumenGastos = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => `${cat}: $${val.toLocaleString('es-CO')}`)
    .join(', ');

  const resumenIngresos = Object.entries(ingresosPorCategoria)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => `${cat}: $${val.toLocaleString('es-CO')}`)
    .join(', ');

  return `
    RESUMEN FINANCIERO (últimos 60 días):
    - Total ingresos: $${totalIngresos.toLocaleString('es-CO')}
    - Total gastos: $${totalGastos.toLocaleString('es-CO')}
    - Balance: $${(totalIngresos - totalGastos).toLocaleString('es-CO')}
    - Ingresos por categoría: ${resumenIngresos || 'Ninguno'}
    - Gastos por categoría: ${resumenGastos || 'Ninguno'}
  `;
}

// ==========================================
// 10. CARGA DE RUTAS EXTERNAS E INICIO
// ==========================================
import budgetsRouter from './routes/budgets.js';
import paymentsRouter from './routes/payments.js';
import debtsRouter from './routes/debts.js';
import router from './routes/transactions.js';

app.use('/api/budgets', budgetsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api', router);
app.use('/api/debts', debtsRouter);


app.use((err, req, res, next) => {
  console.error("Error en el servidor:", err);
  res.status(err.status || 500).json({
    message: err.message || "Error interno",
    error: err
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 JADE FINANCE Backend corriendo en puerto ${PORT}`);
});