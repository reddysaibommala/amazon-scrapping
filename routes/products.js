const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();
const { Product } = require('../models/product');
const { Details } = require('../models/details');
const { scrapeProducts, scrapeProduct } = require('../services/scrape');
const redis = require("redis");

const client = redis.createClient(6379);
client.on("error", (err) => {
  console.log(err);
})

const formatSearchQuery = ({ query = {}}, res, next) => {
  let { q = null } = query;
  if (q) {
    res.locals.query = {
      key: q
    }
    next();
  } else {
    let error = new Error('Search key required');
    next(error);
  }
}

const validateProduct = (req, res, next) => {
  let { asinId } = req.params || {};
  Product.findOne({
    asinId: asinId
  })
  .then((product) => {
    if (product) {
      res.locals.product = product.toJSON();
      next();
    } else {
      let error = new Error('Invalid Asin Id');
      next(error);
    }
  })
  .catch((err) => {
    next(err);
  })
}

const checkHashCache = (req, res, next) => {
  let { query = {} } = res.locals || {};
  client.hgetall(query.key, function(err, data) {
    if (err) {
      console.log(err);
      next(err);
    }
    //if no match found
    if (data != null) {
      if (data.ids) data.ids = JSON.parse(data.ids).map(id => mongoose.Types.ObjectId(id));
      Product.find({
        _id: { $in: data.ids }
      })
      .then((products) => {
        return res.send(products);
      })
      .catch(next);
    } else {
      next();
    }
  });
}

const checkCache = (req, res, next) => {
  const { asinId } = req.params;

  client.get(asinId, (err, data) => {
    if (err) {
      console.log(err);
      next(err);
    }
    //if no match found
    if (data != null) {
      Details.findOne(mongoose.Types.ObjectId(data))
      .then((details) => {
        let { product = {} } = res.locals || {};
        product.technicalDetails = details.technicalDetails;
        res.send(product);
      })
      .catch(next);
    } else {
      next();
    }
  });
};

router.get(
  '/search',
  formatSearchQuery,
  checkHashCache,
  async function(req, res, next) {
    let { query = {} } = res.locals || {};
    scrapeProducts(query.key)
    .then((products) => {
      products = products.filter(product => product.asinId !== '');
      res.locals.products = products;
      return Product.insertMany(products, {rawResult: true})
    })
    .then((response) => {
      let { products = [] } = res.locals || {};
      client.hmset(query.key, {
        ids: JSON.stringify(Object.values(response.insertedIds))
      })
      res.status(200).send(products);
    })
    .catch((err) => {
      res.status(500).send(err.message);
    })
  }
);

router.get(
  '/:asinId',
  validateProduct,
  checkCache,
  async function(req, res, next) {
    let { asinId } = req.params || {};
    let { product } = res.locals || {};
    scrapeProduct(product.productURL, asinId)
    .then((productInfo) => {
      product.technicalDetails = productInfo[asinId];
      return Details.create({
        asinId: asinId,
        technicalDetails: productInfo[asinId]
      })
    })
    .then((response) => {
      client.set(asinId, response.id);
      res.status(200).send(res.locals.product);
    })
    .catch((err) => {
      res.status(500).send(err.message);
    })
  }
);

module.exports = router;