import express from 'express';
import { validationResult } from 'express-validator';
import { sendVerifyMail } from '../utils/sendMail';
import { UserModel, UserModelInterface } from '../models/UserModel';
import { generateMD5 } from '../utils/generateHash';
import jwt from 'jsonwebtoken';
import cloudinary from '../core/cloudinary';

class UserController {
  async index(_: express.Request, res: express.Response): Promise<void> {
    try {
      const users = await UserModel.find().exec();

      res.json({
        status: 'success',
        data: users,
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
      const userId = req.params.id;
      if (!userId) {
        res.status(400);
        return;
      }
      const user = await UserModel.findById(userId).exec();

      if (user)
        res.status(200).json({
          status: 'success',
          data: user,
        });
    } catch (e) {
      res.status(404).json({
        status: 'error',
        message: 'user not found',
      });
    }
  }

  async showProfile(req: express.Request, res: express.Response): Promise<void> {
    try {
      const login = req.params.login;
      if (!login) {
        res.status(400);
        return;
      }
      const sub = await UserModel.findOne({ login }, { subscribers: 1 });
      const user = await UserModel.findOne({ login }, { subscribers: 0 }).populate('tweets').exec();

      if (user)
        res.status(200).json({
          status: 'success',
          data: { user: { ...user.toObject(), subCount: sub.subscribers.length } },
        });
    } catch (e) {
      res.status(404).json({
        status: 'error',
        message: 'user not found',
      });
    }
  }
  async profileEdit(req: express.Request, res: express.Response): Promise<void> {
    try {
      const user = req.user as UserModelInterface;
      const editAbout = req.body.about;
      const file = req.file;

      if (!file && !editAbout)
        res.status(404).json({
          status: 'error',
        });

      const userUpdateAbout = await UserModel.findByIdAndUpdate(user._id, { about: editAbout });
      if (file) {
        cloudinary.v2.uploader
          .upload_stream({ resource_type: 'auto' }, async (error, result) => {
            if (error) {
              return null;
            }
            await UserModel.findByIdAndUpdate(user._id, { avatarSrc: result.url });
          })
          .end(file.buffer);
      }

      res.status(200).json({
        status: 'success',
      });
    } catch (e) {
      res.status(404).json({
        status: 'error',
      });
    }
  }

  async create(req: express.Request, res: express.Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ status: 'error', errors: errors.array() });
        return;
      }

      const data = {
        email: req.body.email,
        fullname: req.body.fullname,
        login: req.body.login,
        password: generateMD5(req.body.password + process.env.SECRET_KEY),
        phone: generateMD5(req.body.phone + process.env.SECRET_KEY),
        birthDate: req.body.birthDate,
        confirmHash: generateMD5(Math.random().toString(36).substr(2)),
      };

      const user = await UserModel.create(data);

      sendVerifyMail(data.email, data.confirmHash, (err, info) => {
        if (err)
          res.json({
            status: 'error',
            data: info,
          });
      });

