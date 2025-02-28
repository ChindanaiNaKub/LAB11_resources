const mysql = require("mysql2");

let config = {
    host: "localhost",      // Ensure MySQL is running on localhost
    user: "root",           // Change if using a different MySQL user
    password: "Timeza.084", // Replace with your actual MySQL root password
    database: "todolistDB"  // Ensure this database exists
};

// Create a single connection
const connection = mysql.createConnection(config);

// Connect to the database
connection.connect(err => {
    if (err) {
        console.error("❌ Database connection failed:", err);
    } else {
        console.log("✅ Database connected successfully");
    }
});

module.exports = connection;
