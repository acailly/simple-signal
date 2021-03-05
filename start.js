const io = require("socket.io")(); // create a socket.io server
var SimpleSignalServer = require("./server/src/index"); // require('simple-signal-server')
var signal = new SimpleSignalServer(io);

const rooms = {};

// when a peer starts, it will request peers in a specific room
signal.on("discover", (request) => {
  if (!request.discoveryData) {
    // return nothing
    request.discover({});
  } else {
    // return peers in a room
    const roomID = request.discoveryData;
    if (!rooms[roomID]) {
      rooms[roomID] = new Set();
    }
    request.discover({
      roomResponse: roomID, // return the roomID so client can correlate discovery data
      peers: Array.from(rooms[roomID]),
    });
    if (request.socket.roomID) {
      // if peer was already in a room
      console.log(request.socket.id, "left room", request.socket.roomID);
      rooms[request.socket.roomID].delete(request.socket.id); // remove peer from that room
    }
    if (request.socket.roomID !== roomID) {
      // if peer is joining a new room
      request.socket.roomID = roomID; // track the current room in the persistent socket object
      console.log(request.socket.id, "joined room", roomID);
      rooms[roomID].add(request.socket.id); // add peer to new room
    }
  }
});

console.log("discovery server started on port 3000!");
io.listen(process.env.PORT || 3000);
