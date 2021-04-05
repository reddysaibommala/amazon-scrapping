const mongoose = require('mongoose');

let ProductSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.ObjectId,
    auto: true
  },
  asinId: String,
  productName: String,
  productURL: String,
  productImg: String,
  price: String,
  strike: String,
  rating: String,
  offer: String
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

ProductSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model('Product', ProductSchema, 'products');
module.exports = { Product };