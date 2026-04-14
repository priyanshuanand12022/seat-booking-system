import mongoose from "mongoose";

export const connectDatabase = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is missing. Create backend/.env from backend/.env.example and set a valid MongoDB connection string."
    );
  }

  const connection = await mongoose.connect(process.env.MONGO_URI);
  return connection;
};
