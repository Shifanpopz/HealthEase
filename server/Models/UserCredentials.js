import mongoose from "mongoose";

const RegisterSchema = mongoose.Schema(
  {
    name: {
      type: "string",
      required: true,
      unique: true,
    },
    AadharNumber: {
      type: "string",
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: "string",
      required: true,
      unique: true,
    },
    menstrualPeriod: {
      type: "string",
      required: true,
    },
    password: {
      type: "string",
      required: true,
    },
    confirmPassword: {
      type: "string",
      required: true,
    },
  },
  { timestamps: true }
);

const RegisterModel = mongoose.model("usercredentials", RegisterSchema);
export default RegisterModel;
