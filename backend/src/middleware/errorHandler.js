const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  // Erro de validação do Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        message: 'Registro duplicado. Este valor já existe.',
        code: 'DUPLICATE_ENTRY',
      },
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Registro não encontrado.',
        code: 'NOT_FOUND',
      },
    });
  }

  // Erro padrão
  res.status(500).json({
    success: false,
    error: {
      message: process.env.APP_ENV === 'development' 
        ? err.message 
        : 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
    },
  });
};

module.exports = { errorHandler };







