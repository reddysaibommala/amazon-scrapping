const mongoose = require('mongoose');

let DetailsSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.ObjectId,
    auto: true
  },
  asinId: String,
  technicalDetails: Object
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

DetailsSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Details = mongoose.model('Details', DetailsSchema, 'details');
module.exports = { Details };