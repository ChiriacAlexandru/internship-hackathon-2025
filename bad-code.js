// BAD CODE - Violates project rules intentionally

function badFunction() {
  console.log("This is a test");
  console.log("Multiple console.log statements");
  return true;
}

const anotherBadFunction = (x) => {
  console.log("No documentation here");
  return x * 2;
};

console.log("Direct console.log in global scope");

export { badFunction, anotherBadFunction };
