const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passwordValidator = require('password-validator');
const cryptojs = require('crypto-js');

const User = require('../models/user');


exports.signup = (req, res, next) => {
    var schema = new passwordValidator();
    schema.is().min(8);
    schema.has().digits(1);
    schema.has().uppercase(2);
    if(schema.validate(req.body.password)){
      bcrypt.hash(req.body.password, 10)
        .then(hash => {
          const cipherText = cryptojs.HmacSHA512(req.body.email, process.env.EMAIL_KEY).toString();
          const user = new User({
            email: cipherText,
            password: hash
          });
          user.save()
            .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
            .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
    }else{
      res.status(500).json({ error : 'Le mot de passe doit comporter au moins 8 caractères, 1 nombre et 2 majuscules' })
    };
};


exports.login = (req, res, next) => {
    const cipherText = cryptojs.HmacSHA512(req.body.email, process.env.EMAIL_KEY).toString();
    User.findOne({ email: cipherText })
      .then(user => {
        if (!user) {
          return res.status(401).json({ error: 'Utilisateur non trouvé !' });
        }
        bcrypt.compare(req.body.password, user.password)
          .then(valid => {
            if (!valid) {
              return res.status(401).json({ error: 'Mot de passe incorrect !' });
            }
            res.status(200).json({
              userId: user._id,
              token: jwt.sign(
                { userId: user._id },
                process.env.DB_TOKEN,
                { expiresIn: '24h' }
              )
            });
          })
          .catch(error => res.status(500).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
};