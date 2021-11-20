const User = require("../models/user");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

exports.getLogin = (req, res, next) => {
  const message = req.flash("error");
  const errorMsg = message.length > 0 ? message[0] : "";
  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    errorMsg: errorMsg,
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email }).then((user) => {
    if (!user) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/login");
    }
    bcrypt.compare(password, user.password).then((doMatch) => {
      if (doMatch) {
        req.session.isLoggedIn = true;
        req.session.user = user;
        return req.session.save(() => {
          res.redirect("/");
        });
      }
      req.flash("error", "Invalid email or password");
      res.redirect("/login");
    });
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  User.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        req.flash("error", "User with the same e-mail already exists");
        return res.redirect("/signup");
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] },
          });
          return user.save();
        })
        .then((result) => {
          res.redirect("/login");
          return transporter.sendMail({
            to: email,
            from: "gralux16@gmail.com",
            subject: "Sign up succeeded",
            html: "<h1> You successfully signed up!</h1>",
          });
        });
    })
    .catch((err) => console.log(err));
};

exports.getSignup = (req, res, next) => {
  const message = req.flash("error");
  const errorMsg = message.length > 0 ? message[0] : "";
  res.render("auth/signup", {
    pageTitle: "Signup",
    path: "/signup",
    errorMsg: errorMsg,
  });
};


exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  const message = req.flash("error");
  const errorMsg = message.length > 0 ? message[0] : "";
  res.render("auth/reset", {
    pageTitle: "Reset Password",
    path: "/reset",
    errorMsg: errorMsg,
  });
 
};

exports.getNewPassword = (req,res,next)=>{

  const token = req.params.token;
  User.findOne({resetToken: token, resetTokenExpiration: {$gt:Date.now()}})
  .then(user=>{
    if(!user)
    res.redirect('/')
     const message = req.flash("error");
  const errorMsg = message.length > 0 ? message[0] : "";
  res.render("auth/new-password", {
    pageTitle: "New Password",
    path: "/new-password",
    errorMsg: errorMsg,
    userId: user._id.toString(),
    passwordToken: token
  });
}).catch(err=>{
  console.log(err)
})
}

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({email: req.body.email})
        .then((user) => {
          if (!user) {
            req.flash("error", "Email not found");
            return res.redirect("/reset");
          }
          user.resetToken = token;
          user.resetTokenExpiration = Date.now() + 3600000;
          return user.save();
        })
        .then((result) => {
          res.redirect("/");
          return transporter.sendMail({
            to: req.body.email,
            from: "gralux16@gmail.com",
            subject: "Password reset",
            html: `
        <p>you requested a password reset</p>
        <p> Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset</p>`,
          });
        })
        .catch((err) =>{ console.log(err)})
    });
};

exports.postNewPassword = (req,res,next) =>{
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  console.log(req.body.password,req.body.userId,req.body.passwordToken)
  User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt:Date.now()},_id: userId}).then(user=>{
    resetUser = user;
    return bcrypt.hash(newPassword,12)
  }).then(hashedPassword=>{
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    return resetUser.save();
  }).then(result=>{
    res.redirect('/login');
  }).catch(err=>{console.log(err)})
}