      res.status(201).json({
        status: 'success',
        data: user,
      });
    } catch (e) {
      res.json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async checkForBusy(req: express.Request, res: express.Response): Promise<void> {
    try {
      const errors = [];

      if (req.query.phone !== 'undefined') {
        let hashedPhone =
          String(req.query.phone).substr(0, 1) === ' '
            ? '+' + String(req.query.phone).substr(0)
            : req.query.phone;
        hashedPhone = generateMD5(hashedPhone + process.env.SECRET_KEY);

        const user = await UserModel.findOne({ phone: hashedPhone }).exec();
        if (user) {
          res.status(200).json({
            status: 'error',
            message: 'Пользователь с таким номером телефона уже зарегистрирован!',
          });
          return;
        }
      }
      if (req.query.email !== 'undefined') {
        const user = await UserModel.findOne({ email: String(req.query.email) }).exec();
        if (user) {
          res.status(200).json({
            status: 'error',
            message: 'Пользователь с таким email уже зарегистрирован!',
          });
          return;
        }
      }
      if (req.query.login !== 'undefined') {
        const user = await UserModel.findOne({ login: String(req.query.login) }).exec();
        if (user) {
          res.status(200).json({
            status: 'error',
            message: 'Пользователь с таким логином уже зарегистрирован!',
          });
          return;
        }
      }
      res.status(200).json({
        status: 'success',
        message: '',
      });
    } catch (e) {
      res.status(404).json({
        status: 'error',
      });
    }
  }

  async confirmAccount(req: express.Request, res: express.Response): Promise<void> {
    try {
      const hash = req.query.hash.toString();
      if (!hash) {
        res.status(400).json({
          status: 'error',
        });
        return;
      }
      const filter = { confirmHash: hash };
      const update = { confirmed: true };

      const doc = await UserModel.findOneAndUpdate(filter, update);

      res.json({
        status: 'success',
        message: `user @${doc.login} confirmed`,
      });
    } catch (e) {
      res.status(500).json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async afterLogin(req: any, res: express.Response): Promise<void> {
    try {
      const body = { _id: req.user._id.toString(), email: req.user.email };

      const UserData = await UserModel.findById(body._id).exec();

      const now = new Date();
      const time = now.getTime();
      const expireTime = time + 1000000 * 36000;
      now.setTime(expireTime);

      if (UserData.confirmed) {
        res
          .cookie('auth_token', jwt.sign({ user: body }, process.env.SECRET_KEY), {
            httpOnly: true,
            expires: now,
            sameSite: true,
            secure: true,
          })
          .json({
            status: 'success',
            data: UserData,
          });
      } else
        res.json({
          status: 'notconfirmed',
          message: 'account not confirmed',
        });
    } catch (e) {
      res.status(500).json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async Logout(req: any, res: express.Response): Promise<void> {
    try {
      const now = new Date();
      res.cookie('auth_token', '', {
        httpOnly: true,
        expires: now,
        sameSite: true,
        secure: true,
      });
      res.json({
        status: 'success',
      });
    } catch (e) {
      res.status(500).json({
        status: 'error',
      });
    }
  }

  async getUserInfo(req: express.Request, res: express.Response): Promise<void> {
    const userId = req.user as UserModelInterface;
    const sub = await UserModel.findById(userId, { subscribers: 1 });
    const user = await UserModel.findById(userId, {
      subscribers: 0,
      likes: false,
    });

    try {
      res.json({
        status: 'success',
        data: { ...user.toObject(), subCount: sub.subscribers.length },
      });
    } catch (e) {
      res.status(500).json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async subscribe(req: express.Request, res: express.Response): Promise<void> {
    try {
      const currentUser = req.user as UserModelInterface;
      const subscribeToUser = req.body.userId;

      const User1 = await UserModel.findByIdAndUpdate(currentUser._id, {
        $push: { subscriptions: subscribeToUser },
      });
      const User2 = await UserModel.findByIdAndUpdate(subscribeToUser, {
        $push: { subscribers: currentUser._id },
      });

      if (User1 && User2)
        res.json({
          status: 'success',
        });
      else
        res.json({
          status: 'error',
        });
    } catch (e) {
      res.status(500).json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async cancelSubscription(req: express.Request, res: express.Response): Promise<void> {
    try {
      const currentUser = req.user as UserModelInterface;
      const subscribeToUser = req.body.userId;

      const User1 = await UserModel.findByIdAndUpdate(currentUser._id, {
        $pull: { subscriptions: subscribeToUser },
      });
      const User2 = await UserModel.findByIdAndUpdate(subscribeToUser, {
        $pull: { subscribers: currentUser._id },
      });

      if (User1 && User2)
        res.json({
          status: 'success',
        });
      else
        res.json({
          status: 'error',
        });
    } catch (e) {
      res.status(500).json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async getSubscribers(req: express.Request, res: express.Response): Promise<void> {
    try {
      const userId = req.params.userId;
      if (!userId) {
        res.status(400).json({
          status: 'error',
        });
      }

      const currentUser = await UserModel.findById(userId).exec();
      const subscribers = await UserModel.find({ _id: { $in: currentUser.subscribers } }).exec();

      res.status(200).json({
        status: 'success',
        data: subscribers,
      });
    } catch (e) {
      res.status(500).json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }

  async getSubscriptions(req: express.Request, res: express.Response): Promise<void> {
    try {
      const userId = req.params.userId;
      if (!userId) {
        res.status(400).json({
          status: 'error',
        });
      }

      const currentUser = await UserModel.findById(userId).exec();
      const subscriptions = await UserModel.find({
        _id: { $in: currentUser.subscriptions },
      }).exec();

      res.status(200).json({
        status: 'success',
        data: subscriptions,
      });
    } catch (e) {
      res.status(500).json({
        status: 'error',
        message: JSON.stringify(e),
      });
    }
  }
}

export const UserCtrl = new UserController();
