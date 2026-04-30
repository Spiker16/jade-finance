import jwt from 'jsonwebtoken';

export default function(req, res, next) {
  // 1. Leer el token de las cookies (ahora llega automáticamente gracias a credentials: 'include')
  // Nota: Para que req.cookies funcione, debes tener instalado y configurado 'cookie-parser' en server.js
  const token = req.cookies.token;

  // 2. Si no hay token en las cookies, denegar el acceso
  if (!token) {
    return res.status(401).json({ msg: 'Sesión expirada o no válida. Por favor, inicia sesión.' });
  }

  try {
    // 3. Verificar si el token es real y no ha expirado
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_super_seguro');
    
    // 4. Guardar los datos del usuario en la request (id, email, etc.)
    req.user = decoded.user || decoded; 
    
    // 5. Dar paso a la ruta
    next();
  } catch (err) {
    // Si el token es inválido o expiró, devolvemos 401
    res.status(401).json({ msg: 'Token no es válido o ha expirado' });
  }
};