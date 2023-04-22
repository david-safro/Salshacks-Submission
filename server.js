require('dotenv').config();

const { PORT, DATABASE_URL, COOKIE_SECRET } = process.env;

const session = require('express-session');

const mongoose = require('mongoose');
mongoose.connect(DATABASE_URL);

const AccountModel = require('./models/Account');
const ClassroomModel = require('./models/Classroom');

const path = require('node:path');

const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/public/views/pages'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
	secret: COOKIE_SECRET,
	resave: true,
	saveUninitialized: true
}));


const forceLogin = (req, res, next) => {
    if (!req.session.account) return res.redirect('/login');

    next();
}

const handleLogin = async (req, res) => {
    const account = await AccountModel.findOne({username: req.body.username, password: req.body.password});
    if (account) {
        req.session.account = account;
        res.redirect('/dashboard');
    }
    else {
        res.send('credentials invalid');
    }
}

app.get('/login', (req, res) => {
    if (req.session.account) return res.redirect('/home');

    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/dashboard', forceLogin, (req, res) => {
    res.render('dashboard', {account: req.session.account});
});

app.get('/classroom/:id', forceLogin, async (req, res) => {
    const classroom = await ClassroomModel.findById(req.params.id);
    if (classroom == null) return;
    
    let students = [];
    for (let i = 0; i < classroom.members.length; i++) {
        students.push(await AccountModel.findById(classroom.members[i]));
    }

    res.render('classroom', {classroom: classroom, 'students': students, role: req.session.account.role});
})

app.post('/login', handleLogin);

app.post('/signup', async (req, res) => {
    if (await AccountModel.findOne({username: req.body.username}) != null) {
        res.send('account with that name already exists');
    }
    else {
        await (await AccountModel.create({username: req.body.username, password: req.body.password, role: req.body.role})).save().then(() => {handleLogin(req, res)});
    }
});

app.post('/signout', (req, res) => {
    req.session.account = null;
});

app.post('/create-classroom', async (req, res) => {
    const classroom = await ClassroomModel.create({name: req.body.name, members: [req.session.account._id]});
    await classroom.save();
    res.redirect(`/classroom/${classroom._id}`);
});

app.post('/join-classroom', async (req, res) => {
    const classroom = await ClassroomModel.findById(req.body.classCode);
    if (classroom.members.includes(req.session.account._id)) return res.redirect('/dashboard');
    classroom.members.push(req.session.account._id);
    await ClassroomModel.updateOne({ _id: classroom._id }, { members: classroom.members }, { new: true });
    res.redirect(`/classroom/${classroom._id}`);
});

const port = PORT || 1337;
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});