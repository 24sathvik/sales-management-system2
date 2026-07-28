import { Session } from "next-auth";
import { ApiError } from "./api-error";

export function requireRole(session: Session | null, role: "ADMIN" | "USER") {
  if (!session?.user) {
    throw new ApiError(401, "Unauthorized");
  }
  
  if (role === "ADMIN" && session.user.role !== "ADMIN") {
    throw new ApiError(403, "Admin access required");
  }
}
