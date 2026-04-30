import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: String, required: true }, // ✅ String para que NUNCA se borren tus puntos
  category: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['income', 'expense'], required: true },
  createdAt: { type: Date, default: Date.now } // ✅ Cambiado a createdAt para que el historial lo encuentre
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Esto asegura que React reciba "id" y "date" correctamente
transactionSchema.set('toJSON', { 
  transform: (doc, ret) => { 
    ret.id = ret._id.toString(); 
    ret.date = ret.createdAt; // Mapeamos createdAt a date para el frontend
    delete ret._id; 
    delete ret.__v; 
  } 
});

export default mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);