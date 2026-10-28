/**
 * Log de uma linha por requisição: método, rota, status e tempo.
 *
 * Suficiente para acompanhar o que o frontend está chamando durante o
 * desenvolvimento, sem trazer uma dependência só para isso.
 */
module.exports = (req, res, next) => {
  const inicio = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    console.log(`[http] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });
  next();
};
