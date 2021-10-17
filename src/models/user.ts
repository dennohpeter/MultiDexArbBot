import { Schema, model, Model } from 'mongoose';

// An interface that describes attributes that a user should have
interface UserAttrs {
    tg_id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    is_bot: boolean;
    is_active?: boolean;
    bot_name?: string;
}

// An interface that describes what attributes a user model should have
interface UserModel extends Model<UserDoc> {
    build(attrs: UserAttrs): UserDoc
}

// An interface that descibes single user properties
interface UserDoc extends Document {
    tg_id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    is_bot: boolean;
    is_active?: boolean;
    last_action?: string;
    created_at?: Date;
    bot_name?: string;
}

// Creating user schema
const userSchema = new Schema({
    tg_id: { type: Number },
    is_bot: { type: Boolean },
    first_name: { type: String },
    last_name: { type: String },
    username: { type: String },
    bot_name: { type: String },
    is_active: { type: Boolean, default: false },
    last_action: { type: String },
    created_at: { type: Date, default: Date.now }

})
// Statics
userSchema.static('build', (attrs: UserAttrs) => { return new User(attrs) })

// Creating user model
const User = model<UserDoc & UserModel>('User', userSchema)

export { User, UserAttrs, UserDoc }