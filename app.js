const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const session = require('express-session');
const serviceAccount = require('./key.json'); 

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://<final-6b1c3>.firebaseio.com" 
});

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');


app.use(session({
    secret: 'your_secret_key', 
    resave: false,
    saveUninitialized: true,
}));

app.get('/signup', (req, res) => {
    const errorMessage = req.session.errorMessage || null;
    req.session.errorMessage = null;
    res.render('signup', { errorMessage });
});

app.get('/login', (req, res) => {
    const errorMessage = req.session.errorMessage || null;
    req.session.errorMessage = null;
    res.render('login', { errorMessage });
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.post('/signup', async (req, res) => {
    const userDetails = {
        name: req.body.name,
        email: req.body.email,
    };

    const db = admin.firestore();
    try {
        const userSnapshot = await db.collection('users').where('email', '==', userDetails.email).get();
        if (!userSnapshot.empty) {
            req.session.errorMessage = "Email already exists. Please log in.";
            return res.redirect('/signup'); 
        }

        await db.collection('users').add(userDetails);
        res.redirect('/login'); 
    } catch (error) {
        console.error("Error adding document: ", error);
        req.session.errorMessage = "Error signing up user.";
        res.redirect('/signup');
    }
});

app.post('/login', async (req, res) => {
    const email = req.body.email;

    const db = admin.firestore();
    try {
        const userSnapshot = await db.collection('users').where('email', '==', email).get();
        if (userSnapshot.empty) {
            req.session.errorMessage = "Invalid email. Please sign up.";
            return res.redirect('/login');
        }

        req.session.user = email; 
        res.redirect('/books'); 
    } catch (error) {
        console.error("Error logging in user: ", error);
        req.session.errorMessage = "Error logging in user.";
        res.redirect('/login'); 
    }
});

app.get('/books', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('books'); 
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
