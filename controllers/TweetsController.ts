import express from 'express';
import { validationResult } from 'express-validator';
import { mongoose } from '../core/db';
import { TweetModel, TweetModelInterface } from '../models/TweetModel';
import { UserModel, UserModelInterface } from '../models/UserModel';
import cloudinary from '../core/cloudinary';
import { getTags, parseQuery } from '../utils/parseString';
import { ThemesCtrl } from './ThemesController';
import { LikesModel, LikesModelInterface } from '../models/LikesModel';

const isValidObjectId = mongoose.Types.ObjectId.isValid;

class TweetsController {
  async index(req: express.Request, res: express.Response): Promise<void> {
    try {
      const user = req.user as UserModelInterface;
      const userLikes = await UserModel.findById(user._id, { likes: 1 }).exec();

      const tweets = await TweetModel.find()
        .sort({ publishedDate: -1 })
        .exec((err, tweets) => {
          const TweetsEdited = tweets.map((t) => ({
            ...t.toObject(),
            liked: userLikes.likes.includes(t._id),
          }));
          res.json({
            status: 'success',
            data: TweetsEdited,
          });
        });
    } catch (e) {
      res.json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async userTweets(req: express.Request, res: express.Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const tweets = await TweetModel.find({ userId }).sort({ publishedDate: -1 }).exec();
      res.json({
        status: 'success',
        data: tweets,
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
      const user = req.user as UserModelInterface;

      if (!isValidObjectId(tweetId)) {
        res.status(400).send();
        return;
      }
      const tweet = await TweetModel.findById(tweetId).exec();
      const isLiked = await UserModel.findOne({ _id: user._id, likes: tweetId }, { _id: 1 }).exec();

      res.json({
        status: 'success',
        data: { ...tweet.toObject(), liked: !!isLiked },
      });
    } catch (e) {
      res.json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async showFavorite(req: express.Request, res: express.Response): Promise<void> {
    try {
      const user = req.user as UserModelInterface;
      const userLikes = await UserModel.findById(user._id, { likes: 1 }).exec();

      const tweets = await TweetModel.find({ _id: { $in: userLikes.likes } }).sort({
        publishedDate: -1,
      });

      res.json({
        status: 'success',
        data: tweets,
      });
    } catch (e) {
      res.json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async create(req: express.Request, res: express.Response): Promise<void> {
    try {
      const user = req.user as UserModelInterface;
      const files = req.files as Express.Multer.File[];
      if (user) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          res.status(400).json({ status: 'validations errors', errors: errors.array() });
          return;
        }

        const tags = getTags(req.body.text);

        tags.length && ThemesCtrl.create(tags); //create themes

        const data: TweetModelInterface = {
          text: req.body.text,
          userId: user._id,
          images: [],
          user: {
            userName: user.fullname,
            login: user.login,
            avatarSrc: user.avatarSrc,
            verified: user.verified,
          },
          tags: tags,
        };

        if (files.length) {
          files.forEach((file) => {
            cloudinary.v2.uploader
              .upload_stream({ resource_type: 'auto' }, async (error, result) => {
                if (error) {
                  return null;
                }
                data.images.push(result.url);
                if (data.images.length === files.length) {
                  const tweet = await TweetModel.create(data);
                  res.json({
                    status: 'success',
                    data: tweet,
                  });
                }
              })
              .end(file.buffer!);
          });
        } else {
          const tweet = await TweetModel.create(data);

          const likesData: LikesModelInterface = {
            tweetId: tweet._id,
            users: [],
          };
          const likes = await LikesModel.create(likesData);

          res.json({
            status: 'success',
            data: tweet,
          });
        }
      }
    } catch (e) {
      res.json({
        status: 'create error',
        message: JSON.stringify(e),
      });
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

  async search(req: express.Request, res: express.Response): Promise<void> {
    try {
      const searchQuery = req.params.query;

      const [words, tags] = parseQuery(searchQuery);

      // console.log('words:', words, '\ntags:', tags);

      const tweets = await TweetModel.find({ tags: { $in: tags } })
        .sort({ publishedDate: -1 })
        .exec();

      res.status(200).json({
        status: 'success',
        data: tweets,
      });
    } catch (e) {
      res.json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async pinTweet(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { tweetId, type } = req.body;

      if (tweetId) {
        const user = req.user as UserModelInterface;
        const oldPinnedTweetId = user.pinnedTweet;

        const setType = type === 'PIN' ? true : false;
        const setTypeUser = type === 'PIN' ? tweetId : null;


        const User = await UserModel.findByIdAndUpdate(user._id, {
          $set: { pinnedTweet: setTypeUser },
        });
        const oldTweet = await TweetModel.findByIdAndUpdate(oldPinnedTweetId, {
          $set: { pinned: false },
        });
        const tweet = await TweetModel.findByIdAndUpdate(tweetId, {
          $set: { pinned: setType },
        });

        res.status(200).json({
          status: 'success',
        });
      }
    } catch (e) {
      console.log(e);

      res.json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }
}

export const TweetsCtrl = new TweetsController();
