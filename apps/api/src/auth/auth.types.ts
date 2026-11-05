import type { UserRole } from "../common/shared";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};
