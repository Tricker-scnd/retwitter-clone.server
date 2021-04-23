import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import './core/db';
import cookieParser from 'cookie-parser';

import { UserCtrl } from './controllers/UserController';
import { registrValidations } from './validations/register';
import { passport } from './core/passport';
import { tweetCreateValidations } from './validations/createTweet';
import { TweetsCtrl } from './controllers/TweetsController';
import { UploadFileCtrl } from './controllers/UploadFileController';
import { uploader } from './core/multer';
import { ThemesCtrl } from './controllers/ThemesController';
import { SocialCtrl } from './controllers/SocialController';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

app.get('/users', UserCtrl.index);
app.get('/users/me', passport.authenticate('jwt'), UserCtrl.getUserInfo);
app.get('/profile/:login', passport.authenticate('jwt'), UserCtrl.showProfile);
app.post(
  '/profile/',
  passport.authenticate('jwt'),
  uploader.single('avatar'),
  UserCtrl.profileEdit,
);
app.post('/users/subscribe', passport.authenticate('jwt'), UserCtrl.subscribe);
app.post('/users/unsubscribe', passport.authenticate('jwt'), UserCtrl.cancelSubscription);
app.get('/user/getsubs/:userId', passport.authenticate('jwt'), UserCtrl.getSubscribers);
app.get('/user/getsubscriptions/:userId', passport.authenticate('jwt'), UserCtrl.getSubscriptions);
app.post('/users/:id', registrValidations, UserCtrl.show);

app.get('/auth/verify', UserCtrl.confirmAccount);
app.get('/auth/register/check/', UserCtrl.checkForBusy);
app.post('/auth/register', registrValidations, UserCtrl.create);
app.post('/auth/login', passport.authenticate('local'), UserCtrl.afterLogin);
app.post('/auth/logout', passport.authenticate('jwt'), UserCtrl.Logout);

app.get('/tweets', passport.authenticate('jwt'), TweetsCtrl.index);
app.get('/tweets/favorite', passport.authenticate('jwt'), TweetsCtrl.showFavorite);
app.get('/tweets/:userId', passport.authenticate('jwt'), TweetsCtrl.userTweets);
app.get('/tweet/:id', passport.authenticate('jwt'), TweetsCtrl.show);
app.post(
  '/tweet',
  passport.authenticate('jwt'),
  uploader.array('images', 4),
  tweetCreateValidations,
  TweetsCtrl.create,
);
app.post('/tweet/like', passport.authenticate('jwt'), SocialCtrl.addLike);
app.post('/tweet/removelike', passport.authenticate('jwt'), SocialCtrl.deleteLike);
app.post('/tweet/pin', passport.authenticate('jwt'), TweetsCtrl.pinTweet);
app.get('/tweet/likes', passport.authenticate('jwt'), SocialCtrl.showLikes);

app.delete('/tweet/:id', passport.authenticate('jwt'), TweetsCtrl.delete);

app.post('/upload', uploader.single('avatar'), UploadFileCtrl.upload);

app.get('/themes', ThemesCtrl.index);
app.get('/search/:query', passport.authenticate('jwt'), TweetsCtrl.search);

app.listen(process.env.APP_PORT || '8888', () => {
  console.log('Server started ...');
});
