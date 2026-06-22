import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Attempt connecting to local MongoDB with a short timeout to prevent hanging
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartreach', {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.useMockDb = false;
  } catch (error) {
    console.log('');
    console.log('======================================================================');
    console.log(`  MongoDB connection failed: ${error.message}`);
    console.log('  FALLBACK ENABLING: Running with local JSON database (server/db.json)...');
    console.log('======================================================================');
    console.log('');
    global.useMockDb = true;
  }
};

export default connectDB;
