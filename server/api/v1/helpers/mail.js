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

export function createCompanyDispatcherVerificationMail(user_email, company_obj, verification_code) {
  const { business_name } = company_obj;
  let html = `
        <body>
        <div class='container'>
          <section class='email_header'>
          <div>
          <a href="https://koogah.com"><img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:10% !important; width:10%; height:auto !important;" width="58" alt="Koogah Logo" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/7e40b7ed2842548c/f01429ea-615c-4fbd-bbc8-9b72dd7140b3/500x500.png"></a>
          </div>
          <div style="font-family: inherit; text-align: inherit"><span style="font-size: 18px"><strong>Koogah Logistics</strong></span></div>
          </section>
          <section class='email_body'>
            <h2>Hello</h2>
            <p>We have received a request to add you as a dispatcher for a Company (${business_name})</p>
            <p>Please ignore this email, if you have no affiliate with the afforementioned company.</p>
            <br/>
            <p>If you are in support of this action, kindly share the code below with the operator registering your account</p>
            <br/>
            <h1>${verification_code}</h1>
            </section>
          <section class='email_footer' style='margin-top: 40px;'>
            <p style='font-size: 50%; text-align: center;'>
              This message was sent to ${user_email} regarding your request to join ${app.get('title')} as a Dispatcher by ${business_name}<br />
              Lagos, Nigeria. <br />
              support@koogah.com
            </p>
          </section>
      </div>
      </body>
  `;
  const msg_obj = {
    to: user_email,
    from: 'noreply@koogah.com',
    subject: 'Verify your account',
    html,
  };
  return msg_obj;
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

  if (type === 'company') {
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
        <p>Thank you for joining our community, we hope you achieve your aim, which we believe is to earn while your dispatchers dispatch goods and/or packages for customers within the Koogah community</p>
        <p>We are working on making this community as trustworthy as possible and we encourage you to make this goal achievable,</p>
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
            <li>Fill up our emergency contact form</li>
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
          This message was sent to ${first_name} ${last_name} (${user_email}) regarding your request to join ${app.get('title')} as a Company <br />
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

export const createEmergencyContactMail = function createEmergencyContactMail(user_email, userObj, user_type) {
  let { first_name, last_name } = userObj;
  first_name = toSentenceCase.call(null, first_name);
  last_name = toSentenceCase.call(null, last_name);
  let html;
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
    <p>As part of our verification process, we need you to fill up the emegency contact details below</p>

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
    <p>
      Click the link below to complete your registration process.
      <p>
        <a href="https://docs.google.com/forms/d/179NJo0DmnjH30XILHVSy0UDdT-OMvFQSzJp4uvByOOs/edit?ts=60ed40d2">COMPLETE REGISTRATION</a>
      </p>
    </p>

  </section>
  <section class='email_footer' style='margin-top: 40px;'>
    <p style='font-size: 50%; text-align: center;'>
      This message was sent to ${first_name} ${last_name} (${user_email}) regarding your request to join ${app.get('title')} as a ${user_type}<br />
      Lagos, Nigeria. <br />
      support@koogah.com
    </p>
  </section>
</div>
  </body>
  `;
  const msg_obj = {
    to: user_email,
    from: 'thekoogahbrand@gmail.com',
    subject: 'Complete your registration - Emergency Contact',
    html,
  };
  return msg_obj;
}


export const createCourierApprovalMail = function createCourierApprovalMail(userObj) {
  const company_email = 'thekoogahbrand@gmail.com'; //change to dispatcher_awaiting_approval@koogah.com
  let {
    first_name, last_name, approval_link, user_email, mobile_number, sex, identification_number
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
              <li>NIN: ${identification_number}</li>
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
export const createCompanyApprovalMail = function createCompanyApprovalMail(userObj) {
  const company_email = 'thekoogahbrand@gmail.com';
  let {
    first_name,
    last_name,
    approval_link,
    user_email,
    phone,
    nin,
    business_name,
    business_country,
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
            <h2>A new user (Company) is awaiting approval</h2>
            <h2>User details</h2>
            <ul>
              <li>Name: ${first_name} ${last_name}</li>
              <li>Business Name: ${business_name}</li>
              <li>Business Country: ${business_country}</li>
              <li>Email: ${user_email}</li>
              <li>Phone: ${phone}</li>
              <li>National Identity Number: ${nin}</li>
            </ul>
            <div style='margin: 8%;'>
                <h3>The autogenerated approval link for this user is: </h3>
                <p>${approval_link}</p>
            </div>
          </section>
          <section class='approval_footer' style='margin-top: 10%'>
            <p style='font-size: 50%; text-align: center;'>
              This message was sent to the company ${app.get('title')} based on a user's ${first_name} ${last_name} (${user_email}) request to join the platform as a Company.
            </p>
          </section>
        </div>
      </body>  
  `;

  const msg_obj = {
    to: company_email,
    from: 'awaitings@koogah.com',
    subject: 'New Company Awaiting Approval',
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

export const createKoogahWelcomeMailToCourier = function createKoogahWelcomeMailToCourier(userObj) {
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

export const createKoogahWelcomeMailToCompany = function sendWelcomMailToCourier(userObj) {
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
                      <p>We are filled with so much joy in our hearts, as we foresee a good future working with you to provide better delivery service for customers within the Koogah network</p>
                      <p>Earning with Koogah is easy, all you have to do is;</p>
                      <ul>
                        <li>Log in to your account</li>
                        <li>Add your dispatchers</li>
                        <li>Your dispatchers deliver packages for customers within the Koogah network</li>
                        <li>Track your dispatchers in real-time</li>
                        <li>Get notified of all your dispatcher activities via email</li>
                        <li>After a successful delivery, payment are stored on the dispatcher wallet, which you can withdraw into your bank account instantly</li>
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
                    This message was sent to ${first_name} ${last_name} (${user_email}) regarding your request to join ${app.get('title')} as a Company<br />
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
  const { customer, _package, dispatcher } = obj;
  const dispatcher_first_name = toSentenceCase.call(null, dispatcher.first_name);
  const dispatcher_last_name = toSentenceCase.call(null, dispatcher.last_name);
  let html = `
  <body>
  <center class="wrapper" data-link-color="#1188E6" data-body-style="font-size:12px; font-family:lucida sans unicode,lucida grande,sans-serif; color:#000000; background-color:#FFFFFF;">
    <div class="webkit">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#FFFFFF">
        <tr>
          <td valign="top" bgcolor="#FFFFFF" width="100%">
            <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="100%">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <!--[if mso]>
<center>
<table><tr><td width="600">
<![endif]-->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;" align="center">
                                  <tr>
                                    <td role="modules-container" style="padding:0px 0px 0px 0px; color:#000000; text-align:left;" bgcolor="#FFFFFF" width="100%" align="left"><table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
<tr>
  <td role="module-content">
    <p></p>
  </td>
</tr>
</table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:10px 10px 10px 10px;" bgcolor="#000000" data-distribution="1,1">
<tbody>
  <tr role="module-content">
    <td height="100%" valign="top"><table width="285" style="width:285px; border-spacing:0; border-collapse:collapse; margin:0px 5px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="221f3106-6c36-45e7-851f-d31e9e73c33c">
<tbody>
  <tr>
    <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="left">
      <img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:45% !important; width:45%; height:auto !important;" width="128" alt="" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/7e40b7ed2842548c/9fcece24-6a87-48d0-b53e-bf8d33a9d3a0/250x90.png">
    </td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table><table width="285" style="width:285px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 5px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="6f27ff83-d313-485e-9c07-a8a5f8586a3e" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right"><span style="color: #ffffff">${new Date().toLocaleDateString()}</span></div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table></td>
  </tr>
</tbody>
</table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:10px 10px 10px 10px;" bgcolor="#FFFFFF" data-distribution="1">
<tbody>
  <tr role="module-content">
    <td height="100%" valign="top"><table width="560" style="width:560px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="66b9bb8a-c1da-4a30-bae3-ad601f6dd2e4" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="font-size: 30px"><strong>${_package.delivery_price}</strong></span></div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table></td>
  </tr>
</tbody>
</table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 10px 0px 10px;" bgcolor="#FFFFFF" data-distribution="1,1">
<tbody>
  <tr role="module-content">
    <td height="100%" valign="top"><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="9f2b7326-10dd-4537-9888-83f7eebc756e" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit">Package ID</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="770b8590-c9f8-4dfb-ae1e-e5b431fc8c88" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${_package.package_id}</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table></td>
  </tr>
</tbody>
</table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 10px 0px 10px;" bgcolor="#FFFFFF" data-distribution="1,1">
<tbody>
  <tr role="module-content">
    <td height="100%" valign="top"><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="9f2b7326-10dd-4537-9888-83f7eebc756e.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit">Base fee</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="770b8590-c9f8-4dfb-ae1e-e5b431fc8c88.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${process.env.KOOGAH_INTRA_STATE_DISPATCH_BASE_FEE}</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table></td>
  </tr>
</tbody>
</table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 10px 0px 10px;" bgcolor="#FFFFFF" data-distribution="1,1">
<tbody>
  <tr role="module-content">
    <td height="100%" valign="top"><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="9f2b7326-10dd-4537-9888-83f7eebc756e.1.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit">Distance</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="770b8590-c9f8-4dfb-ae1e-e5b431fc8c88.1.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${_package.distance}km</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table></td>
  </tr>
</tbody>
</table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 10px 0px 10px;" bgcolor="#FFFFFF" data-distribution="1,1">
<tbody>
  <tr role="module-content">
    <td height="100%" valign="top"><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="9f2b7326-10dd-4537-9888-83f7eebc756e.1.1.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit">Weight</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="770b8590-c9f8-4dfb-ae1e-e5b431fc8c88.1.1.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${_package.weight}kg</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table></td>
  </tr>
</tbody>
</table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 10px 0px 10px;" bgcolor="#FFFFFF" data-distribution="1,1">
<tbody>
  <tr role="module-content">
    <td height="100%" valign="top"><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="9f2b7326-10dd-4537-9888-83f7eebc756e.1.1.1.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit">Value</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="770b8590-c9f8-4dfb-ae1e-e5b431fc8c88.1.1.1.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${_package.value}</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table></td>
  </tr>
</tbody>
</table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 10px 10px 10px;" bgcolor="#FFFFFF" data-distribution="1,1">
<tbody>
  <tr role="module-content">
    <td height="100%" valign="top"><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="9f2b7326-10dd-4537-9888-83f7eebc756e.1.1.1.1.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><strong>Total</strong></div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="770b8590-c9f8-4dfb-ae1e-e5b431fc8c88.1.1.1.1.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${_package.delivery_price}</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table></td>
  </tr>
</tbody>
</table><table class="module" role="module" data-type="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="d4e92564-c789-4be7-bad8-bb38e0bdd58d">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px;" role="module-content" height="100%" valign="top" bgcolor="">
      <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" height="1px" style="line-height:1px; font-size:1px;">
        <tbody>
          <tr>
            <td style="padding:0px 0px 1px 0px;" bgcolor="#000000"></td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
</tbody>
</table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 10px 10px 10px;" bgcolor="#FFFFFF" data-distribution="1,1">
<tbody>
  <tr role="module-content">
    <td height="100%" valign="top"><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="9f2b7326-10dd-4537-9888-83f7eebc756e.1.1.1.1.1.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit">Pick up address</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="770b8590-c9f8-4dfb-ae1e-e5b431fc8c88.1.1.1.1.1.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${_package.pickup_address}</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table></td>
  </tr>
</tbody>
</table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 10px 10px 10px;" bgcolor="#FFFFFF" data-distribution="1,1">
<tbody>
  <tr role="module-content">
    <td height="100%" valign="top"><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="9f2b7326-10dd-4537-9888-83f7eebc756e.1.1.1.1.1.1.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit">Drop off address</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table><table width="280" style="width:280px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="770b8590-c9f8-4dfb-ae1e-e5b431fc8c88.1.1.1.1.1.1.1" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:0px 0px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: right">${_package.dropoff_address}</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table></td>
  </tr>
</tbody>
</table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 10px 0px 10px;" bgcolor="#f4f6f3" data-distribution="1,1">
<tbody>
  <tr role="module-content">
    <td height="100%" valign="top"><table width="290" style="width:290px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="9728df98-d9e9-4553-ab77-5c86ad297b2e">
<tbody>
  <tr>
    <td style="font-size:6px; line-height:10px; padding:10px 0px 10px 0px;" valign="top" align="center">
      <img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:15% !important; width:15%; height:auto !important;" width="44" alt="" data-proportionally-constrained="true" data-responsive="true" src="${dispatcher.profile_image}">
    </td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table><table width="290" style="width:290px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-1">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="16835c53-d973-478a-b70d-77f7ccc041ee" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: center">${dispatcher_first_name} ${dispatcher_last_name} was your dispatcher</div><div></div></div></td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table></td>
  </tr>
</tbody>
</table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 0px 0px 0px;" bgcolor="#f29b38" data-distribution="1">
<tbody>
  <tr role="module-content">
    <td height="100%" valign="top"><table width="580" style="width:580px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
  <tbody>
    <tr>
      <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="475eb0af-e27e-4c21-b9fc-ffc957e7e8d9" data-mc-module-version="2019-10-22">
<tbody>
  <tr>
    <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: center"><span style="font-size: 11px"><strong>REFER A FRIEND</strong></span></div><div></div></div></td>
  </tr>
</tbody>
</table><table class="module" role="module" data-type="social" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7f0f6d0f-67ac-4005-9f66-ad77e400b592">
<tbody>
  <tr>
    <td valign="top" style="padding:0px 0px 0px 0px; font-size:6px; line-height:10px;" align="center">
      <table align="center" style="-webkit-margin-start:auto;-webkit-margin-end:auto;">
        <tbody><tr align="center"><td style="padding: 0px 5px;" class="social-icon-column">
  <a role="social-icon-link" href="https://web.facebook.com/thekoogahbrand" target="_blank" alt="Facebook" title="Facebook" style="display:inline-block; background-color:#3B579D; height:30px; width:30px; border-radius:100px; -webkit-border-radius:100px; -moz-border-radius:100px;">
    <img role="social-icon" alt="Facebook" title="Facebook" src="https://mc.sendgrid.com/assets/social/white/facebook.png" style="height:30px; width:30px;" height="30" width="30">
  </a>
</td></tr><tr align="center"><td style="padding: 0px 5px;" class="social-icon-column">
  <a role="social-icon-link" href="https://www.twitter.com/thekoogahbrand" target="_blank" alt="Twitter" title="Twitter" style="display:inline-block; background-color:#7AC4F7; height:30px; width:30px; border-radius:100px; -webkit-border-radius:100px; -moz-border-radius:100px;">
    <img role="social-icon" alt="Twitter" title="Twitter" src="https://mc.sendgrid.com/assets/social/white/twitter.png" style="height:30px; width:30px;" height="30" width="30">
  </a>
</td></tr><tr align="center"><td style="padding: 0px 5px;" class="social-icon-column">
  <a role="social-icon-link" href="https://www.instagram.com/thekoogahbrand" target="_blank" alt="Instagram" title="Instagram" style="display:inline-block; background-color:#7F4B30; height:30px; width:30px; border-radius:100px; -webkit-border-radius:100px; -moz-border-radius:100px;">
    <img role="social-icon" alt="Instagram" title="Instagram" src="https://mc.sendgrid.com/assets/social/white/instagram.png" style="height:30px; width:30px;" height="30" width="30">
  </a>
</td></tr>
<tr align="center"><td style="padding: 0px 5px;" class="social-icon-column">
  <a role="social-icon-link" href="https://www.koogah.com.ng" target="_blank" alt="LinkedIn" title="LinkedIn" style="display:inline-block; background-color:#0077B5; height:30px; width:30px; border-radius:100px; -webkit-border-radius:100px; -moz-border-radius:100px;">
    <img role="social-icon" alt="LinkedIn" title="LinkedIn" src="https://mc.sendgrid.com/assets/social/white/linkedin.png" style="height:30px; width:30px;" height="30" width="30">
  </a>
</td></tr></tbody>
      </table>
    </td>
  </tr>
</tbody>
</table></td>
    </tr>
  </tbody>
</table></td>
  </tr>
</tbody>
</table><div data-role="module-unsubscribe" class="module" role="module" data-type="unsubscribe" style="color:#444444; font-size:12px; line-height:20px; padding:16px 16px 16px 16px; text-align:Center;" data-muid="4e838cf3-9892-4a6d-94d6-170e474d21e5"><div class="Unsubscribe--addressLine"><p class="Unsubscribe--senderName" style="font-size:12px; line-height:20px;">{{Sender_Name}}</p><p style="font-size:12px; line-height:20px;"><span class="Unsubscribe--senderAddress">{{Sender_Address}}</span>, <span class="Unsubscribe--senderCity">{{Sender_City}}</span>, <span class="Unsubscribe--senderState">{{Sender_State}}</span> <span class="Unsubscribe--senderZip">{{Sender_Zip}}</span></p></div><p style="font-size:12px; line-height:20px;"><a class="Unsubscribe--unsubscribeLink" href="{{{unsubscribe}}}" target="_blank" style="">Unsubscribe</a> - <a href="{{{unsubscribe_preferences}}}" target="_blank" class="Unsubscribe--unsubscribePreferences" style="">Unsubscribe Preferences</a></p></div></td>
                                  </tr>
                                </table>
                                <!--[if mso]>
                              </td>
                            </tr>
                          </table>
                        </center>
                        <![endif]-->
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </center>
</body>
  `;
  let msgObj = {
    to: customer.email,
    from: 'receipts@koogah.com',
    subject: 'Koogah - Delivery Receipt',
    html,
  };
  return msgObj;
 }

export const createCompanyDispatcherApproveOrDecline = function createCompanyDispatcherApproveOrDecline(obj) {
  const {
    event,
    dispatcher,
    _package,
    company } = obj;
  const dispatcher_first_name = toSentenceCase.call(null, dispatcher.first_name);
  const dispatcher_last_name = toSentenceCase.call(null, dispatcher.last_name);
  let html;
  if (event === 'PICKUP') {
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
                  <h2>Dispatcher Pickup Delivery Event.</h2>
                  <p>Your dispatcher ${dispatcher_first_name} ${dispatcher_last_name} has been approved to pick up a delivery</p>
                  <h4>PICKUP DETAILS</h4>
                  <ul>
                    <li>State: ${_package.from_state}</li>
                    <li>City: ${_package.from_town}</li>
                    <li>Full Address: ${_package.pickup_address}</li>
                  </ul>
                  <br/>
                  <h4>DROPOFF DETAILS</h4>
                  <ul>
                    <li>State: ${_package.to_state}</li>
                    <li>City: ${_package.to_town}</li>
                    <li>Full Address: ${_package.dropoff_address}</li>
                  </ul>
                  <br/>
                  <h4>OTHER DETAILS</h4>
                  <ul>
                  <li>Delivery Price: ${_package.delivery_price}</li>
                  <li>Package ID: ${_package.package_id}</li>s
                </ul>
                  <br/>
                  <br/><br/>
                  <p>
                    Cheers,<br/>
                    The Koogah Logistics Team.
                  </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
    `;
  }
  if (event === 'DECLINE') {
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
                  <h2>Dispatcher Decline Delivery Event.</h2>
                  <p>Your dispatcher ${dispatcher_first_name} ${dispatcher_last_name} has been declined from picking up a delivery</p>
                  <h4>PICKUP DETAILS</h4>
                  <ul>
                    <li>State: ${_package.from_state}</li>
                    <li>City: ${_package.from_town}</li>
                    <li>Full Address: ${_package.pickup_address}</li>
                  </ul>
                  <br/>
                  <h4>DROPOFF DETAILS</h4>
                  <ul>
                    <li>State: ${_package.to_state}</li>
                    <li>City: ${_package.to_town}</li>
                    <li>Full Address: ${_package.dropoff_address}</li>
                  </ul>
                  <br/>
                  <h4>OTHER DETAILS</h4>
                  <ul>
                  <li>Delivery Price: ${_package.delivery_price}</li>
                  <li>Package ID: ${_package.package_id}</li>s
                </ul>
                  <br/>
                  <br/><br/>
                  <p>
                    Cheers,<br/>
                    The Koogah Logistics Team.
                  </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
    `;
  }
  if (event === 'PAYMENT') {
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
                  <h2>Dispatcher Payment Delivery Event.</h2>
                  <p>Your dispatcher ${dispatcher_first_name} ${dispatcher_last_name} has just been paid for a delivery</p>
                  <h4>PICKUP DETAILS</h4>
                  <ul>
                    <li>State: ${_package.from_state}</li>
                    <li>City: ${_package.from_town}</li>
                    <li>Full Address: ${_package.pickup_address}</li>
                  </ul>
                  <br/>
                  <h4>DROPOFF DETAILS</h4>
                  <ul>
                    <li>State: ${_package.to_state}</li>
                    <li>City: ${_package.to_town}</li>
                    <li>Full Address: ${_package.dropoff_address}</li>
                    <li>Dropoff time: ${_package.dropoff_time}</li>
                  </ul>
                  <br/>
                  <h4>OTHER DETAILS</h4>
                  <ul>
                  <li>Delivery Price: ${_package.delivery_price}</li>
                  <li>Package ID: ${_package.package_id}</li>s
                </ul>
                  <br/>
                  <br/><br/>
                  <p>
                    Cheers,<br/>
                    The Koogah Logistics Team.
                  </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
    `;
  }
  let msgObj = {
    to: company.email,
    from: 'dispatch_report@koogah.com',
    subject: `Koogah - New ${event} Event on Delivery`,
    html,
  };
  return msgObj;
}
