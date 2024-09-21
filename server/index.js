import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import RegisterModel from "./Models/UserCredentials.js";
import UserResults from "./Models/userResults.js";
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import auth from "./middleware/authMiddleware.js";
dotenv.config();

const PORT = 8080;

const app = express();
app.use(express.json());
app.use(cors());
const url = process.env.ATLAS_SECRET;

async function connectToDatabase() {
  try {
    await mongoose.connect(url, {
      connectTimeoutMS: 10000, // 10 seconds timeout
    });
    console.log("Database connection established!");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    setTimeout(connectToDatabase, 5000); // Retry after 5 seconds
  }
}

connectToDatabase();

app.post("/register", async (req, res) => {
  try {
    // Extract user details from request body
    const { AadharNumber, name, phone, password, confirmPassword } = req.body;

    // Check if user already exists by Aadhar, name, or phone
    const userAadharExists = await RegisterModel.findOne({ AadharNumber });
    const usernameExists = await RegisterModel.findOne({ name });
    const userPhoneExists = await RegisterModel.findOne({ phoneNumber: phone });

    // If the user already exists, respond with an appropriate message
    if (usernameExists || userPhoneExists || userAadharExists) {
      return res.json({ userExists: true });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.json({ passwordMismatch: true });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the new user with hashed password
    const newUser = { ...req.body, password: hashedPassword };
    await RegisterModel.create(newUser);

    // Success response
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    console.log(req.body);

    const { name, password } = req.body;

    // Find the user in the database by name
    const user = await RegisterModel.findOne({ name }).exec();

    console.log(user);

    if (user && (await bcrypt.compare(password, user.password))) {
     
      // If user exists and password matches, send success response with user details and token
      res.json({
        _id: user._id,
        name: user.name,
        aadhar: user.AadharNumber,
        phone: user.phoneNumber,
        token: generateToken(user._id),
        status: "Login successful",
      });
    } else {
      // If user doesn't exist or password doesn't match, send an error response
      res.status(401).json({ msg: "Invalid User Data" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Token generation function
const generateToken = (userId) => {
  return jsonwebtoken.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d", // Token expires in 30 days
  });
};

app.get("/getUserDetails", async (req, res) => {
  const url = process.env.ATLAS_SECRET;
  const client = new MongoClient(url);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    // Access the database and collection
    const db = client.db("test");
    const collection = db.collection("userresults");

    // Fetch the latest document, sorted by _id in descending order
    const cursor = collection.find({}).sort({ _id: -1 }).limit(1);
    const document = await cursor.next();

    console.log(document);
    return res.status(200).json({ document });
  } catch (err) {
    console.error("Error retrieving user details:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    // Close the MongoDB client
    await client.close();
  }
});

app.post("/addResults", async (req, res) => {
  const {
    userId,
    AadharNumber,
    height,
    weight,
    glucose,
    temperature,
    pulse,
    systolic,
    diastolic,
    oxygen,
  } = req.body;

  try {
    const resultEntry = {
      date: new Date(),
      height,
      weight,
      glucose,
      temperature,
      pulse,
      bloodPressure: {
        systolic,
        diastolic,
      },
      oxygen,
    };

    await UserResults.updateOne(
      { AadharNumber },
      { $push: { results: resultEntry } },
      { upsert: true }
    );

    res.status(200).json({ msg: "Results added successfully!" });
  } catch (err) {
    console.error("Error adding user results:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/me", auth, async (req, res) => {
  try {
    const { _id, name, AadharNumber, phoneNumber } = req.user;

    return res.status(200).json({
      _id,
      name,
      aadhar: AadharNumber,
      phone: phoneNumber,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`);
});

process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed on app termination");
    process.exit(0);
  });
});
