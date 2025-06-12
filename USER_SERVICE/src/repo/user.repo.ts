import { AppDataSource } from "../db.config";
import { User } from "../entity/user.entity";

export const UserModel = AppDataSource.getRepository(User)