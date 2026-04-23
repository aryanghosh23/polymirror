import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = await fetch("http://localhost:8000/refresh-concluded-trades", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ limit: 50 }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 500 });
  }
}
