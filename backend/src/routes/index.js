const { Router } = require('express');
const product = require('./product.router');
const category = require('./category.router');
const docs = require('./docs.router');

module.exports = (server) => {
  product(server, Router());
  category(server, Router());
  docs(server, Router());
};
