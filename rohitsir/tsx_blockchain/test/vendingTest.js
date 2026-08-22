// const { expect } = require("chai")
// const VendingModule = require("../ignition/modules/Deploy")
// const { ethers, ignition } = require("hardhat")
// const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers')
// const { parseEther } = require("ethers");
// describe("testing our Vending Machine", function () {

//     //deploy the contact 
//     async function vendingMashinDeploy() {

//         //ether chaiye hoga ..it gives 20 accounts
//         const [owner, buyer] = await ethers.getSigners();
//         const { sodaVendor, vendingMachine } = await ignition.deploy(VendingModule)
//         return { owner, buyer, vendingMachine, sodaVendor }
//     }


//     it("Should correctly set the Deployer as owner", async function () {
//         const { owner, vendingMachine } = await vendingMashinDeploy();
//         const ownerOfVendingMachine = await vendingMachine.owner();
//         expect(ownerOfVendingMachine).to.equal(owner.address);
//     })
//     it("Should reject the paymet if paymet if faield", async function () {
//         const { owner, vendingMachine } = await loadFixture(vendingMashinDeploy)
//         // const price = parseEther("0.01");
//         const price = '1';
//         await expect(vendingMachine.connect(owner).buySoda({ value: price })).to.be.revertedWith("Incorrect paymet for soda")
//     })

//     it("Should prvent non-owners from withdrawing funds", async function () {
//         const { buyer, vendingMachine, sodaVendor } = await loadFixture(vendingMashinDeploy)
//         const price = await sodaVendor.getPrice();
//         await vendingMachine.connect(buyer).buySoda({ value: price });
//         await expect(vendingMachine.connect(buyer).withdraw()).to.be.revertedWith("you have not right to do this")

//     })

//     it("Should prevent Buying soda if stock is zero", async function () {
//         const { buyer, vendingMachine, sodaVendor } = await loadFixture(vendingMashinDeploy)
//         const price = await sodaVendor.getPrice();
//         for (let i = 0; i < 100; i++) {
//             await vendingMachine.connect(buyer).buySoda({ value: price });
//         }
//         //prove that user can not buy soda if inventory is zero 
//         expect(await vendingMachine.soda()).to.equal(0);
//         await expect(vendingMachine.connect(buyer).buySoda({ value: price })).to.be.revertedWith("Sorry, out of stock!")

//     })


// })

// // 44.52

//revison 






const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers")
const VendingModule = require("../ignition/modules/Deploy")
const { ethers, ignition } = require("hardhat")
const { parseEther } = require("ethers");

describe("Testing our vending machine ", function () {
    //deploy the contact  we have deploy code in ignition folder name with deploy
    async function vendingMachineDeploy() {
        //ethers chiye hoga
        //total 20 accout retrun karke dega  
        const [owner, buyer] = await ethers.getSigners();

        //sodaVEndor ,vendingMachine commming from deploy 
        const { sodaVendor, vendingMachine } = await ignition.deploy(VendingModule)
        return { owner, buyer, vendingMachine, sodaVendor };
    }


    it("Should correctly set the Deployer as onwer", async function () {
        // const { owner, vendingMachine } = await vendingMachineDeploy(); //but need to call via loadFixture
        const { owner, vendingMachine } = await loadFixture(vendingMachineDeploy);
        const ownerOfVendingMachine = await vendingMachine.owner(); //vending mashin owner 
        expect(ownerOfVendingMachine).to.equal(owner.address);
    })

    it("should revert if some Payment if failed ", async function () {
        const { buyer, vendingMachine, sodaVendor } = await loadFixture(vendingMachineDeploy)
        // const price = await sodaVendor.getPrice();
        // const price =await parseEther("0.01"); 
        const price = await parseEther("1");

        await expect(vendingMachine.connect(buyer).buySoda({ value: price })).to.be.revertedWith("Incorrect paymet for soda")

    })

    it("Should prevent non-owners from withdrawing funds  ", async function () {
        const { buyer, vendingMachine, sodaVendor } = await loadFixture(vendingMachineDeploy);
        const price = await sodaVendor.getPrice();

        await vendingMachine.connect(buyer).buySoda({ value: price });
        await expect(vendingMachine.connect(buyer).withdraw()).to.be.revertedWith("you have not right to do this");
    })

    it("should prevent buyig soda if stock is zero  ", async function () {
        const { buyer, vendingMachine, sodaVendor } = await loadFixture(vendingMachineDeploy);
        const price = await sodaVendor.getPrice();

        for (let i = 0; i < 100; i++) {
            await vendingMachine.connect(buyer).buySoda({ value: price });
        }
        expect(await vendingMachine.soda()).to.equal(0);
        await expect(vendingMachine.connect(buyer).buySoda({ value: price })).to.be.revertedWith("Sorry, out of stock!")
    })

    it("should transfer the full balance to the owner upon withdrawl", async function () {

        const { buyer, vendingMachine, sodaVendor, owner } = await loadFixture(vendingMachineDeploy);
        const price = await sodaVendor.getPrice();
        await vendingMachine.connect(buyer).buySoda({ value: price });
        await expect(vendingMachine.connect(owner).withdraw()).to.changeEtherBalances([vendingMachine, owner], [-price, price])

    })

    it("should  emit a sodaPhrchase event with correct arguments on success", async function () {
        const { buyer, vendingMachine, sodaVendor } = await loadFixture(vendingMachineDeploy);
        const price = await sodaVendor.getPrice();
        await expect(vendingMachine.connect(buyer).buySoda({ value: price }));
        expect(vendingMachine.connect(buyer).buySoda({ value: price })).to.emit(vendingMachine, "Sodapurchase")

    })
    
})











