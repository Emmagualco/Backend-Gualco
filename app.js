const express = require('express');
const handlebars = require('express-handlebars');
const { Server } = require('socket.io');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = 7030;

// Archivos de datos
const PRODUCTS_FILE = path.join(__dirname, 'data/products.json');
const CARTS_FILE = path.join(__dirname, 'data/carts.json');

let products = [];
let carts = [];

// Configuración Handlebars
app.engine('handlebars', handlebars.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Servidor HTTP y WebSocket
const httpServer = app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
const io = new Server(httpServer);

// Cargar productos desde archivo JSON
async function loadProducts() {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    products = JSON.parse(data);
  } catch (error) {
    console.error('Error cargando productos:', error);
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products));
  }
}

// Guardar productos en archivo JSON
async function saveProducts() {
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// Cargar carritos desde archivo JSON
async function loadCarts() {
  try {
    const data = await fs.readFile(CARTS_FILE, 'utf-8');
    carts = JSON.parse(data);
  } catch (error) {
    console.error('Error cargando carritos:', error);
    await fs.writeFile(CARTS_FILE, JSON.stringify(carts));
  }
}

// Rutas de productos
const productRouter = express.Router();

productRouter.get('/', (req, res) => {
  const { limit } = req.query;
  const productList = limit ? products.slice(0, limit) : products;
  res.json(productList);
});

productRouter.get('/:pid', (req, res) => {
  const product = products.find(p => p.id == req.params.pid);
  product ? res.json(product) : res.status(404).send('Producto no encontrado');
});

productRouter.post('/', async (req, res) => {
  const { title, description, code, price, stock, category, thumbnails } = req.body;
  const newProduct = {
    id: products.length + 1,
    title, description, code, price, status: true, stock, category, thumbnails: thumbnails || []
  };
  products.push(newProduct);
  await saveProducts();
  io.emit('updateProducts', products);
  res.status(201).json(newProduct);
});

productRouter.put('/:pid', async (req, res) => {
  const index = products.findIndex(p => p.id == req.params.pid);
  if (index === -1) return res.status(404).send('Producto no encontrado');
  const updatedProduct = { ...products[index], ...req.body };
  products[index] = updatedProduct;
  await saveProducts();
  io.emit('updateProducts', products);
  res.json(updatedProduct);
});

productRouter.delete('/:pid', async (req, res) => {
  const index = products.findIndex(p => p.id == req.params.pid);
  if (index === -1) return res.status(404).send('Producto no encontrado');
  products.splice(index, 1);
  await saveProducts();
  io.emit('updateProducts', products);
  res.status(204).send();
});

app.use('/api/products', productRouter);

// Rutas de carritos
const cartRouter = express.Router();

cartRouter.post('/', async (req, res) => {
  const newCart = { id: carts.length + 1, products: [] };
  carts.push(newCart);
  await fs.writeFile(CARTS_FILE, JSON.stringify(carts, null, 2));
  res.status(201).json(newCart);
});

cartRouter.get('/:cid', (req, res) => {
  const cart = carts.find(c => c.id == req.params.cid);
  cart ? res.json(cart.products) : res.status(404).send('Carrito no encontrado');
});

cartRouter.post('/:cid/product/:pid', async (req, res) => {
  const cart = carts.find(c => c.id == req.params.cid);
  if (!cart) return res.status(404).send('Carrito no encontrado');

  const product = products.find(p => p.id == req.params.pid);
  if (!product) return res.status(404).send('Producto no encontrado');

  const existingProduct = cart.products.find(p => p.product === product.id);
  if (existingProduct) {
    existingProduct.quantity++;
  } else {
    cart.products.push({ product: product.id, quantity: 1 });
  }

  await fs.writeFile(CARTS_FILE, JSON.stringify(carts, null, 2));
  res.status(201).json(cart);
});

app.use('/api/carts', cartRouter);

// Vistas con Handlebars
app.get('/', (req, res) => {
  res.render('home', { products });
});

app.get('/realtimeproducts', (req, res) => {
  res.render('realTimeProducts', { products });
});

// WebSocket: Actualización en tiempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado');
  socket.emit('updateProducts', products);

  socket.on('newProduct', async (product) => {
    product.id = products.length + 1;
    products.push(product);
    await saveProducts();
    io.emit('updateProducts', products);
  });
});

// Cargar datos al iniciar
(async () => {
  await loadProducts();
  await loadCarts();
})();
