const bcrypt = require("bcryptjs");
const UserDB = require("../model/userModel");

const userLogin = async function (req, res, username, password) {
    // Check if user already exists
    const oldUser = await UserDB.findByKey('username', username);

    if (oldUser) {
        // User exists, check if password is correct
        const isPasswordCorrect = bcrypt.compareSync(password, oldUser.password);
        if (isPasswordCorrect) {
            // Correct password, update session
            req.session.authenticated = true;
            req.session.userId = oldUser.id;
            req.session.username = username;
            req.session.wish = [];

            console.log("User logged in. Session ID: ", req.sessionID);
     
        } else {
            // Incorrect password
            req.session.authenticated = false;
            return res.status(401).json({ msg: "Wrong authentication" });
        }
    } else {
        // New user --> add new user to database
        // Note: In real apps, this should be done through a signup route.
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = await UserDB.create({ username: username, password: hashedPassword });
        console.log("New user created: " + newUser);

        // Create session for new user
        req.session.authenticated = true;
        req.session.userId = newUser;
        req.session.username = username;
        

        console.log("New user session: ", req.sessionID);
        console.log(req.session);


    }
};

exports.userLogin = userLogin;


module.exports.authentication = async (req, res, next) => {
    console.log("Session in authentication: ", req.sessionID);

    // Check if the user is authenticated
    if (!req.session.authenticated) {
        console.log("Unauthenticated access attempt.");
        return res.redirect("/?q=session-expired");
    }
    
    try {
        // Check if user exists in the database
        let user = await UserDB.findById(req.session.userId);
        console.log("Authenticated user: " + user);

        if (!user) {
            console.log("User not found. Session expired.");
            req.session.destroy();
            return res.redirect("/?q=session-expired");
        }

        // User exists, proceed to the next route
        next();
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Server error. Please reload the page later." });
    }
};

