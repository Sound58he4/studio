// Test script to verify progress bar fixes
console.log("Testing progress bar calculation fixes...");

// Test the calculatePercentage function logic
function calculatePercentage(current, target) {
    if (!target || target <= 0) {
        console.log(`Zero or invalid target detected: current=${current}, target=${target}`);
        return 0;
    }
    const percentage = Math.round((current / target) * 100);
    if (isNaN(percentage) || !isFinite(percentage)) {
        console.warn(`Invalid percentage calculated: current=${current}, target=${target}, percentage=${percentage}`);
        return 0;
    }
    return percentage;
}

// Test cases
const testCases = [
    { current: 50, target: 100, expected: 50 },
    { current: 100, target: 100, expected: 100 },
    { current: 150, target: 100, expected: 150 },
    { current: 50, target: 0, expected: 0 },
    { current: 50, target: null, expected: 0 },
    { current: 50, target: undefined, expected: 0 },
    { current: 0, target: 100, expected: 0 },
    { current: 25.5, target: 100, expected: 26 },
];

console.log("\nRunning test cases:");
testCases.forEach((test, index) => {
    const result = calculatePercentage(test.current, test.target);
    const passed = result === test.expected;
    console.log(`Test ${index + 1}: current=${test.current}, target=${test.target} => ${result}% (expected: ${test.expected}%) ${passed ? '✓' : '✗'}`);
});

console.log("\nAll tests completed!");
