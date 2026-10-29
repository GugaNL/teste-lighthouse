const path = require('path');
const dotenv = require('dotenv');
const Joi = require('joi');

if (process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });
}

const NIVEIS_DE_LOG = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];

const esquema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').empty('').default('development'),
  PORT: Joi.number().port().empty('').default(4008),
  MONGO_URL: Joi.string()
    .pattern(/^mongodb(\+srv)?:\/\//)
    .empty('')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.any().required(),
      otherwise: Joi.any().default('mongodb://127.0.0.1:27022/catalogo-produtos'),
    })
    .messages({
      'string.pattern.base': 'MONGO_URL deve começar com mongodb:// ou mongodb+srv://',
      'any.required': 'MONGO_URL é obrigatória em produção',
    }),
  CORS_ORIGIN: Joi.string()
    .allow('')
    .when('NODE_ENV', { is: 'production', then: Joi.any().default(''), otherwise: Joi.any().default('*') }),
  SEED_ON_START: Joi.boolean().truthy('true').falsy('false').empty('').default(false),
  RATE_LIMIT_WRITES_PER_MINUTE: Joi.number()
    .integer()
    .min(0)
    .empty('')
    .when('NODE_ENV', { is: 'test', then: Joi.any().default(0), otherwise: Joi.any().default(120) }),
  LOG_LEVEL: Joi.string()
    .valid(...NIVEIS_DE_LOG)
    .empty('')
    .when('NODE_ENV', {
      is: 'test',
      then: Joi.any().default('silent'),
      otherwise: Joi.any().default('info'),
    }),
}).unknown(true);

const { error, value: env } = esquema.validate(process.env, { abortEarly: false });
if (error) {
  throw new Error(`Configuração inválida: ${error.details.map((d) => d.message).join('; ')}`);
}

module.exports = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  mongoUrl: env.MONGO_URL,
  corsOrigin: env.CORS_ORIGIN,
  seedOnStart: env.SEED_ON_START,
  rateLimitWritesPerMinute: env.RATE_LIMIT_WRITES_PER_MINUTE,
  logLevel: env.LOG_LEVEL,
  produto: 'Catálogo de Produtos',
};
