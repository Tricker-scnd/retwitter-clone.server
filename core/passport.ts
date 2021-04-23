import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { UserModel } from '../models/UserModel';
import { generateMD5 } from '../utils/generateHash';
import { UserModelInterface } from '../models/UserModel';
import { Strategy as JWTstrategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';

passport.use(
  new LocalStrategy(
    { usernameField: 'login', passwordField: 'password' },
    async (login, password, done): Promise<void> => {
      try {
        const user = await UserModel.findOne({
          $or: [{ email: login }, { phone: login }, { login }],
        })
          .select('+password')
          .exec();

        if (!user) {
          return done(null, false, { message: 'Введены некорректные данные' });
        }
        if (user.password === generateMD5(password + process.env.SECRET_KEY)) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Введены некорректные данные' });
        }
      } catch (e) {
        done(e, false, { message: 'Введены некорректные данные' });
      }
    },
  ),
);

const cookieExtractor = (req) => {
  let jwt = null;
  if (req && req.cookies) {
    jwt = req.cookies['auth_token'];
  }
  return jwt;
};

passport.use(
  new JWTstrategy(
    {
      secretOrKey: process.env.SECRET_KEY,
      jwtFromRequest: cookieExtractor,
    },
    async (token, done) => {
      try {
        const user: UserModelInterface = await UserModel.findById(token.user._id, {
          subscribers: 0,
          subscriptions: 0,
          likes: 0,
        }).exec();
        return done(null, user);
      } catch (error) {
        return;
      }
    },
  ),
);

passport.serializeUser((user: UserModelInterface, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  UserModel.findById(id, (err, user: UserModelInterface) => {
    done(err, user);
  });
});

export { passport };
