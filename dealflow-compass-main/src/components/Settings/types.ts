export type UserRole = "edit" | "view";
export type UserStatus = "active" | "pending";

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
}

export const mockUsers: TeamUser[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "edit",
    status: "active",
  },
  {
    id: "2",
    name: "María García",
    email: "maria@example.com",
    role: "edit",
    status: "active",
  },
  {
    id: "3",
    name: "Carlos López",
    email: "carlos@example.com",
    role: "view",
    status: "active",
  },
  {
    id: "4",
    name: "Ana Martínez",
    email: "ana@example.com",
    role: "view",
    status: "pending",
  },
];
