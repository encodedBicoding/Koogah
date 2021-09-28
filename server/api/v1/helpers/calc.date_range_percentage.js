
function calculage_daterange_percentage(current, last) {
  current = Number(current); // new
  last = Number(last); // old
  // formula = n - o/o * 100
  let percentage_change = (((current - last) / (last === 0 ? 1 : last)) * 100);
  return percentage_change.toFixed(0);
 }

export default calculage_daterange_percentage;