
async function verifyPaystackPayment(reference) {
  return Promise.try(() => fetch(`https://api.paystack.co/transaction/verify/${reference}`,
  {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_LIVE_SECRET_KEY}`,
      'Content-type': 'application/json',
    },
  }
).then((resp) => resp.json())
    .then((result) => result)
  );
}