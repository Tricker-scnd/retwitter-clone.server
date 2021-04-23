import { model, Schema, Document } from 'mongoose';

export interface TweetModelInterface {
  _id?: {
    required: true;
    type: String;
  };
  text: String;
  images?: String[];
  userId: String;
  user: {
    userName: String;
    login: String;
    avatarSrc: String;
    verified: Boolean;
  };
  tags?: String[];
  liked?: boolean;
  likesCount?: number;
  pinned?: boolean;
}

type TweetModelDocumentInterface = TweetModelInterface & Document;

const TweetSchema = new Schema(
  {
    text: {
      type: String,
      default: '',
    },
    userId: {
      required: true,
      type: Schema.Types.ObjectId,
    },
    user: {
      userName: {
        required: true,
        type: String,
      },
      login: {
        required: true,
        type: String,
      },
      avatarSrc: {
        required: true,
        type: String,
      },
      verified: {
        required: true,
        type: String,
      },
    },
    tags: [{ type: String }],
    publishedDate: {
      type: Date,
      default: Date.now,
    },
    images: [{ type: String }],
    likesCount: {
      type: Number,
      default: 0,
    },
    pinned: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  },
);

TweetSchema.set('toJSON', {
  transform: function (_, obj) {
    delete obj.password;
    delete obj.confirmHash;
    return obj;
  },
});

export const TweetModel = model<TweetModelDocumentInterface>('Tweet', TweetSchema);
