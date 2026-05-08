// ✅ Types
type FormState = {
  email: string;
  password: string;
};

type Errors = {
  email?: string;
  password?: string;
};

type Toast = {
  show: boolean;
  message: string;
  type: "success" | "error" | "";
};

type JwtPayload ={
  exp: number; // expiry time from backend token
};

export type { FormState, Errors, Toast, JwtPayload };