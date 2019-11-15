/* eslint-disable camelcase */
/* eslint-disable no-plusplus */

function generate_ref() {
  let ref = '';
  const path = 'ABCDEFGHIJKLMNOPQRSTVWXYZabcdefghijklmnopqrstuvwxyz0123456789=-#!&%@_+$^';
  for (let i = 0; i < 21; ++i) {
    const rand = Math.floor(Math.random() * path.length);
    ref += path[rand];
  }
  return ref;
}

export default generate_ref;
