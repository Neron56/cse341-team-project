import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import Path from 'path';
import { fileURLToPath } from 'url';
import pkg from './package.json' with { type: 'json' };
import { connectToDb, getMongoClient } from './src/db/connect.js';
import globalMiddleware from './src/middleware/global.js';
import { loadSessionUser } from './src/middleware/auth.js';
import adminRoutes from './src/routes/admin.js';
import authRoutes from './src/routes/auth.js';
import { userPages, userApi } from './src/routes/users.js';
import routes from './src/routes/router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

const createMongoClientPromise = async () => {
    await connectToDb();
    return getMongoClient();
};

const app = express();
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
}

if (process.env.NODE_ENV?.toLowerCase() === 'production') {
    app.set('trust proxy', 1);
}

// Add version info to res.locals for access in templates.
app.use((req, res, next) => {
    res.locals.appVersion = pkg.version;
    next();
});

// Configure static files and EJS templates.
app.use(express.static(Path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', Path.join(__dirname, 'src/views'));

// Parse JSON and URL-encoded request bodies.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
    name: 'kizuna.sid',
    secret: sessionSecret,
    store: MongoStore.create({
        clientPromise: createMongoClientPromise(),
        collectionName: 'sessions',
        ttl: 60 * 60
    }),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV?.toLowerCase() === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000
    }
}));

app.use(globalMiddleware);
app.use(loadSessionUser);
app.use('/api/users', userApi);
app.use('/', userPages);
app.use('/', authRoutes);
app.use('/', adminRoutes);
app.use('/', routes);

// Catch requests that did not match a route.
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Render the appropriate error page.
app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (req.path.startsWith('/api/')) {
        res.set('Cache-Control', 'no-store');
        return res.status(status).json({
            error: status >= 500 ? 'Unable to complete request' : 'Invalid request'
        });
    }
    const template = status === 404 ? '404' : '500';
    const context = {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        error: err.message,
        stack: err.stack
    };

    return res.status(status).render(`errors/${template}`, context);
});

export default app;
