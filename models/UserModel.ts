import { model, Schema, Document } from 'mongoose';

export interface UserModelInterface {
  _id: String;
  email: String;
  phone: String;
  fullname: String;
  login: String;
  birthDate: Date;
  password: String;
  location?: String;
  confirmed: Boolean;
  confirmHash: String;
  avatarSrc?: String;
  verified?: Boolean;
  about?: String;
  website?: String;
  subscribers?: String[];
  subscriptions?: String[];
  likes?: String[];
  pinnedTweet?: String;
}

type UserModelDocumentInterface = UserModelInterface & Document;

const UserSchema = new Schema({
  email: {
    unique: true,
    required: true,
    type: String,
  },
  fullname: {
    required: true,
    type: String,
  },
  login: {
    unique: true,
    required: true,
    type: String,
  },
  birthDate: {
    required: true,
    type: Date,
  },
  password: {
    required: true,
    type: String,
    select: false,
  },
  location: {
    type: String,
  },
  confirmed: {
    required: true,
    type: Boolean,
    default: true,
  },
  confirmHash: {
    required: true,
    type: String,
    select: false,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  phone: {
    required: true,
    type: String,
  },
  avatarSrc: {
    type: String,
    default: '/img/avatar_default.png',
  },
  pinnedTweet: { type: String, default: '' },

  subscribers: [{ type: Schema.Types.ObjectId }],
  subscriptions: [{ type: Schema.Types.ObjectId }],
  likes: {
    type: [{ type: Schema.Types.ObjectId }],
    default: [],
  },
  about: String,
  registerDate: {
    type: Date,
    default: Date.now,
  },
  website: String,
});

UserSchema.set('toJSON', {
  transform: function (_, obj) {
    delete obj.password;
    delete obj.confirmHash;
    return obj;
  },
});

export const UserModel = model<UserModelDocumentInterface>('User', UserSchema);
