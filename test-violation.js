// Test file to violate commit rules

// This function has NO docstring - violates require-docstring rule
function calculateSum(a, b) {
  console.log("Calculating sum:", a, b); // Violates no-console-log rule
  return a + b;
}

// Another function without documentation
function processData(data) {
  console.log("Processing data:", data); // Another console.log violation
  return data.map((item) => item * 2);
}

// This one also lacks documentation
const multiply = (x, y) => {
  console.log("Multiplying:", x, y); // Yet another console.log
  return x * y;
};
sads;
export { calculateSum, processData, multiply };
