import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  height: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  glucose: {
    type: Number,
    required: true,
  },
  temperature: {
    type: Number,
    required: true,
  },
  pulse: {
    type: Number,
    required: true,
  },
  bloodPressure: {
    systolic: {
      type: Number,
      required: true,
    },
    diastolic: {
      type: Number,
      required: true,
    },
  },
  oxygen: {
    type: Number,
    required: true,
  },
});

const userResultsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserCredentials", // Reference to the UserCredentials model
    required: true,
  },
  AadharNumber: {
    type: String,
    required: true,
  },
  results: [resultSchema], // Array of resultSchema
});

const UserResults = mongoose.model("UserResults", userResultsSchema);

export default UserResults;
