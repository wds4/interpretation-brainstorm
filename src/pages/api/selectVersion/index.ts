import type { NextApiRequest, NextApiResponse } from 'next'
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result =
      await sql`SELECT VERSION()`;
    res.status(200).json({ result })
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  res.status(200).json({ message: 'Hello from Next.js!' })
}