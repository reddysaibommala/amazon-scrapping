const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
let isConnected;

module.exports = connectToDatabase = () => {
  if (isConnected) {
    console.log('=> using existing database connection');
    return Promise.resolve();
  }

  console.log('=> using new database connection');
  return mongoose.connect(process.env.DB,{
    keepAlive: true,
    keepAliveInitialDelay: 300000,
    socketTimeoutMS: 2000000,
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(db => { 
    console.log("DB connected!")
    isConnected = db.connections[0].readyState;
  })
  .catch(err => {
    console.log(`DB connection failed due to: ${err.message}`);
  })
};