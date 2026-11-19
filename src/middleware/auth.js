const requireApiLogin = () => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        return next();
    };
};

const requireApiRole = (role) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if(req.session.user.role !== role){
            return res.status(403).json({ error: 'You do not have permission to do this' });
        }
        return next();
    };
};

const requirePageLogin = () => {
    return(req, res, next) => {
        if (!req.session || !req.session.user) {
        return res.redirect('/login');
        }
        return next();
    };
};

const requirePageRole = (role) => {
    return (req,res,next) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    if(req.session.user.role !== role){
        return res.status(403).render('errors/403', { title: 'You do not have permission to do this' });
    }
    return next();
}};


export { requireApiLogin, requireApiRole, requirePageLogin, requirePageRole };