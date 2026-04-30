import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // --- INFORMACIÓN BÁSICA ---
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: 6
  },
  
  // --- CONFIGURACIONES DE USUARIO ---
  currency: {
    type: String,
    default: 'COP'
  },
  notifications: {
    alerts: { type: Boolean, default: true },
    reports: { type: Boolean, default: false }
  },
  profilePic: {
    type: String,
    default: ''
  },

  // --- CATEGORÍAS PERSONALIZADAS ---
  categories: [{
    name: { type: String, required: true },
    emoji: { type: String, default: '💰' },
    type: { type: String, enum: ['gasto', 'ingreso'], default: 'gasto' }
  }],

  // --- SISTEMA DE SUSCRIPCIÓN (REAL) ---
  plan: {
    type: String,
    enum: ['basic', 'premium'],
    default: 'basic'
  },
  subscriptionId: { 
    type: String, 
    default: null 
  }, 
  subscriptionStatus: { 
    type: String, 
    default: 'inactive' 
  },
  planUpdatedAt: { 
    type: Date, 
    default: Date.now 
  },

  // --- RECUPERACIÓN Y SEGURIDAD ---
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  createdAt: {
    type: Date,
    default: Date.now
  },
  planExpiration: { 
    type: Date, 
    default: null 
  },
});

// Exportamos el modelo único
export default mongoose.model('User', UserSchema);