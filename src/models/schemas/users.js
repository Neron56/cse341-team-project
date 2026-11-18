//src/models/schemas/users.js.
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        displayName:{
            type:String,
            unique:true,
        },
        username:{
            type:String,
            require:true,
            unique:true,
        },
        email:{
            type:String,
            require:true,
            unique:true,
            lowercase:true,
        },
        passwordHash:{
            type:String,
            require:true,
        },
        role:{
            type:mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            require:true,
        },
    }
);

export const user = mongoose.model('user', userSchema);