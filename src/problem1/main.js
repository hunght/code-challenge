// https://s5tech.notion.site/Code-Challenge-05cdb9e0d1ce432a843f763b5d5f7497?p=6052097f0f144200bbea7c2fa75c0124&pm=s
// Task
// Provide 3 unique implementations of the following function in JavaScript.
// Input: n - any integer
// Assuming this input will always produce a result lesser than Number.MAX_SAFE_INTEGER.
// Output: return - summation to n, i.e. sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15.
var sum_to_n_a = function(n) {
    return (n * (n + 1)) / 2;
};

var sum_to_n_b = function(n) {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
};

var sum_to_n_c = function(n) {
    if (n === 1) return 1;
    return n + sum_to_n_c(n - 1);
};

// Basic tests
console.log("=== Basic Tests ===");
console.log(sum_to_n_a(5)); // 15
console.log(sum_to_n_b(5)); // 15
console.log(sum_to_n_c(5)); // 15

console.log(sum_to_n_a(10)); // 55
console.log(sum_to_n_b(10)); // 55
console.log(sum_to_n_c(10)); // 55

// Testing limits
console.log("\n=== Testing Limits ===");
console.log("Number.MAX_SAFE_INTEGER:", Number.MAX_SAFE_INTEGER);

// Test 1: Large number that works for formula and loop but not recursion
console.log("\n--- Test with n = 100000 ---");
console.log("Formula result:", sum_to_n_a(100000));
console.log("Loop result:", sum_to_n_b(100000));

// Test 2: Test recursion limit (this will likely fail)
console.log("\n--- Testing recursion limit ---");
try {
    console.log("Trying recursion with n = 10000...");
    console.log("Recursion result:", sum_to_n_c(10000));
} catch (error) {
    console.log("Recursion failed:", error.message);
}

// Test 3: Very large number to show precision limits
console.log("\n--- Test with very large number ---");
const largeN = 10000000;
console.log(`n = ${largeN}`);
console.log("Formula result:", sum_to_n_a(largeN));
console.log("Expected result check:", largeN * (largeN + 1) / 2);

// Test 4: Find approximate recursion limit
console.log("\n--- Finding recursion limit ---");
let maxRecursion = 1000;
while (maxRecursion <= 20000) {
    try {
        sum_to_n_c(maxRecursion);
        console.log(`Recursion works for n = ${maxRecursion}`);
        maxRecursion += 1000;
    } catch (error) {
        console.log(`Recursion fails at approximately n = ${maxRecursion}`);
        break;
    }
}

// Time Complexity: O(1), O(n), O(n) respectively
// Space Complexity: O(1), O(1), O(n) respectively (due to call stack in recursion)
// Explanation:
// 1. The first implementation uses the mathematical formula for the sum of the first n natural numbers, which is efficient and runs in constant time.
// 2. The second implementation uses a simple loop to iterate from 1 to n, accumulating the sum. This approach has linear time complexity.
// 3. The third implementation uses recursion to achieve the same result. It adds n to the sum of numbers up to n-1, with a base case of 1. This also has linear time complexity but uses additional space for the call stack.


