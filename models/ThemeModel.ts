import { model, Schema, Document } from 'mongoose';

export interface ThemeModelInterface {
  _id?: String;
  tag: String;
  name?: String;
  tweetsCount: Number;
}

type ThemeModelDocumentInterface = ThemeModelInterface & Document;

const ThemeSchema = new Schema({
  tag: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  tweetsCount: {
    type: Number,
    required: true,
    default: 0,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

export const ThemeModel = model<ThemeModelDocumentInterface>('Theme', ThemeSchema);
