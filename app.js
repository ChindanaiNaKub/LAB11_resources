const express = require("express");
const app = express();
const listItem = require("./model/listItem");
const db = require("./config/db"); // Import MySQL connection

const Authen = require("./control/authen");

const session = require("express-session");
const mysqlStore = require("express-mysql-session")(session);
const bcrypt = require("bcryptjs");
const UserDB = require("./model/userModel"); // Import User Model


app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(express.static("public")); // Serve static files

// Configure session store

const options = db.config;
options.createDatabaseTable = true; // Create session table if it doesn't exist

const sessionStore = new mysqlStore(options, db);

app.use(
  session({
    store: sessionStore,
    secret: "jklfsodifjsktnwjasdp465dd", // A secure secret key
    resave: true, // Forces session to be saved in the database
    saveUninitialized: true, // Saves sessions even if not modified
    cookie: {
      maxAge: 3600000, // Session expires in 1 hour
      sameSite: true,  // Prevents CSRF attacks
      httpOnly: true,  // Prevents XSS attacks by restricting JS access to cookies
      secure: false,   // Set to true if using HTTPS
    },
  })
);


app.post("/login", async (req, res) => {
  try {
      console.log("Request Body:", req.body); // Debug request body
      
      const { username, password } = req.body;

      if (!username || !password) {
          throw new Error("Username or password is missing");
      }

      await Authen.userLogin(req, res, username, password);
      res.redirect("/todos"); 
  } catch (error) {
      console.error("❌ Login error:", error.message);
      res.status(401).json({ message: error.message });
  }
});



app.post("/signup", async (req, res) => {
  try {
      const { email, password } = req.body; // Using email instead of username
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Insert new user into the database
      await UserDB.create({ email: email, password: hashedPassword });

      res.redirect("/login"); // Redirect to login page after signup
  } catch (error) {
      console.error("❌ Signup error:", error);
      res.redirect("/signup?error=user_exists");
  }
});


// app.get("/", (req, res) => {
//   if (req.session.authenticated) {
//       res.redirect("/list"); // Redirect logged-in users
//   } else {
//       res.render("index", { error: null }); // Show login page for unauthenticated users
//   }
// });


// GET route to display tasks
app.get("/", async (req, res) => {
  try {
      // await listItem.create({ name: "SE262!" }); // Insert example task
      const items = await listItem.findAll(); // Fetch tasks from DB
      res.render("list", { listTitle: "Today", newListItems: items });
  } catch (error) {
      console.error("❌ Error fetching tasks:", error);
      res.render("list", { listTitle: "Today", newListItems: [] }); // Show an empty list if error
  }
});

// POST route to add new task
app.post("/add", async (req, res) => {
  try {
      const newItem = { name: req.body.newItem }; // Get task name from form
      await listItem.create(newItem); // Insert into database
      res.redirect("/"); // Reload the page
  } catch (error) {
      console.error("❌ Error adding task:", error);
      res.redirect("/");
  }
});

app.post("/delete", async (req, res) => {
  try {
      const deleteItemId = req.body.id; // Get task ID from form
      await listItem.delete(deleteItemId); // Delete task from DB
      res.redirect("/"); // Reload page
  } catch (error) {
      console.error("❌ Error deleting task:", error);
      res.redirect("/");
  }
});



// Start Server
app.listen(3000, () => {
    console.log("Server started on port 3000");
});
