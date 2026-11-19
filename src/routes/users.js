const loginPage = (req, res) => {
    res.render('login', { title: 'Kizuna Rail' });
};
const registerPage = (req, res) => {
    res.render('register', { title: 'Kizuna Rail' });
};

export {loginPage, registerPage};