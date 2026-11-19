//src/models/users.js. 
import user from "./schemas/users.js";
import role from "./schemas/roles.js";
import bcrypt from "bcrypt";

export async function createUser(displayName, username, email, password) {
    const defaultRole = await role.findOne({ name: 'user' });
    if (!defaultRole) throw new Error('Default role not found');
    if(!password) throw new Error('Password is required');
    if (!displayName){
        displayName = username;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const createdUser = await user.create({
        displayName,
        username,
        email,
        passwordHash,
        role: defaultRole._id
    });

    return createdUser._id.toString();
}

export async function findUserByEmail(email) {
    return user.findOne({ email }).populate('role');
}

export async function verifyPassword(password, passwordHash) {   
    return bcrypt.compare(password, passwordHash);
}

export async function authenticateUser(email, password) {
    const user = await findUserByEmail(email);
    if (!user) return null;
    if(user){
        const verify = await verifyPassword(password, user.passwordHash);
        if(verify){
            delete user.passwordHash;
            return {
                _id: user._id,
                displayName: user.displayName,
                role: user.role.name,

            }
        }else{
            return null;
        };
    }else{
        return null;
    };
};