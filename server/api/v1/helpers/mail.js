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
        <div>
        <a href="https://koogah.com"><img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:10% !important; width:10%; height:auto !important;" width="58" alt="Koogah Logo" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/7e40b7ed2842548c/f01429ea-615c-4fbd-bbc8-9b72dd7140b3/500x500.png"></a>
        </div>
        <div style="font-family: inherit; text-align: inherit"><span style="font-size: 18px"><strong>Koogah Logistics</strong></span></div>
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
          <h2>Did you register through our website?</h2>
          <p>Please ensure you install the Koogah Dispatcher application on your phone before clicking the link below.</p>
          <br/>
          <h3>Please open this email with the phone you installed the Koogah Dispatcher app on</h2>

          <h3>Steps to getting approved</h3>
          <ul>
              <li>First you need to verify your email</li>
              <li>We would take a few days (usually within 24 hours) to verify your identity</li>
              <li>Once verified, we would place a call to you.</li>
              <li>If we deem you certified, you will receive an email from us</li>
          </ul>
          <p>
            Click the link below to verify email.
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
        <div>
        <a href="https://koogah.com"><img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:10% !important; width:10%; height:auto !important;" width="58" alt="Koogah Logo" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/7e40b7ed2842548c/f01429ea-615c-4fbd-bbc8-9b72dd7140b3/500x500.png"></a>
        </div>
        <div style="font-family: inherit; text-align: inherit"><span style="font-size: 18px"><strong>Koogah Logistics</strong></span></div>
        </section>
        <section class='email_body'>
          <p style='font-size: 12px;'>Hi ${first_name} ${last_name},</p>
          <p>Thank you for joining our community. We make our dispatchers go through lots of procedures, and also taken lots of precautions,</p>
          <span> to ensure you get the most out of this platform</span>
        </section>
        <h2>Did you register through our website?</h2>
        <p>Please ensure you install the Koogah Customer application on your phone before clicking the link below.</p>
        <br/>
        <h3>Please open this email with the phone you installed the Koogah Customer app on</h2>
        <p>
          Click the link below to proceed.
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
  const company_email = 'thekoogahbrand@gmail.com'; //change to dispatcher_awaiting_approval@koogah.com
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
    from: 'awaitings@koogah.com',
    subject: 'New Awaiting Approval',
    html,
  };

  return msg_obj;
};
export const createCustomerPersonalizedMail = function createCustomerPersonalizedMail(userObj) {
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
              <a href="https://koogah.com"><img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:10% !important; width:10%; height:auto !important;" width="58" alt="Koogah Logo" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/7e40b7ed2842548c/f01429ea-615c-4fbd-bbc8-9b72dd7140b3/500x500.png"></a>
              </div>
              <div style="font-family: inherit; text-align: inherit"><span style="font-size: 18px"><strong>Koogah Logistics</strong></span></div>
              <div>
                  <h2>Hello ${first_name}</h2>
                  <p>We are building a community to support the ever growing e-commerce market in Nigeria, and we believe we can achieve this by providing a better logistics/delivery experience for you.</p>
                  <p>I want to thank you for joining us on this journey, and also let you know that we are here to serve you.</p>
                  <br/>
                  <br/>
                  <h2><br>Our Dispatchers</br></h2>
                  <p>Our aim is to decentralize the delivery system, and provide you with the finest dispatchers to fulfil all of your delivery needs.</p>
                  <p>Our partnership with <b>VerifyMe Nigeria</br> and our <b>Rating system</br> ensures that we provide you with only the best people to fulfill your delivery needs.</p>
                  <b>Our dispatchers can be anyone with a bike, a car, a truck or other means of transportation, as long as they can deliver your package intact and on time.</b>
                  <br/>
                  <p>That's not all...</p>
                  <p>Koogah gives you total control over your deliveries. With this control, you can:</p>
                  <ul>
                    <li>Choose who delivers for you</li>
                    <li>Track your delivery in real-time from pickup to drop-off</li>
                    <li>Reach us on WhatsApp via +2348149332331 😊 if you have any complaints.</li>
                  </ul>
                  <br/>
                  <br/>
                  <p>From the depth of my heart, I want to welcome you to Koogah.</p>
                  <br/>
                  <br/>
                  <br/>
                  <p>
                    Dominic Olije Isioma, <br/>
                    CEO/Founder The Koogah Brand Limited.
                  </p>
              </div>
              <section style='margin-top: 10%'>
                <p style='font-size: 50%; text-align: center;'>
                This message was sent to ${first_name} ${last_name} (${user_email}) because you signed up as a Koogah customer<br />
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
  subject: 'Welcome to Koogah',
  html,
}

return msgObj
  
 }

