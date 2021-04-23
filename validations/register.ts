import { body } from 'express-validator';
import { generateMD5 } from '../utils/generateHash';

export const registrValidations = [
  body('email', 'Введите E-Mail')
    .isEmail()
    .withMessage('Неверный E-Mail')
    .isLength({ min: 10, max: 40 })
    .withMessage('Допустимое кол-во символов от 10 до 40'),
  body('fullname', 'Введите имя')
    .isLength({ min: 2, max: 40 })
    .withMessage('Допустимое кол-во символов от 2 до 40'),
  body('login', 'Укажите логин')
    .isLength({ min: 3, max: 40 })
    .withMessage('Допустимое кол-во символов от 3 до 40'),
  body('password', 'Укажите пароль')
    .isLength({ min: 6, max: 200 })
    .withMessage('Минимальная длина пароля 6 символов')
    .custom((value, { req }) => {
      if (value !== req.body.passwordConfirm) {
        throw new Error('Пароли не совпадают');
      }
      return true;
    }),
  body('birthDate', 'Укажите дату рождения').notEmpty().withMessage('Заполните поля даты рождения'),
];
