import mongoose from 'mongoose';


const budgetSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  emoji: { 
    type: String, 
    default: '💰' 
  },
  limit: { 
    type: Number, 
    required: true 
  }
}, { timestamps: true });

// Exportamos el modelo (esto evita errores de duplicados al recargar)
export default mongoose.models.Budget || mongoose.model('Budget', budgetSchema);