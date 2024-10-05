import { db } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const req = searchParams.get("req");
  const oReq = JSON.parse(req)
  const client = await db.connect();
  try {
    // const result = await client.sql`SELECT VERSION();`;
    const response = oReq.a
    // return NextResponse.json({ result }, { status: 200 });
    return NextResponse.json( response, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  } finally {
    client.release();
  }
}