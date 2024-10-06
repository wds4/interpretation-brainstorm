'use client'

import React, { useEffect, useState } from 'react'
import { sql } from "@vercel/postgres";

function Pets({
  params
} : {
  params: { owner: string }
}) {
  const [rowse, setRowse] = useState([{"id":"a", "owner":"b", "name":"c"}])
  useEffect(() => {
    console.log('YOOOOOOOO !!!!!!!!!')
    console.log({
          POSTGRES_URL: process.env.POSTGRES_URL,
          POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING
    });
    async function fooFxn() {
      try {
        console.log('HEYYYYY !!!!!!!!!')
        const { rows } = await sql`SELECT * from Pets where owner=${params.owner}`;
        console.log('ROWS !!!!!!!!!!!! ' + rows)
        setRowse([])
      } catch (e) {
        console.log(e)
      }
      // 
      // const { rows } = await sql`SELECT * from Pets where owner='Mark'`;
      // const { rows } = await sql`SELECT * from pets`;
      // console.log(rows)
      // 
      // const result = await sql`SELECT VERSION()`;
      // console.log(result)
    }
    fooFxn()
  }, [])

  return (
    <div>
      <div>async function Pets</div>
      <div>Pet Owners; {params.owner}</div>
      {rowse.map((row) => (
        <div key={row.id}>
          owner: {row.owner}; pet name: {row.name}
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const params = { "owner": "Mark" }
  return (
    <div>
      <center><h1>Hello World: Postgres</h1></center>
      <Pets params={params} />
    </div>
  )
}