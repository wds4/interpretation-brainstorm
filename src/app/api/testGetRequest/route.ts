import { db } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const req = searchParams.get("req");
  const client = await db.connect();
  try {
    let oReq = {"a": "result not found"}
    if (typeof req == 'string') {
      oReq = JSON.parse(req)
    }
    const response = oReq.a || 'result not found'
    // return NextResponse.json({ result }, { status: 200 });
    return NextResponse.json( response, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  } finally {
    client.release();
  }
}