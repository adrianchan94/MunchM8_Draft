require("dotenv").config();
const express = require("express");
const app = express();
const hbs = require("express-handlebars");
const path = require("path");
const session = require("express-session");
// const setupPassport = require("./passport");
const http = require("http");
const socketio = require("socket.io");
const server = http.createServer(app);
const io = socketio(server);
const formatMessage = require('./utils/messages');
const db = require("knex")({
  // CODE HERE
  client: "pg",
  connection: {
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.PASSWORD,
  },
});

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");


app.engine('handlebars', hbs({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));
const botName = "ChatCord Bot";


app.get('/', (req,res) => {
    res.render('index');
})

app.get('/secondary/:name', (req, res) => {
  const uName = req.params.name;
    res.render('calendar', {layout: 'secondary',
  uName});
});

app.get('/chat/:name', (req, res) => {
  const uName = req.params.name;

  res.render('chat', {layout: 'secondary'});
});

io.on("connection", (socket) => {
    socket.on("joinRoom", ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
  
  
      socket.join(user.room);
  
      // Welcome current user
      socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));
  
      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has joined the chat`)
        );
  
      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    });
  
    // Listen for chatMessage
    socket.on("chatMessage", (msg) => {
      const user = getCurrentUser(socket.id);
  
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    });
  
    // Runs when client disconnects
    socket.on("disconnect", () => {
      const user = userLeave(socket.id);
  
      if (user) {
        io.to(user.room).emit(
          "message",
          formatMessage(botName, `${user.username} has left the chat`)
        );
  
        // Send users and room info
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    });
  });

  app.get("/uCalendar", function (req, res) {
    const uName = req.params.name;
    db.select("*")
      .from("event")
      .then((data) => {
         res.send(data)
      });
  });

  app.post("/newEvent/:name", (req, res) => {
    const uName = req.params.name;
    const { title, date} = req.body;
      db("event")
        .insert({
          title: title,
          start: date,
          editor: uName,
        })
        .then(res.redirect("back"));
  });
  
  //update 
  app.post("/updateEvent/:name/", async (req, res) => {
    const uName = req.params.name;
    const { id, title, date } = req.body;
    db("event")
        .where("id", "=", id)
        .update({
          title: title,
          start: date,
        })
        .then(res.redirect(`/secondary/${uName}`));
  });
  
  //delete
  
  app.post("/deleteEvent/:name/", async (req, res) => {
    const uName = req.params.name;
    const { id, title, date } = req.body;
    db("event")
        .where("id", "=", id)
        .del()
        .then(res.redirect(`/secondary/${uName}`));
  });
  


server.listen(3000, () => {
    console.log("Server is running on port 3000")
})


