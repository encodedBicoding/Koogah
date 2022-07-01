const env = process.env;
export const getCorporatePriceSlashed = (price) => {
  try {
    const company_delivery_fee = env.COMPANY_PACKAGE_DELIVERY_FEE; 
    const slashedPrice = (price) - Math.ceil(Number( (price * company_delivery_fee)));
    return slashedPrice.toString();
   } catch (err) { 
    console.log(err);
    throw err;
  }
}
 
export const getIndividualPriceSlashed = (price) => { 
  try {
    const individual_delivery_fee = env.PACKAGE_DELIVERY_FEE; 
    const slashedPrice = (price) - Math.ceil(Number( (price * individual_delivery_fee)));
    return slashedPrice.toString();
   } catch (err) { 
    console.log(err);
    throw err;
  }
}