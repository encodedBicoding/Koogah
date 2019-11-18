/* eslint-disable camelcase */
/* eslint-disable no-plusplus */

function generate_ref(type) {
  let ref = '';
  const path = 'ABCDEFGHIJKLMNOPQRSTVWXYZabcdefghijklmnopqrstuvwxyz0123456789!&%@$';
  if (!type) {
    for (let i = 0; i < 21; ++i) {
      const rand = Math.floor(Math.random() * path.length);
      ref += path[rand];
    }
  }
  if (type === 'referal') {
    for (let i = 0; i < 10; ++i) {
      const rand = Math.floor(Math.random() * path.length);
      ref += path[rand];
    }
  }
  return ref;
}

export default generate_ref;
