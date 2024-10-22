const express = require('express');
const fs = require('fs').promises;
const router = express.Router();
const CARTS_FILE = './data/carts.json';

// Crear un nuevo carrito
router.post('/', async (req, res) => {
  const carts = JSON.parse(await fs.readFile(CARTS_FILE, 'utf-8'));
  const newCart = { id: Date.now(), products: [] };
  carts.push(newCart);
  await fs.writeFile(CARTS_FILE, JSON.stringify(carts));
  res.status(201).json(newCart);
});

// Obtener productos de un carrito por ID
router.get('/:cid', async (req, res) => {
  const carts = JSON.parse(await fs.readFile(CARTS_FILE, 'utf-8'));
  const cart = carts.find(c => c.id == req.params.cid);
  cart ? res.json(cart.products) : res.status(404).send('Carrito no encontrado');
});

// Agregar un producto a un carrito
router.post('/:cid/product/:pid', async (req, res) => {
  const carts = JSON.parse(await fs.readFile(CARTS_FILE, 'utf-8'));
  const cart = carts.find(c => c.id == req.params.cid);
  if (!cart) return res.status(404).send('Carrito no encontrado');

  const product = cart.products.find(p => p.product == req.params.pid);
  if (product) {
    product.quantity += 1;
  } else {
    cart.products.push({ product: req.params.pid, quantity: 1 });
  }

  await fs.writeFile(CARTS_FILE, JSON.stringify(carts));
  res.status(201).json(cart);
});

module.exports = router;
