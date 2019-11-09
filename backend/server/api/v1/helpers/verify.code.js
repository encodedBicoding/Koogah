
function generateVerificationCode(){
  return Math.floor(Math.random()*65743+1000*1000/500);
}

export default generateVerificationCode;