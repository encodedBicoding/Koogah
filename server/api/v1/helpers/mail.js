/* eslint-disable prefer-const */
/* eslint-disable import/no-cycle */
/* eslint-disable no-plusplus */
/* eslint-disable one-var */
/* eslint-disable camelcase */
import { config } from 'dotenv';
import sgMail from '@sendgrid/mail';
import app from '../../../server';


config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default function sendMail(msg_obj) {
  return sgMail.send(msg_obj);
}

export function toSentenceCase(string) {
  let value = string[0].toUpperCase();
  for (let i = 1; i < string.length; ++i) {
    value += string[i].toLowerCase();
  }

  return value;
}

export const createVerificationMail = function createVerificationMail(user_email, user_obj, type) {
  let { first_name, last_name, verify_link } = user_obj;
  first_name = toSentenceCase.call(null, first_name);
  last_name = toSentenceCase.call(null, last_name);
  let html;


  if (type === 'dispatcher') {
    html = `
    <body>
      <div class='container'>
        <section class='email_header'>
          <div id='logo_header' style='background-color: #4ab; border-radius: 4px; padding: 15px; display: flex; flex-direction: row; align-items: center;'>
              <img src='https://www.koogah.com/img/app_logo.858abc44.svg' alt='${app.get('title')} logo' style='width: 50px; height: 50px; border-radius: 50%'/>
              <h1 style='color: #fff; letter-spacing: 2px; display: inline; margin-left: 15px; font-family: sans-serif;'>${app.get('title')}</h1>
          </div>
        </section>
        <section class='email_body'>
          <p style='font-size: 15px;'>Hi ${first_name} ${last_name},</p>
          <p>Thank you for joining our community, we hope you achieve your aim, which we believe is to earn while you dispatch goods and/or packages for customers within the Koogah community</p>
          <p>We are working on making this community as trustworthy as possible and we encourage you (our Dispatcher) to make this goal achievable,</p>
          <p>as we look forward to helping you earn on this platform</p>

          <p id='note' style='padding: 15px; background-color: #e6e600; border-radius: 4px'>
            <span id='note_head'>
              Note: 
            </span>
            <span id='note_body' style="color: black;">
                You would not be able to access your account until you are approved by our team
            </span> 
          </p>

          <h3>Steps to getting approved</h3>

          <ul>
              <li>First you need to verify your email</li>
              <li>We would take a few days (usually within 24 hours) to verify your identity</li>
              <li>Once verified, we would place a call to you.</li>
              <li>If we deem you certified, you will receive an email from us</li>
          </ul>
          <a href=${verify_link}>VERIFY EMAIL</a>
          <p>
            or click the link below to verify email.
            <p>
              ${verify_link}
            </p>
          </p>

        </section>
        <section class='email_footer' style='margin-top: 40px;'>
          <p style='font-size: 50%; text-align: center;'>
            This message was sent to ${first_name} ${last_name} (${user_email}) regarding your request to join ${app.get('title')} as a Dispatcher <br />
            Lagos, Nigeria. <br />
            support@koogah.com
          </p>
        </section>
     </div>
    </body>
  `;
  }

  if (type === 'customer') {
    html = `
      <body>
      <div class='container'>
        <section class='email_header'>
          <div id='logo_header' style='background-color: #4ab; border-radius: 4px; padding: 15px; display: flex; flex-direction: row; align-items: center;'>
              <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQX-_SdHhMrscUWUMBzvq4Lksozk5wrhSmrL1eUlPTyCaYp-ZJPJg&s' alt='${app.get('title')} logo' style='width: 50px; height: 50px; border-radius: 50%'/>
              <h1 style='color: #fff; letter-spacing: 2px; display: inline; margin-left: 15px; font-family: sans-serif;'>${app.get('title')}</h1>
          </div>
        </section>
        <section class='email_body'>
          <p style='font-size: 12px;'>Hi ${first_name} ${last_name},</p>
          <p>Thank you for joining our community. We make our dispatchers go through lots of procedures, and also taken lots of precautions</p>
          <p>to ensure you get the most out of this platform</p>
        </section>
        <a href=${verify_link}>VERIFY EMAIL</a>
      <p>
        or click the link below to proceed.
        <p>
          ${verify_link}
        </p>
      </p>

        </section>
        <section class='email_footer' style='margin-top: 40px;'>
          <p style='font-size: 50%; text-align: center;'>
            This message was sent to ${first_name} ${last_name} (${user_email}) regarding your request to join ${app.get('title')} as a Customer <br />
            Lagos, Nigeria. <br />
            support@koogah.com
          </p>
        </section>
     </div>
    </body>
    `;
  }

  const msg_obj = {
    to: user_email,
    from: 'noreply@koogah.com',
    subject: 'Verify your account',
    html,
  };
  return msg_obj;
};

