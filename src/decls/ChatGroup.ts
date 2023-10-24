import type { User } from "./user";

export class ChatGroup {
  id: number;
  name: string;
  description: string;
  avatar: string;
  allowAnyUserToJoin: boolean;
  admins: User[];
  members: User[];
}