import { NextResponse } from "next/server";

export function validateField(field: string) {
  if (!field) {
    return NextResponse.json(
      { error: `Missing ${field} field` },
      { status: 400 }
    );
  }
}

export function validateFields(fields: Array<string | number>) {
  for (const field of fields) {
    if (!field) {
      return NextResponse.json(
        { error: `Missing required fields` },
        { status: 400 }
      );
    }
  }
}
