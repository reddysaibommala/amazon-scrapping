const express = require("express");
const router = express.Router();
const { scrape } = require('../services/scrape');

const formatPagination = ({ query = {}}, res, next) => {
  let {
    perPage = 20, page = 1
  } = query;

  if (+page <= 0) {
    page = 1;
  }

  let skip = (page - 1) * perPage;

  res.locals.pagination = {
    limit: +perPage,
    skip: +skip,
    page: +page
  };

  next();
}

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

router.get(
  '/search',
  formatSearchQuery,
  formatPagination,
  async function(req, res, next) {
    let { query = {}, pagination } = res.locals || {};
    scrape(query.key)
    .then((products) => {
      res.status(200).send(products);
    })
    .catch((err) => {
      res.status(500).send(err.message);
    })
    
  }
);

module.exports = router;