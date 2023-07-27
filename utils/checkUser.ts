import { Request } from "express";
import { get } from "lodash";
import CustomAPIError from "../config/CustomAPIError";

export const checkUserValid = (req: Request, username: string): boolean => {
  console.log(get(req, "username"));
  return get(req, "username") == username;
};

export const getUsername = (req: Request, username: string) => {
  //return username;
  try {
    return get(req, "username");
  } catch (error) {
    throw error;
  }
};
