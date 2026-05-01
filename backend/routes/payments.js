import express from 'express';
const router = express.Router();
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import auth from '../middleware/auth.js';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

router.post('/create-preference', auth, async (req, res) => {
  try {
    const { planType, unitPrice } = req.body; 
    const user = await User.findById(req.user.id);
    
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (user.plan === 'premium') {
      return res.status(400).json({ error: 'Ya tienes el plan Premium activo' });
    }

    const preference = new Preference(client);
    
    const precioNumerico = Number(unitPrice || 15000);

    const response = await preference.create({
      body: {
        items: [
          {
            id: planType || 'premium-mensual',
            title: 'Jade Finance Premium',
            description: 'Acceso ilimitado a todas las funciones',
            quantity: 1,
            currency_id: 'COP', 
            unit_price: precioNumerico 
          }
        ],
        payer: {
          email: user.email,
          name: user.name
        },
        back_urls: {
          success: "https://www.google.com",
          failure: "https://www.google.com",
          pending: "https://www.google.com"
        },
        auto_return: 'approved',
        metadata: {
          user_id: user._id.toString()
        },
        statement_descriptor: 'JADE FINANCE',
        expires: false
      }
    });

    console.log("✅ ID de preferencia generado:", response.id);

    res.json({ 
      preferenceId: response.id,
      initPoint: response.init_point 
    });

  } catch (error) {
    console.error("❌ Error en create-preference:", error);
    res.status(500).json({ error: 'Error al crear la preferencia de pago' });
  }
});

router.post('/process', auth, async (req, res) => {
  try {
    console.log("📦 Body recibido:", JSON.stringify(req.body, null, 2));
    console.log("📦 formData:", JSON.stringify(req.body.formData, null, 2));

    const payment = new Payment(client);

    const paymentData = {
      ...req.body.formData, 
      description: 'Jade Finance Premium',
      statement_descriptor: 'JADE FINANCE',
      callback_url: `${process.env.BACKEND_URL || 'https://jade-finance-api.onrender.com'}/api/payments/pse-callback`,
      metadata: {
        user_id: req.user.id 
      }
    };

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '127.0.0.1';
    if (paymentData.additional_info) {
      paymentData.additional_info.ip_address = clientIp;
    } else {
      paymentData.additional_info = { ip_address: clientIp };
    }

    const response = await payment.create({
      body: paymentData
    });

    console.log("✅ Pago procesado:", response.status);

    if (response.status === 'approved') {
      const user = await User.findById(req.user.id);
      if (user) {
        user.plan = 'premium';
        user.subscriptionStatus = 'active';
        user.subscriptionId = String(response.id);
        user.planUpdatedAt = new Date();
        await user.save();

        const notif = await Notification.create({
          userId: user._id,
          message: '🎉 ¡Bienvenido a Jade Finance Premium! Pago aprobado.',
          type: 'goal_success'
        });

        if (global.io) {
          global.io.to(user._id.toString()).emit('notification', notif);
          global.io.to(user._id.toString()).emit('planUpgraded', { plan: 'premium' });
        }
      }
    }

    res.json({
      status: response.status,
      status_detail: response.status_detail,
      id: response.id
    });

  } catch (error) {
    console.error("❌ Error en /process:", error.message);
    console.error("❌ Error completo:", JSON.stringify(error?.cause || error, null, 2));
    res.status(400).json({ 
      error: 'Error al procesar el pago',
      details: error.message 
    });
  }
});

router.get('/pse-callback', (req, res) => {
  const params = new URLSearchParams(req.query);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/payment-result?${params.toString()}`);
});

router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: data.id });

      console.log(`💳 Procesando pago ${data.id}. Estado: ${paymentData.status}`);

      if (paymentData.status === 'approved') {
        const userId = paymentData.metadata?.user_id;

        if (!userId) {
          console.error('❌ No se encontró user_id en la metadata del pago');
          return res.sendStatus(200);
        }

        const user = await User.findById(userId);
        if (!user) {
          console.error('❌ Usuario no encontrado en la DB:', userId);
          return res.sendStatus(200);
        }

        user.plan = 'premium';
        user.subscriptionId = String(paymentData.id);
        user.subscriptionStatus = 'active';
        user.planUpdatedAt = new Date();
        await user.save();

        const notif = await Notification.create({
          userId: user._id,
          message: '🎉 ¡Bienvenido a Jade Finance Premium! Ahora tienes acceso ilimitado.',
          type: 'goal_success'
        });

        if (global.io) {
          global.io.to(userId).emit('notification', notif);
          global.io.to(userId).emit('planUpgraded', { plan: 'premium' });
        }

        console.log(`✅ Plan Premium activado para: ${user.email}`);
      }
    }

    res.sendStatus(200);

  } catch (error) {
    console.error('❌ Error crítico en webhook:', error.message);
    res.sendStatus(200);
  }
});

router.get('/plan-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('plan subscriptionStatus planUpdatedAt');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    res.json({ 
      plan: user.plan,
      status: user.subscriptionStatus,
      updatedAt: user.planUpdatedAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar el plan' });
  }
});

router.post('/cancel', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    user.plan = 'basic';
    user.subscriptionStatus = 'cancelled';
    user.planUpdatedAt = new Date();
    await user.save();

    const notif = await Notification.create({
      userId: user._id,
      message: '⚠️ Tu plan Premium ha sido cancelado. Has vuelto al plan Básico.',
      type: 'reminder'
    });

    if (global.io) global.io.to(req.user.id).emit('notification', notif);

    res.json({ message: 'Plan cancelado correctamente', plan: 'basic' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar el plan' });
  }
});

export default router;