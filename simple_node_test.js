// Simplest Node.js test
console.log("Simple Node.js test starting...");

setTimeout(() => {
  console.log("Timeout works!");
  process.exit(0);
}, 1000);

console.log("Test setup complete..."); 