export const createKoogahWelcomeMailToCourier = function sendWelcomMailToCourier(userObj) {
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
                  <a href="https://koogah.com"><img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:10% !important; width:10%; height:auto !important;" width="58" alt="Koogah Logo" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/7e40b7ed2842548c/f01429ea-615c-4fbd-bbc8-9b72dd7140b3/500x500.png"></a>
                  </div>
                  <div style="font-family: inherit; text-align: inherit"><span style="font-size: 18px"><strong>Koogah Logistics</strong></span></div>
                  <div>
                      <h2>Welcome To Koogah</h2>
                      <p>We are filled with so much joy in our hearts, as we foresee a good future working with you to make Koogah Logistics the perfect logistics/delivery service for all.</p>
                      <p>Earning with Koogah is easy, all you have to do is;</p>
                      <ul>
                        <li>Check the market-place often</li>
                        <li>Request to dispatch a package</li>
                        <li>Once approved, meet with the customer</li>
                        <li>Receive and deliver the package</li>
                        <li>Once package is delivered successfuly,funds are transfered to your wallet for you to withdraw.</li>
                      </ul>
                      <br/>
                      <br/>
                      <p>
                        Cheers,<br/>
                        The Koogah Logistics Team.
                      </p>
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

export const createApprovalMailToCourier = function sendApprovalMailToCourier(userObj) {
  let {
    first_name,
    user_email,
    last_name,
    approval_link,
  } = userObj;
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
                    <a href="https://koogah.com"><img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:10% !important; width:10%; height:auto !important;" width="58" alt="Koogah Logo" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/7e40b7ed2842548c/f01429ea-615c-4fbd-bbc8-9b72dd7140b3/500x500.png"></a>
                  </div>
                  <div style="font-family: inherit; text-align: inherit"><span style="font-size: 18px"><strong>Koogah Logistics</strong></span></div>
                  <div>
                    <p>Hello ${first_name}</p
                  </div>
                  <div style="font-family: inherit; text-align: left"><br></div>
                  <div style="font-family: inherit; text-align: inherit; margin-left: 0px"><span style="box-sizing: border-box; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-weight: bold; font-stretch: inherit; line-height: inherit; font-family: inherit; font-size: 15px; vertical-align: baseline; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-top-style: initial; border-right-style: initial; border-bottom-style: initial; border-left-style: initial; border-top-color: initial; border-right-color: initial; border-bottom-color: initial; border-left-color: initial; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; text-align: left; color: #000000; letter-spacing: normal; orphans: 2; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">Congratulations</span><span style="box-sizing: border-box; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-size: 15px; vertical-align: baseline; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-top-style: initial; border-right-style: initial; border-bottom-style: initial; border-left-style: initial; border-top-color: initial; border-right-color: initial; border-bottom-color: initial; border-left-color: initial; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; text-align: left; color: #000000; letter-spacing: normal; orphans: 2; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">!. We are pleased to let you know that we have approved you to become a Koogah Dispatcher.</span></div>
                  <div style="font-family: inherit; text-align: left"><br></div>
                  <div style="font-family: inherit; text-align: inherit; margin-left: 0px"><span style="box-sizing: border-box; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-size: 15px; vertical-align: baseline; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-top-style: initial; border-right-style: initial; border-bottom-style: initial; border-left-style: initial; border-top-color: initial; border-right-color: initial; border-bottom-color: initial; border-left-color: initial; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; text-align: left; color: #000000; letter-spacing: normal; orphans: 2; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">We are working hard to build a trustworthy community and our success relies on you.&nbsp;</span></div>
                  <div style="font-family: inherit; text-align: left"><br></div>
                  <div style="font-family: inherit; text-align: inherit; margin-left: 0px"><br>
                  </div>
                  <div style="font-family: inherit; text-align: left"><br></div>
                  <div style="font-family: inherit; text-align: inherit; margin-left: 0px"><span style="box-sizing: border-box; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-weight: bold; font-stretch: inherit; line-height: inherit; font-family: inherit; font-size: 18px; vertical-align: baseline; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-top-style: initial; border-right-style: initial; border-bottom-style: initial; border-left-style: initial; border-top-color: initial; border-right-color: initial; border-bottom-color: initial; border-left-color: initial; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; text-align: left; color: #000000; letter-spacing: normal; orphans: 2; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">Tips to note.</span></div>
                  <div style="font-family: inherit; text-align: left"><br></div>
                  <div style="font-family: inherit; text-align: inherit; margin-left: 0px"><span style="box-sizing: border-box; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-size: 15px; vertical-align: baseline; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-top-style: initial; border-right-style: initial; border-bottom-style: initial; border-left-style: initial; border-top-color: initial; border-right-color: initial; border-bottom-color: initial; border-left-color: initial; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; text-align: left; color: #000000; letter-spacing: normal; orphans: 2; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">1. Koogah Dispatcher Application uses a rating system, this rating system is used to measure your conduct, how you treat Koogah Customers and how you handle their deliveries.</span></div>
                  <div style="font-family: inherit; text-align: left"><br></div>
                  <div style="font-family: inherit; text-align: inherit; margin-left: 0px"><span style="box-sizing: border-box; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-size: 15px; vertical-align: baseline; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-top-style: initial; border-right-style: initial; border-bottom-style: initial; border-left-style: initial; border-top-color: initial; border-right-color: initial; border-bottom-color: initial; border-left-color: initial; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; text-align: left; color: #000000; letter-spacing: normal; orphans: 2; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">2. Poor ratings may prevent Koogah Customers from approving you to deliver for them.</span></div>
                  <div style="font-family: inherit; text-align: left"><br></div>
                  <div style="font-family: inherit; text-align: inherit; margin-left: 0px"><span style="box-sizing: border-box; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-size: 15px; vertical-align: baseline; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-top-style: initial; border-right-style: initial; border-bottom-style: initial; border-left-style: initial; border-top-color: initial; border-right-color: initial; border-bottom-color: initial; border-left-color: initial; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; text-align: left; color: #000000; letter-spacing: normal; orphans: 2; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">3. While delivering a package for a Koogah Customer, ensure your internet connection is on, and you do not close the Koogah Dispatcher application.</span></div>
                  <div style="font-family: inherit; text-align: left"><br></div>
                  <div style="font-family: inherit; text-align: inherit; margin-left: 0px"><span style="box-sizing: border-box; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-size: 15px; vertical-align: baseline; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-top-style: initial; border-right-style: initial; border-bottom-style: initial; border-left-style: initial; border-top-color: initial; border-right-color: initial; border-bottom-color: initial; border-left-color: initial; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; text-align: left; color: #000000; letter-spacing: normal; orphans: 2; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">4. Before you click the link below, ensure you have the Koogah Dispatcher application installed on your mobile phone.</span></div>
                  <div style="font-family: inherit; text-align: left"><br></div>
                  <div style="font-family: inherit; text-align: inherit; margin-left: 0px"><span style="box-sizing: border-box; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-size: 15px; vertical-align: baseline; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-top-style: initial; border-right-style: initial; border-bottom-style: initial; border-left-style: initial; border-top-color: initial; border-right-color: initial; border-bottom-color: initial; border-left-color: initial; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; text-align: left; color: #000000; letter-spacing: normal; orphans: 2; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">5. On clicking the link below, it should open up a page for you to set your bank account details and password.</span></div>
                  <div style="font-family: inherit; text-align: left"><br></div>
                  <div style="font-family: inherit; text-align: inherit; margin-left: 0px"><span style="box-sizing: border-box; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-size: 15px; vertical-align: baseline; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-top-style: initial; border-right-style: initial; border-bottom-style: initial; border-left-style: initial; border-top-color: initial; border-right-color: initial; border-bottom-color: initial; border-left-color: initial; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; text-align: left; color: #000000; letter-spacing: normal; orphans: 2; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">6. If Number 5 doesn't happen as written above, come back here and re-click the link without closing the Koogah Dispatcher app.</span></div>
                  <div style="font-family: inherit; text-align: left"><br></div>

                  <div style="font-family: inherit; text-align: center"><span style="color: #000000; font-family: arial, helvetica, sans-serif; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial; float: none; display: inline">${approval_link}</span></div>
                  <br/>
                  <br/>
                  <div style="font-family: inherit; text-align: inherit"><span style="box-sizing: border-box; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-size: 15px; vertical-align: baseline; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-top-style: initial; border-right-style: initial; border-bottom-style: initial; border-left-style: initial; border-top-color: initial; border-right-color: initial; border-bottom-color: initial; border-left-color: initial; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; color: #000000; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">Best Regards.</span></div>
                  <div style="font-family: inherit; text-align: inherit; margin-left: 0px"><span style="box-sizing: border-box; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-variant-numeric: inherit; font-variant-east-asian: inherit; font-weight: inherit; font-stretch: inherit; line-height: inherit; font-family: inherit; font-size: 15px; vertical-align: baseline; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-top-style: initial; border-right-style: initial; border-bottom-style: initial; border-left-style: initial; border-top-color: initial; border-right-color: initial; border-bottom-color: initial; border-left-color: initial; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; color: #000000; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: pre-wrap; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial">The Koogah Logistics Team.</span></div>
                  
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
    subject: 'Approved to deliver on Koogah',
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
                <a href="https://koogah.com"><img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:10% !important; width:10%; height:auto !important;" width="58" alt="Koogah Logo" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/7e40b7ed2842548c/f01429ea-615c-4fbd-bbc8-9b72dd7140b3/500x500.png"></a>
                </div>
                <div style="font-family: inherit; text-align: inherit"><span style="font-size: 18px"><strong>Koogah Logistics</strong></span></div>
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

export const createDeliveryReceipt = function createDeliveryReceipt(obj) {
  const { customer, package, dispatcher } = obj;
  let html = ``;
  let msgObj = {
    to: customer.email,
    from: 'receipts@koogah.com',
    subject: 'Delivery Receipt',
    html,
  };
 }