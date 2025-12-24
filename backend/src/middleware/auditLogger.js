const prisma = require('../lib/prisma');

const auditLogger = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log apenas para ações importantes (POST, PUT, DELETE)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && req.user) {
      const action = getActionFromMethod(req.method);
      const entity = getEntityFromPath(req.path);
      
      // Log assíncrono sem bloquear a resposta
      prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action,
          entity,
          entityId: req.params.id,
          metadataJson: {
            method: req.method,
            path: req.path,
            body: sanitizeBody(req.body),
          },
        },
      }).catch(console.error);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

function getActionFromMethod(method) {
  const map = {
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };
  return map[method] || 'CREATE';
}

function getEntityFromPath(path) {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'unknown';
}

function sanitizeBody(body) {
  if (!body) return null;
  
  const sanitized = { ...body };
  // Remove senhas e dados sensíveis
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.password_hash;
  
  return sanitized;
}

module.exports = { auditLogger };










