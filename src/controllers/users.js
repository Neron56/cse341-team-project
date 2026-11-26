import { authenticateUser, createUser, getPaginatedUsers } from "../models/users.js";

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

const allowedSortedFields = ['displayName', 'username', 'email'];

const parsePositiveInteger = (value, defaultValue) => {
    if (value === undefined) {
        return defaultValue;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        return null;
    }

    return parsed;
};

const createUsersList = async (req, res, next) => {
    try{
        const page = parsePositiveInteger(req.query.page, 1);
        const requestedLimit = parsePositiveInteger(req.query.limit, 10);

        if (!page || !requestedLimit || requestedLimit > 50) {
            return res.status(400).json({
                errors: [{field: 'pagination', message: 'page and limit must be valid positive numbers'}]
            });
        }

        const limit = requestedLimit;
        if (req.query.sort && !allowedSortedFields.includes(req.query.sort)) {
            return res.status(400).json({
                errors: [{field: 'sort', message: 'sort is not supported'}]
            });
        }

        const sort = req.query.sort || 'username';
        const order = req.query.order === 'desc' ? -1 : 1;

        const { users, totalUsers } = await getPaginatedUsers({
            filter: {},
            page,
            limit,
            sort,
            order
        });
        return res.status(200).json({
            data: users,
            pagination: {
                page,
                limit,
                totalUsers,
                totalPages: Math.ceil(totalUsers/limit),
                hasNextPage: page * limit < totalUsers,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        next(error);
    }
};

export {processLoginForm, processUserRegistrationForm, processLogout, createUsersList};