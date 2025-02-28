import jwt from "jsonwebtoken";

export const validateToken = async (token: string): Promise<boolean> => {
  const secret = process.env.JWT_SECRET as string; // Ensure it's a string

  if (!secret) {
    console.error("JWT_SECRET is missing from environment variables.");
    return false;
  }
  const decoded = jwt.decode(token);


  try {
     jwt.verify(token, secret);//
    return true;
  } catch (error) {
    console.error("Invalid token:", error);
    return false;
  }
};
