import EmailValidator from 'email-deep-validator';
const emailValidator = new EmailValidator();

const validateEmail = async function (req, res, next) { 
  const { email } = req.body;
  const { validMailbox } = await emailValidator.verify(email);
  if (!validMailbox) {
    return res.status(400).json({
      status: 400,
      error: 'Please supply a valid email address'
    })
  }
  return next()

}
export default validateEmail;