export const createCourierApprovalMail = function createCourierApprovalMail(userObj) {
  const company_email = 'dispatcher_awaiting_approval@koogah.com'; //change to dispatcher_awaiting_approval@koogah.com
  let {
    first_name, last_name, approval_link, user_email, mobile_number, sex, bvn
  } = userObj;
  first_name = toSentenceCase.call(null, first_name);
  last_name = toSentenceCase.call(null, last_name);

  let html;

  html = `
      <body>
        <div class='container'>
          <section class='approval_header' style='display: flex; flex-direction: row; padding: 13px; border-radius: 4px' background-color: gold;>
            <img src='/' alt='${app.get('title')} logo' style='width: 50px; height: 50px; border-radius: 50%'>
            <h2>${app.get('title')}</h2>
          </section>
          <section class='approval_body'>
            <h2>A new user (Dispatcher) is awaiting approval</h2>
            <h2>User details</h2>
            <ul>
              <li>Name: ${first_name} ${last_name}</li>
              <li>Email: ${user_email}</li>
              <li>Phone: ${mobile_number}</li>
              <li>Sex: ${sex}</li>
              <li>BVN: ${bvn}</li>
            </ul>
            <div style='margin: 8%;'>
                <h3>The autogenerated approval link for this user is: </h3>
                <p>${approval_link}</p>
            </div>
          </section>
          <section class='approval_footer' style='margin-top: 10%'>
            <p style='font-size: 50%; text-align: center;'>
              This message was sent to the company ${app.get('title')} based on a user's ${first_name} ${last_name} (${user_email}) request to join the platform as a Dispatcher.
            </p>
          </section>
        </div>
      </body>  
  `;

  const msg_obj = {
    to: company_email,
    from: `${app.get('title')}_server_mail@server.com`,
    subject: 'New Awaiting Approval',
    html,
  };

  return msg_obj;
};

export const createApprovalMailToCourier = function sendApprovalMailToCourier(userObj) {
  let { first_name, user_email, last_name } = userObj;
  first_name = toSentenceCase.call(null, first_name);
  last_name = toSentenceCase.call(null, last_name);
  let html;

  html = `
      <table width='100%' cellspacing='0' cellpadding='0'>
        <tr>
          <td>
            <table>
              <tr>
                <td>
                  <div>
                      <h2>Congratulations ${first_name} ${last_name}</h2>
                      <p>You have been approved as a dispatcher on the Koogah platform. You may now login to your account to begin dispatching goods and/or packages for customers within the Koogah platform.</p>
                      <p>Always remember, the better ratings you get, the higher your chances of getting approval by customers to dispatch for them. We honestly hope you get the most from this platform. Welcome once more.</p>
                  </div>
                  <section style='margin-top: 10%'>
                    <p style='font-size: 50%; text-align: center;'>
                    This message was sent to ${first_name} ${last_name} (${user_email}) regarding your request to join ${app.get('title')} as a Dispatcher<br />

                    </p>
                   </section>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
  `

  let msgObj = {
    to: user_email,
    from: 'noreply@koogah.com',
    subject: 'Approval notice - Welcome to Koogah',
    html,
  }

  return msgObj
}

export const createPasswordResetEmail = function createPasswordResetEmail(userObj) {
  let { first_name, last_name, password_reset_link, account_type, user_email } = userObj;
  first_name = toSentenceCase.call(null, first_name);
  last_name = toSentenceCase.call(null, last_name);
  let html = `
    <table width='100%' cellspacing='0' cellpadding='0'>
      <tr>
        <td>
          <table>
            <tr>
              <td>
                <div>
                  <div>
                    <p>Hi ${first_name} ${last_name},</p>
                    <div>
                      <p>A password reset request was made from your ${account_type} account, kindly ignore this email if this wasn't requested by you.</p>
                      <div>
                        <p>
                          to reset your password, click on the link below:
                        </p>
                      </div>
                      <div>
                        <p>Click the link below to reset password.</p>
                        <p>${password_reset_link}<p>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  let msgObj = {
    to: user_email,
    from: 'noreply@koogah.com',
    subject: 'Password Reset',
    html,
  };
  return msgObj;
}