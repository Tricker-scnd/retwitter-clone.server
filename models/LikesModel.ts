import { model, Schema, Document } from 'mongoose';

export interface LikesModelInterface {
  _id?: String;
  tweetId: String;
  users?: String[];
}

type LikesModelDocumentInterface = LikesModelInterface & Document;

const LikesSchema = new Schema({
  tweetId: {
    type: Schema.Types.ObjectId,
    require: true,
  },
  users: [{ type: Schema.Types.ObjectId }],
});

export const LikesModel = model<LikesModelDocumentInterface>('Likes', LikesSchema);
