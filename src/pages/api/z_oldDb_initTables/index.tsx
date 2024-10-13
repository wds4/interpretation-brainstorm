import { db } from "@vercel/postgres"
import type { NextApiRequest, NextApiResponse } from 'next'

/*
usage:
http://localhost:3000/api/initTables
https://interpretation-brainstorm.vercel.app/api/initTables
*/

type ResponseData = {
    message: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    const client = await db.connect();
    try {
      const result = await client.sql`
  DROP TABLE IF EXISTS ratingsTables;
  DROP TABLE IF EXISTS customers;
  DROP TABLE IF EXISTS interpretationProtocols;
  DROP TABLE IF EXISTS users;
  
  -- coreTableA
  CREATE TABLE IF NOT EXISTS ratingsTables(
    ID SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'default',
    pubkey VARCHAR(255) NOT NULL,
    ratingsTable JSONB NOT NULL DEFAULT '{}',
    dosStats JSONB NOT NULL DEFAULT '{}',
    lastUpdated INT NOT NULL DEFAULT 0,
    UNIQUE (name, pubkey)
  );

  -- coreTableB (optional)
  CREATE TABLE IF NOT EXISTS customers (
    ID SERIAL PRIMARY KEY,
    pubkey TEXT NOT NULL
  );

  -- coreTable1
  CREATE TABLE IF NOT EXISTS interpretationProtocols(
    ID SERIAL PRIMARY KEY,
    universalInterpretationProtocolID TEXT NOT NULL, -- used to communicate with the nostr calculation engine; might be the same as the slug
    name TEXT, -- optional
    title TEXT, -- optional
    description TEXT,
    parametersJsonSchema JSONB, -- stringified json that describes the object that holds parameters that must be communicated across the API
    -- OPTIONAL: use naddr to point to the jsonSchema in place of the parametersJsonSchema column
    parametersJsonSchemaNaddr TEXT -- naddr that points to an event in which the json schema is stored (? stringified and placed in content; ? kind)
  );
  
  -- coreTable2
  CREATE TABLE IF NOT EXISTS users (
    ID SERIAL PRIMARY KEY,
    pubkey TEXT UNIQUE NOT NULL,
    follows JSONB DEFAULT '[]' NOT NULL,
    followsCreatedAt INT DEFAULT 0,
    followers JSONB DEFAULT '[]' NOT NULL,
    mutes JSONB DEFAULT '[]' NOT NULL,
    mutesCreatedAt INT DEFAULT 0,
    mutedBy JSONB DEFAULT '[]' NOT NULL,
    lastUpdated INT DEFAULT 0,
    haveFollowsBeenInput boolean DEFAULT false,
    whenLastQueriedFollowsAndMutes INT DEFAULT 0,
    whenLastInputFollowsAttempt INT DEFAULT 0
  );
  `;
      // return NextResponse.json({ result }, { status: 200 });
      console.log(result)
      res.status(200).json({ message: 'initTables: All done!' })
    } catch (error) {
      // return NextResponse.json({ error }, { status: 500 });
      console.log(error)
      res.status(500).json({ message: 'error!' })
    } finally {
      client.release();
    }
}
