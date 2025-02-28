const express = require("express");
const app = express();
const listItem = require("./model/listItem");
const db = require("./config/db"); // Import MySQL connection
const Authen = require("./control/authen"); // Import authentication controller

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
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 3600000, // Session expires in 1 hour
      sameSite: true,
      httpOnly: true,
      secure: false,
    },
  })
);

// 🔹 Root Route (Show Login Page)
// Root Route (Show Login Page)
app.get("/", (req, res) => {
  // Clear any existing session when hitting the login page directly
  // This ensures we start fresh unless coming from a proper login
  if (req.query.q !== 'session-expired') {
    req.session.authenticated = false;
    req.session.userId = null;
  }
  
  res.render("index", { error: req.query.error || null });
});

// 🔹 Login API (Handles authentication)
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', username);
    
    // Call the authentication function
    await Authen.userLogin(req, res, username, password);
    
    // If we get here, authentication was successful
    console.log('User authenticated, redirecting to todos');
    res.redirect('/todos');
  } catch (error) {
    console.error('Login error:', error);
    res.render('index', { error: 'Invalid username or password' });
  }
});

// 🔹 Signup API (Create new user)
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body; // Use username instead of email
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert new user into the database
    await UserDB.create({ username: username, password: hashedPassword });

    res.redirect("/"); // Redirect to login page after signup
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.redirect("/signup?error=user_exists");
  }
});

// 🔹 Protected Route: `/todos` (Requires Authentication)
app.get("/todos", Authen.authentication, async (req, res) => {
  try {
    const items = await listItem.findAll(); // Fetch tasks from DB
    const user = await UserDB.findById(req.session.userId); // Fetch user details

    res.render("list", {
      listTitle: "Today",
      newListItems: items,
      user: user, // Pass user info to EJS
    });
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.render("list", { listTitle: "Today", newListItems: [], user: null });
  }
});

// 🔹 Add New Task
app.post("/add", Authen.authentication, async (req, res) => {
  try {
    const newItem = { name: req.body.newItem };
    await listItem.create(newItem);
    res.redirect("/todos");
  } catch (error) {
    console.error("❌ Error adding task:", error);
    res.redirect("/todos");
  }
});

// 🔹 Delete Task
app.post("/delete", Authen.authentication, async (req, res) => {
  try {
    const deleteItemId = req.body.id;
    await listItem.delete(deleteItemId);
    res.redirect("/todos");
  } catch (error) {
    console.error("❌ Error deleting task:", error);
    res.redirect("/todos");
  }
});

// 🔹 Logout API
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to log out." });
    }
    res.redirect("/");
  });
});

// 🔹 Start Server
app.listen(3000, () => {
  console.log("✅ Server started on port 3000");
});
