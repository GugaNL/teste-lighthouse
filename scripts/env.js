/*
 * Cria backend/.env e frontend/.env a partir dos .env.example, se ainda não
 * existirem. Nunca sobrescreve um .env que já está lá.
 */
const fs = require('fs');
const path = require('path');

for (const pasta of ['backend', 'frontend']) {
  const exemplo = path.join(__dirname, '..', pasta, '.env.example');
  const destino = path.join(__dirname, '..', pasta, '.env');
  if (fs.existsSync(destino)) {
    console.log(`[env] ${pasta}/.env já existe — mantido.`);
  } else {
    fs.copyFileSync(exemplo, destino);
    console.log(`[env] ${pasta}/.env criado a partir do .env.example.`);
  }
}
