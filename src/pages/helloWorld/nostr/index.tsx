import React, { useMemo } from 'react'
import { useNostrHooks, useSubscribe } from 'nostr-hooks'
import NDK from '@nostr-dev-kit/ndk'

const customNDK = new NDK({
  explicitRelayUrls: ["wss://purplepag.es", "wss://relay.damus.io", "wss://nos.lol"],
});

const SubscribeToEvents_memoization = () => {
  const pubkey1 = 'e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f'

  // useMemo prevents rerendering hell
  // const filters = useMemo(() => [{ authors: [pubkey1], kinds: [1], limit: 10 }], [])
  const filters = useMemo(() => [{ kinds: [3], authors: [pubkey1], limit: 10 }], [])

  const { events } = useSubscribe({ filters })
  console.log('rerender SubscribeToEvents_memoization; events.length: ' + events.length)
  if (!events) {
    return (
      <>
        <div>No events</div>
      </>
    )
  }
  return (
    <>
      <center>
        <h3>useSubscribe</h3>
      </center>
      <div>
        <p>number of events: {events.length}</p>
        <p>Note the use of useMemo to prevent an infinite rerendering loop.</p>
        <p>
          Look for "rerender SubscribeToEvents_memoization" in javascript console; it should rerender once for
          each new event received.
        </p>
        <p>
          filters: <br />
          {JSON.stringify(filters, null, 4)}
        </p>
        <ul>
          {events.map((event, item) => (
            <li key={event.id}>
              <p>
                id {item}: {event.id}
              </p>
              <pre>
                {JSON.stringify(event.tags, null, 4)}
              </pre>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default function Page() {
  useNostrHooks(customNDK)
  return (
    <div>
      <h1>Hello World, Next.js!</h1>
      <SubscribeToEvents_memoization />
    </div>
    )
}