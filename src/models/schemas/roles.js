import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            enum: ['user', 'admin'],
            required:true,
            unique:true,
        },
    }
)
const role = mongoose.model('Role', roleSchema);

export default role;