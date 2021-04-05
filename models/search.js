const mongoose = require('mongoose');

let SearchSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.ObjectId,
    auto: true
  },
  key: String,
  products: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Product'
  }],
  createdAt: { type: Date },
  updatedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

SearchSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Search = mongoose.model('Search', SearchSchema, 'search');
module.exports = { Search };