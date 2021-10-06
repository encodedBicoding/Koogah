
export default function generatePromoCode() {
  const f = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
  let code = '';
  for(var i=0; i<5; i++) {
    code += f[Math.floor(Math.random() * f.length)];
  }
  return code;
};