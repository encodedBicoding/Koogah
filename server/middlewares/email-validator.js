import EmailValidator from 'email-deep-validator';
import validate from 'deep-email-validator'
const emailValidator = new EmailValidator();

const validateEmail = async function (req, res, next) { 
  const { email } = req.body;
  const resp = await validate(email);
  console.log(resp);
  if (!resp.valid) {
    return res.status(400).json({
      status: 400,
      error: 'Please supply a valid email address'
    })
  }
  return res.end();
  // return next()

}
export default validateEmail;