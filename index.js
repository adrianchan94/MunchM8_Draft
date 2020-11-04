require('dotenv').config();

const express = require('express');
const app = express();
const hbs = require('express-handlebars');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const bodyParser = require('body-parser');

const initializePassport = require("./passportConfig")
initializePassport(passport);


const bcrypt = require('bcrypt');
const db = require('knex')({
    client: 'postgresql',
    connection: {
        database: process.env.DB_NAME,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD
    }
});

app.use(express.static('public'))

app.engine('handlebars', hbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.get('/', checkNotAuthenticated, (req, res) => {
    res.render('index');
})

app.get('/main/:username', checkNotAuthenticated, (req, res) => {
    res.render('index');
})

app.get('/login', checkAuthenticated, (req, res) => {
    res.render('login');
})

let user = [];

app.post('/login', passport.authenticate('local', {
    // successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}), (req, res) => {

    const {username, password} = req.body;

    array = [];
    array.push(username);

    console.log("something");

    res.redirect(`/main/${username}`)
})

app.get('/logout', (req, res) => {
    req.logOut();
    req.flash('success_msg', 'Successfully logged out');
    res.redirect('/login');

})

app.get('/register', checkAuthenticated, (req, res) => {
    res.render('register');
})

app.post('/register', async (req, res) => {
    let { name, username, email, password, password2 } = req.body;

    let errors = [];

    if (!name || !email || !username || !email || !password || !password2) {
        errors.push({ message: "Please enter all fields" })
    }

    if (password.length < 6) {
        errors.push({ message: "Password should be at least 6 characters long" })
    }

    if (password !== password2) {
        errors.push({ message: "Passwords Should Match" })
    }

    if (errors.length > 0) {
        console.log(errors)

        res.render('register', {
            error: true,
            errors
        })
    } else {

        let hashedPassword = await bcrypt.hash(password, 10)
        console.log(hashedPassword);

        let query = db.select('*').from('users').where("username", username);

        query.then((rows) => {

            if (rows.length > 0) {
                errors.push({ message: "username already registered" });
                res.render('register', { error: true, errors })
            } else {
                db("users")
                    .insert({
                        name: name,
                        username: username,
                        email: email,
                        password: hashedPassword
                    })
                    .then((row) => {
                        req.flash("success", "Registration Successful. Please Login")
                        res.redirect('/login')
                    })
            }
        }).catch((error) => {
            throw error;
        })
    }
})

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        let authUser = user[0];

        console.log(authUser)

        return res.redirect(`/main/${authUser}`);
    }
    next();
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }

    res.redirect("/login");
}


app.get('/secondary/:username', (req, res) => {
    res.render('profile', { layout: 'secondary' });
});

app.get('/find-a-table', (req, res) => {
    res.render('find-a-table', {layout: 'secondary'});
})

app.listen(3000, () => {
    console.log("Server is running on port 3000");
})


