const checkSession = function(req, res, next){
  const { user } = req.session;
  if(!user) {
    return res.status(401).json({
      status: 401,
      message: 'Not Authorized',
      errorCode: 'SESS_01'
    })
  } else {
    next();
  }
}

export default checkSession;