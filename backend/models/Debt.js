import mongoose from 'mongoose';


const paymentSchema = new mongoose.Schema({
  amount: Number,
  date: Date,
  status: { type: String, default: 'completado' },
  notified: { type: Boolean, default: false } // <--- ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ
});

// 1. Definición del Esquema (Asegúrate que empiece con Mayúscula 'DebtSchema')
const DebtSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    category: { type: String, default: 'General' },
    status: { type: String, enum: ['pendiente', 'pagado'], default: 'pendiente' },
    payments: [{
        amount: Number,
        date: { type: Date, default: Date.now },
        status: { type: String, default: 'completado' }
    }],
    createdAt: { type: Date, default: Date.now }
});

// 2. Configuración del toJSON (Cambiado 'debtSchema' por 'DebtSchema')
DebtSchema.set('toJSON', { 
  transform: (doc, ret) => { 
    ret.id = ret._id.toString();
    // Evitamos errores con deudas antiguas validando que payments exista
    ret.paidAmount = (ret.payments || [])
      .filter(p => p.status === 'completado')
      .reduce((acc, curr) => acc + curr.amount, 0);
    delete ret._id; 
    delete ret.__v; 
  } 
});

// 3. Exportación (Usando el nombre correcto)
export default mongoose.models.Debt || mongoose.model('Debt', DebtSchema);