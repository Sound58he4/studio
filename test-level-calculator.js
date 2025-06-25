// Test file to verify level calculation
import { calculateLevel, getPointsForNextLevel, getLevelProgress } from '../lib/utils/levelCalculator';

// Test cases
console.log('Level Tests:');
console.log('0 points -> Level:', calculateLevel(0)); // Should be 1
console.log('500 points -> Level:', calculateLevel(500)); // Should be 1  
console.log('999 points -> Level:', calculateLevel(999)); // Should be 1
console.log('1000 points -> Level:', calculateLevel(1000)); // Should be 2
console.log('1500 points -> Level:', calculateLevel(1500)); // Should be 2
console.log('2000 points -> Level:', calculateLevel(2000)); // Should be 3
console.log('5999 points -> Level:', calculateLevel(5999)); // Should be 6
console.log('10000 points -> Level:', calculateLevel(10000)); // Should be 11

console.log('\nPoints for Next Level Tests:');
console.log('500 points needs:', getPointsForNextLevel(500), 'more points'); // Should be 500
console.log('1500 points needs:', getPointsForNextLevel(1500), 'more points'); // Should be 500

console.log('\nLevel Progress Tests:');
console.log('500 points progress:', getLevelProgress(500), '%'); // Should be 50%
console.log('1500 points progress:', getLevelProgress(1500), '%'); // Should be 50%
