const  adminPage = (req, res) => {
    res.render('adminDashboard', { title: 'Kizuna Rail' });
};

export {adminPage};