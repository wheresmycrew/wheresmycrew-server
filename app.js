import { serve } from 'https://deno.land/std@0.66.0/http/server.ts'
import { 
  acceptable, 
  acceptWebSocket,
  isWebSocketCloseEvent,
} from 'https://deno.land/std@0.66.0/ws/mod.ts'
import { v4 } from "https://deno.land/std@0.66.0/uuid/mod.ts"

let connections = new Map()

let port = 3000

const server = serve({
  port: port
})

console.log('server running on port '+port)

// Run the server
for await (const req of server) {
  if (req.url == '/test') {
    req.respond({
      status: 200,
      body: await Deno.open('./test.html')
    })
  }

  if (req.url == '/ws') {
    if (acceptable(req)) {
      acceptWebSocket({
        conn: req.conn,
        bufReader: req.r,
        bufWriter: req.w,
        headers: req.headers
      }).then(async (socket) => {
        console.log('socket connected')
        connections.set(v4.generate(), socket)

        for await (const ev of socket) {

          // Broadcast message to everyone
          if (typeof ev == 'string') {
            for (let [id, sock] of connections) {
              sock.send(ev)
            }
          } else if (isWebSocketCloseEvent(ev)) { // If someone leaves, remove them from connections map
            for (let [id, sock] of connections) {
              if (sock._isClosed) {
                connections.delete(id)
                break
              }
            }
          }
        }
      })
    } else {
      console.log('socket not acceptable')
    }
  }
}