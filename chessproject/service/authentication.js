const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')

const AUTH_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

async function authenticateUser({username, password}, users, res) {
    const user = users.find(u => u.email === username);

    if (user && await checkPassword(password, user.password)) {
        const accessToken = jwt.sign({id: user.id, name: user.name}, AUTH_TOKEN_SECRET, {expiresIn: '1h'});
        res.cookie('accessToken', accessToken, {httpOnly: true});
        res.redirect('/users/' + user.id);
    } else {
        console.log("Auth failed");
        res.redirect('/login');
    }
}

function authenticateJWT(req, res, next) {
    const token = req.cookies['accessToken'];
    if (token) {
        jwt.verify(token, AUTH_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            console.log(user)
            req.user = user;
            next();
        });
    }
}

async function checkPassword(password, hash){
    let pw = await bcrypt.compare(password, hash)
    return pw;
}


module.exports = {
    authenticateUser,
    authenticateJWT
}
