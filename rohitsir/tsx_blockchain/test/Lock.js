// const { expect } = require("chai")

// //describe , it  ,expect 

// describe("Testing the math function", function () {


//   it("Should add two number correctly", function () {

//     let a = 20;
//     let b = 10;
//     const expectResult = 30;
//     const actualResult = a + b;
//     expect(expectResult).to.equal(actualResult)
//   })

//   it("should subtract two number correctly", function () {
//     let a = 10;
//     let b = 30;
//     const expectResult = 20;
//     const actualResult = b - a;
//     expect(expectResult).to.equal(actualResult);
//   })

// })



//revison  
const { expect } = require("chai")
//describe, it ,expect 
it("should add two number corretly", function () {

  let a = 10;
  let b = 20;
  const expectedResult = 30;
  const actualResult = a + b;
  expect(expectedResult).to.equal(actualResult);

})


it("Should subtract two number correctly ", function () {
  let a = 10;
  let b = 30;
  const expectedResult = 20;
  const actualResult = b - a;
  expect(expectedResult).to.equal(actualResult);
})
