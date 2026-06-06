const ordRouter = require('express').Router();
const { createOrder, getUserOrders, getOrderById } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

ordRouter.post('/',           protect, createOrder);
ordRouter.get('/myorders',    protect, getUserOrders);
ordRouter.get('/:id',         protect, getOrderById);

module.exports = ordRouter;
