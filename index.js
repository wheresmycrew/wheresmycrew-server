const io = require('socket.io')({})

io.on('connection', socket => {
  socket.on('coordinates', (coord) => {
    io.emit('coordinates', coord)
  })
})

io.listen(3000)