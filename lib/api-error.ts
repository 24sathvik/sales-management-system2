import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "Duplicate entry" }, { status: 409 });
    }
  }

  console.error("Unhandled API error:", error);
  return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
}
