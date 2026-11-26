const loginPage = (req, res) => {
    res.render('login', { title: 'Kizuna Rail' });
};
const registerPage = (req, res) => {
    res.render('register', { title: 'Kizuna Rail' });
};
const usersPage = (req, res) => {
    res.render('users/list', { title: 'User View' });
};

export {loginPage, registerPage, usersPage};