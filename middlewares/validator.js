const Joi = require('joi');

exports.signupSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ['com', 'net'] },
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.pattern.base': `"password" must contain at least one lowercase letter, one uppercase letter, one digit, and one special character`,
    }),
});
exports.signinSchema = Joi.object({
    email: Joi.string()
      .min(6)
      .max(60)
      .required()
      .email({
        tlds: { allow: ['com', 'net'] },
      }),
  
    password: Joi.string()
      .required()
      .messages({
        'string.pattern.base': `"password" must contain at least one lowercase letter, one uppercase letter, one digit, and one special character`,
      }),
  });
  exports.acceptCodeSchema = Joi.object({
    email: Joi.string()
      .min(6)
      .max(60)
      .required()
      .email({
        tlds: { allow: ['com', 'net'] },
      }),
  
    verificationCode: Joi.number()
      .required().messages({
        'string.pattern.base': `"verificationCode" must contain at least one lowercase letter, one uppercase letter, one digit, and one special character`,
      })
  });
 exports.changePasswordSchema = Joi.object({
  newPassword: Joi.string()
    .required()
    .messages({
      'string.pattern.base': `"password" must contain at least one lowercase letter, one uppercase letter, one digit, and one special character`,
    }),
    oldPassword: Joi.string()
    .required()
    .messages({
      'string.pattern.base': `"password" must contain at least one lowercase letter, one uppercase letter, one digit, and one special character`,
    }),
 })
 exports.acceptFPCodeSchema = Joi.object({
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ['com', 'net'] },
    }),
  
    verificationCode: Joi.number()
    .required().messages({
      'string.pattern.base': `"verificationCode" must contain at least one lowercase letter, one uppercase letter, one digit, and one special character`,
    }),
    newPassword: Joi.string()
    .required()
    .messages({
      'string.pattern.base': `"password" must contain at least one lowercase letter, one uppercase letter, one digit, and one special character`,
    }),
 })
 exports.createPostSchema = Joi.object({
  title: Joi.string()
    .required()
    .messages({
      'string.pattern.base': `"title" must contain at least one lowercase letter, one uppercase letter, one digit, and one special character`,
    }),
    description: Joi.string()
    .required()
    .messages({
      'string.pattern.base': `"description" must contain at least one lowercase letter, one uppercase letter, one digit, and one special character`,
    }),
    userId : Joi.string()
    .required()
    .messages({
      'string.pattern.base': `"userId" must contain at least one lowercase letter, one uppercase letter, one digit, and one special character`,
    }),
 })


