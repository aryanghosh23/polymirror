import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    wallet: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { wallet } = await context.params;
    const response = await fetch(`http://localhost:8000/traders/${wallet}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(null, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(null, { status: 500 });
  }
}
