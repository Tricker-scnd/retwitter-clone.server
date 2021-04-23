import mailer from '../core/mailer';
import SentMessageInfo from 'nodemailer/lib/sendmail-transport';

interface sendVerifyMailProps {
  toMail: string;
  confirmHash: string;
  callback?: (err: Error | null, info: SentMessageInfo) => void;
}

const defaultStyles = `
    <style>
        body{
            text-align: center;
            background: #202121;
            color: #fff;
            font-size: 18px;
            padding-top:20px;
        }
        .verify-link{
            color: #fff;
            font-size: 20px;
            display: block;
            text-decoration: none;
            background-color: #396763;
            padding: 12px;
            border-radius: 8px;
            width: 125px;
            text-align: center;
            margin: 15px auto;
            transition:0.15s all;
        }
        .verify-link:hover{
            background-color:#477d79;
        }
    </style>
`;

export const sendVerifyMail = (
  toMail: sendVerifyMailProps['toMail'],
  confirmHash: sendVerifyMailProps['confirmHash'],
  callback: sendVerifyMailProps['callback'],
) => {
  const localUrl = 'http://localhost:3000/auth/verify?hash=${confirmHash}';
  const OptionsSendVerifyMail = {
    from: 'noreply@retwitter.com',
    to: toMail,
    subject: 'Подтверждение почты',
    html: `${defaultStyles}Перейдите по ссылке ниже, для подтверждения почты <br> 
    <a class="verify-link" href="${process.env.BASE_URL}${
      process.env.APP_PORT && ':' + process.env.APP_PORT
    }/auth/verify/?hash=${confirmHash}">Подтвердить</a>`,
  };

  // href="${process.env.BASE_URL}${
  //   process.env.APP_PORT && ':' + process.env.APP_PORT
  // }/auth/verify?hash=${confirmHash}">Подтвердить</a>`,

  mailer.sendMail(
    OptionsSendVerifyMail,
    callback ||
      function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      },
  );
};
