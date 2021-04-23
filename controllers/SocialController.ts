import express from 'express';
import { mongoose } from '../core/db';
import { TweetModel } from '../models/TweetModel';
import { UserModel, UserModelInterface } from '../models/UserModel';
import { LikesModel } from '../models/LikesModel';

const isValidObjectId = mongoose.Types.ObjectId.isValid;

class SocialController {
  async showLikes(req: express.Request, res: express.Response): Promise<void> {
    try {
      const tweetId = req.params.id;
      if (!isValidObjectId(tweetId)) {
        res.status(400).send();
        return;
      }
      const likes = await LikesModel.findOne({ tweetId: tweetId }).exec();

      res.json({
        status: 'success',
        data: likes,
      });
    } catch (e) {
      res.json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async addLike(req: express.Request, res: express.Response): Promise<void> {
    try {
      const user = req.user as UserModelInterface;
      const tweetId = req.body.tweetId;

      if (tweetId) {
        const like = await LikesModel.findOneAndUpdate({ tweetId }, { $push: { users: user._id } });
        const userLikes = await UserModel.findOneAndUpdate(
          { _id: user._id },
          { $push: { likes: tweetId } },
        );
        const tweet = await TweetModel.findOneAndUpdate(
          { _id: tweetId },
          {
            $inc: {
              likesCount: 1,
            },
          },
        );

        res.json({
          status: 'success',
        });
      }
    } catch (e) {
      res.json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async deleteLike(req: express.Request, res: express.Response): Promise<void> {
    try {
      const user = req.user as UserModelInterface;
      const tweetId = req.body.tweetId;

      if (tweetId) {
        const like = await LikesModel.findOneAndUpdate({ tweetId }, { $pull: { users: user._id } });
        const userLikes = await UserModel.findOneAndUpdate(
          { _id: user._id },
          { $pull: { likes: tweetId } },
        );
        const tweet = await TweetModel.findOneAndUpdate(
          { _id: tweetId },
          {
            $inc: {
              likesCount: -1,
            },
          },
        );
        res.json({
          status: 'success',
        });
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

export const SocialCtrl = new SocialController();
