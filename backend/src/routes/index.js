const { Router } = require('express');
const product = require('./product.router');
const category = require('./category.router');
const docs = require('./docs.router');

module.exports = (server) => {
  product(server, new Router());
  category(server, new Router());
  docs(server, new Router());
};
