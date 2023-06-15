const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index');
});

router.route('/login')
    .get((req, res) => {
    res.render('login');
}).post((req, res)=>{

});

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', (req, res)=>{

});

module.exports = router;