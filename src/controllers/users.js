import { authenticateUser, createUser } from "../models/users.js";

const processLoginForm = async (req,res) => {
    const {email, password} = req.body;
    try{
        const user = await authenticateUser(email, password);
        console.log(user)
        if(user){
            req.session.user = user;
            res.redirect('/');
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.redirect('/login');
    }
};

const processUserRegistrationForm = async (req, res) => {
    const { displayName, username, email, password } = req.body;

    try {
        // Create the user in the database
        const userId = await createUser(displayName, username, email, password);

        // Redirect to the home page after successful registration
        res.redirect('/');
    } catch (error) {
        console.error('Error registering user:', error);
        res.redirect('/register');
    }
};

const processLogout = (req,res) => {
    if(req.session.user) {
        delete req.session.user;
    };
    return res.redirect('/login');
};

export {processLoginForm, processUserRegistrationForm, processLogout};