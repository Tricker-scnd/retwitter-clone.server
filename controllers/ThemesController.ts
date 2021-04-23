import express from 'express';
import { validationResult } from 'express-validator';
import { mongoose } from '../core/db';
import { TweetModel, TweetModelInterface } from '../models/TweetModel';
import { UserModelInterface } from '../models/UserModel';
import { ThemeModel, ThemeModelInterface } from '../models/ThemeModel';

const isValidObjectId = mongoose.Types.ObjectId.isValid;

class ThemesController {
  async index(_: express.Request, res: express.Response): Promise<void> {
    try {
      const themes = await ThemeModel.find().sort({ tweetsCount: 'desc' }).exec();
      res.json({
        status: 'success',
        data: themes,
      });
    } catch (e) {
      res.json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async show(req: express.Request, res: express.Response): Promise<void> {
    try {
      const tweetId = req.params.id;

      if (!isValidObjectId(tweetId)) {
        res.status(400).send();
        return;
      }
      const tweet = await TweetModel.findById(tweetId).exec();

      res.json({
        status: 'success',
        data: tweet,
      });
    } catch (e) {
      res.json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }
  async create(tags: String[]): Promise<void> {
    try {
      if (tags.length) {
        tags.forEach(async (tag) => {
          const searchTheme = await ThemeModel.findOne({ tag }).exec();
          if (searchTheme) {
            const count: Number = Number(searchTheme.tweetsCount) + 1;
            searchTheme.set({ tweetsCount: count });
            searchTheme.save();
          } else {
            const data: ThemeModelInterface = {
              tag,
              tweetsCount: 1,
            };
            await ThemeModel.create(data);
          }
        });
      }
    } catch (e) {
      return;
    }
  }

  async delete(req: express.Request, res: express.Response): Promise<void> {
    const user = req.user as UserModelInterface;
    const tweetId = req.params.id;

    if (!isValidObjectId(tweetId)) {
      res.status(400).send();
      return;
    }

    try {
      if (user) {
        const tweet = await TweetModel.findOne({ _id: tweetId });

        if (tweet.userId.toString() === user._id.toString()) {
          const tweetDelete = await TweetModel.deleteOne({ _id: tweetId });
          res.json({
            status: 'success',
          });
          return;
        }

        res.status(400).send();
        return;
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
      return;
    }
  }
}

export const ThemesCtrl = new ThemesController();
