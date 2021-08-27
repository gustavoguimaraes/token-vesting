# Task

Create a token vesting contract in Solidity for Ethereum. The contract should allow users to claim tokens at a constant rate over a specified block range. The exact specifications are:

1. The contract should keep track of allocations of tokens for wallet addresses. Each address can only appear once and the allocation of tokens for each address can be different.
2. Tokens should be claimable by the user in a linear fashion between the contract’s startBlock and stopBlock, which should be set by the contract deployer on contract creation.
   For example: If Alice’s allocation is 100 tokens, Bob’s allocation is 50 tokens, the duration of the time-release contract is 1000 blocks, and we are currently 500 blocks past the startBlock, then Alice should be able to claim up to 50 tokens and Bob should be able to claim up to 25 tokens.
3. The token that is claimable is a ERC20 standard token.
4. We will need a method for populating the contract with allocations (address, token
   amounts).

# Setup

- `npm i`
- `npm run compile`

# Test

- `npm test`

# Deploy Testnet

- `npm run deploy:testnet`

# Hardhat info

### Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.js
node scripts/deploy.js
npx eslint '**/*.js'
npx eslint '**/*.js' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

### Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.template file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.js
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```
