import { body } from 'express-validator';

export const tweetCreateValidations = [
  body('text', 'Введите Текст')
    .isString()
    .isLength({ min: 1, max: 280 })
    .withMessage('Допустимое кол-во символов от 1 до 280'),
];
