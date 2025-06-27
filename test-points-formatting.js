// Test file to verify points formatting
const { formatPoints } = require('./src/lib/utils/pointsFormatter');

console.log('Testing formatPoints function:');
console.log('500 points:', formatPoints(500)); // Should be "500"
console.log('999 points:', formatPoints(999)); // Should be "999"
console.log('1000 points:', formatPoints(1000)); // Should be "1k"
console.log('1200 points:', formatPoints(1200)); // Should be "1.2k"
console.log('1500 points:', formatPoints(1500)); // Should be "1.5k"
console.log('2000 points:', formatPoints(2000)); // Should be "2k"
console.log('15500 points:', formatPoints(15500)); // Should be "15.5k"
console.log('1000000 points:', formatPoints(1000000)); // Should be "1m"
console.log('1200000 points:', formatPoints(1200000)); // Should be "1.2m"
console.log('2500000 points:', formatPoints(2500000)); // Should be "2.5m"
