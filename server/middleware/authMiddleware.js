import jsonwebtoken from "jsonwebtoken";
import RegisterModel from "../Models/UserCredentials.js";

const auth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Get the token from Bearer <token>

  if (!token) {
    return res.sendStatus(401); // No token found
  }

  try {
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET); // Verify token
    req.user = await RegisterModel.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    return res.sendStatus(403); // Invalid token
  }
};

export default auth;
