//src/models/schemas/users.js.
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        displayName:{
            type:String,
        },
        username:{
            type:String,
            required:true,
            unique:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
        },
        passwordHash:{
            type:String,
            required:true,
        },
        role:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            required: true,
        },
    }
);

const user = mongoose.model('user', userSchema);

export default user;