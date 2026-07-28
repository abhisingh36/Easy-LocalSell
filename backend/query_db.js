const mongoose = require('mongoose');
const MONGODB_URI = "mongodb://abhisingh27373_db_user:DQ5f8AAOrKfsOCoh@ac-gemhfmd-shard-00-00.cgyesyk.mongodb.net:27017,ac-gemhfmd-shard-00-01.cgyesyk.mongodb.net:27017,ac-gemhfmd-shard-00-02.cgyesyk.mongodb.net:27017/?ssl=true&replicaSet=atlas-y59h1r-shard-0&authSource=admin";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    const User = mongoose.connection.db.collection('users');
    const Listing = mongoose.connection.db.collection('listings');

    const users = await User.find({}).toArray();
    console.log("--- USERS ---");
    users.forEach(u => {
      console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}`);
    });

    const listings = await Listing.find({}).toArray();
    console.log("--- LISTINGS ---");
    listings.forEach(l => {
      console.log(`ID: ${l._id}, Title: ${l.title}, Price: ${l.price}, SellerName: ${l.sellerName}, Seller: ${l.seller}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
