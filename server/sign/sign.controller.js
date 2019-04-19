'use strict';

const _ = require('lodash');
const u = require('../utils');
const mailer = require('nodemailer');
const User = require('../api/user/user.model');
const Auth = require('../auth/auth.service');
const config = require('../config/environment');
const URL_BASE = 'https://virtualservices.herokuapp.com/sign/';
const SUBSCRIPTION_SUBJECT = 'Virtual-Service subscription';
const SUBSCRIPTION_HTML = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
 <head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>Virtual Service Subscription</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    html,body{font-family:"Helvetica Neue Light","HelveticaNeue-Light","Helvetica Neue",Calibri,Helvetica,Arial;background-color:white;color:#111;overflow-x:hidden;}
    body{padding:10px;}
    th>div{font-size:24px;}
    th>span{opacity:.4;margin-top:10px;font-weight:100;}
    td{text-align:center}
    .header,.footer{background-color:#263238;color:#ccc;padding:20px;}
    .header g{fill:#ccc}
    .header>svg{zoom:2;}
    .vs-text{font-size:1.4em;}
    .vs-text-first{padding:50px 0 0;}
    .vs-text-last{padding:0 0 50px;}
    .vs-link{padding:30px 0 50px}
    .vs-link>a{color:#fff;text-decoration:none;padding:6px 16px 10px;border-radius:20px;background-color:deeppink;}
  </style>
</head>
<body>
 <table border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
   <th class="header">
    <svg height="32px" id="Layer_1" style="enable-background:new 0 0 32 32;" version="1.1" viewBox="0 0 32 32" width="32px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g transform="translate(576 48)"><path d="M-548.071-34.945C-548.022-35.293-548-35.646-548-36c0-4.41-3.588-8-8-8c-2.559,0-4.907,1.208-6.396,3.189   C-562.919-40.938-563.455-41-564-41c-3.858,0-7,3.141-7,7c0,0.098,0.002,0.191,0.007,0.288C-573.887-32.854-576-30.168-576-27   c0,3.857,3.142,7,7,7h17c4.412,0,8-3.588,8-8C-544-30.917-545.604-33.551-548.071-34.945z M-552-22h-17c-2.762,0-5-2.238-5-5   c0-2.763,2.238-5,5-5c0.152,0,0.298,0.031,0.445,0.045C-568.836-32.58-569-33.27-569-34c0-2.763,2.238-5,5-5   c0.902,0,1.738,0.258,2.47,0.675C-560.625-40.484-558.489-42-556-42c3.313,0,6,2.686,6,6c0,0.788-0.161,1.538-0.438,2.229   c2.555,0.69,4.438,3,4.438,5.771C-546-24.688-548.687-22-552-22z"/><path d="M-561.414-30l-2.827-2.829L-567.069-30l5.655,5.656l8.484-8.485l-2.828-2.827L-561.414-30z"/></g></svg>
    <div>Virtual Service</div>
    <span>build a develop web service REST in a few moments</span>
   </th>
  </tr>
  <tr><td class="vs-text vs-text-first">Hi <b>[USER]</b>!</td></tr>
  <tr><td class="vs-text">You have requested access to the <b>Virtual-Service</b> application.</td></tr>
  <tr><td class="vs-text vs-text-last">This application can help you create your own virtual servers for development.</td></tr>
  <tr><td>follow the white rabbit...</td></tr>
  <tr><td class="vs-link"><a href="[URL]">log in to Virtual-Service</a></td></tr>
  <tr>
    <th class="footer">
      <span>by Leo ©2019 </span>
    </th>
  </tr>
 </table>
</body>
</html>`

const _transporter = mailer.createTransport({
  service: config.mailer.service||'gmail',
  auth: {
    user: config.mailer.sender,
    pass: Buffer.from(config.mailer.password, 'base64').toString()
  }
});

exports.sign = (req, res) => {
  const lock = req.params.id;
  User.findOne({
    lock: lock
  }, (err, user) => { 
    if (err) return u.error(res, err);
    if (!user) return u.notfound(res);
    user.lock = null;
    user.save((err, user) => {
      if (err) return u.error(res, err);
      const token = Auth.signToken(user._id, user.role);
    
      // TEST #1: token ok cookie
      res.cookie('sign-token', token, { maxAge: 120000, httpOnly: true });
      res.redirect('/?confirmation');

      // TEST #2: token on url
      // res.redirect('/?' + token);
      
      console.log('SIGN USER', user);
    });
  });
};

exports.sendMail = (user, cb) => {
  // console.log('procedura sendMail', user);  // <<<<<<<<<<< DEBUG
  if (!user) return cb('Undefined user!');
  if (!user.lock) return cb('No lock for user!');
  let html = SUBSCRIPTION_HTML;
  html = u.replaceBookmark(html, 'USER', user.name);
  html = u.replaceBookmark(html, 'URL', URL_BASE + user.lock);
  // console.log('sendMail mail body', html);  // <<<<<<<<<<< DEBUG
  _transporter.sendMail({
    from: config.mailer.sender,
    to: user.email,
    subject: SUBSCRIPTION_SUBJECT,
    html: html
  }, (err, resp) => {
    if (err) console.error('Transporte error', err);
  });
}
