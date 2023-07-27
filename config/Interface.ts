import { Request } from "express";
import { User } from "@prisma/client";

export interface RequestWithAuth extends Request {
  auth?: any;
}

export interface RequestWithAuthAndUser extends Request {
  auth?: any;
  user?: User;
}

export enum AdminType {
  regular_user = "regular_user",
  admin = "admin",
  super_admin = "super_admin",
}
