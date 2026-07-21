const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log("Connecting to:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("SUCCESS: Connected to DB");
  } catch (err) {
    console.error("ERROR: Failed to connect to DB");
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

testConnection();
