import { task } from "hardhat/config"

// npx hardhat create-task --network ropsten --address $address --content $contenct --time $time
task("create-task", "Create new task")
  .addParam("address", "The contract address")
  .addParam("content", "Text for new task")
  .addParam("time", "Time for complete the task")
  .setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory("TodoList")
    const contract = await Token.attach(taskArgs.address)
    await contract.createTask(taskArgs.content, taskArgs.time)
    console.log("Done!")
  })

// npx hardhat complete-task --network ropsten --address $address --id $id
task("complete-task", "Change status task")
  .addParam("address", "The contract address")
  .addParam("id", "Id task")
  .setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory("TodoList")
    const contract = await Token.attach(taskArgs.address)
    await contract.completeTask(taskArgs.id)
    console.log("Done!")
  })


// npx hardhat delete-task --network ropsten --address $address --id $id
task("delete-task", "Delete/restore task")
  .addParam("address", "The contract address")
  .addParam("id", "Id task")
  .setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory("TodoList")
    const contract = await Token.attach(taskArgs.address)
    await contract.deleteTask(taskArgs.id)
    console.log("Done!")
  })

// npx hardhat get-one-task --network ropsten --address $address --id $id
task("get-one-task", "Get task by number")
  .addParam("address", "The contract address")
  .addParam("id", "Id task")
  .setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory("TodoList")
    const contract = await Token.attach(taskArgs.address)
    const answer = await contract.getOne(taskArgs.id)
    console.log(answer)
    console.log("Done!")
  })

// npx hardhat get-all-tasks --network ropsten --address $address
task("get-all-tasks", "Get task by number")
  .addParam("address", "The contract address")
  .setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory("TodoList")
    const contract = await Token.attach(taskArgs.address)
    const answer = await contract.getAll()
    console.log(answer)
    console.log("Done!")
  })

// npx hardhat get-user-tasks --network ropsten --address $address --user $addressUser
task("get-user-tasks", "Get tasks for user")
  .addParam("address", "The contract address")
  .addParam("user", "The user address")
  .setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory("TodoList")
    const contract = await Token.attach(taskArgs.address)
    const answer = await contract.getAllByOwner(taskArgs.user)
    console.log(answer)
    console.log("Done!")
  })

// npx hardhat get-percent --network ropsten --address $address --user $addressUser
task("get-percent", "Get the percent of tasks completed on time by user")
  .addParam("address", "The contract address")
  .addParam("user", "The user address")
  .setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory("TodoList")
    const contract = await Token.attach(taskArgs.address)
    const answer = await contract.getPercent(taskArgs.user)
    console.log(answer)
    console.log("Done!")
  })