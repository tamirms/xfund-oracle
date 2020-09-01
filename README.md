# xFUND Oracle

This repo contains the source code for the backend Oracle for xFUND. The oracle handles
generating xFUND emissions, validating claims and signing xFUND Claim Tickets. It relays
data to the xFUND Portal via its built-in API.

The API is not intended to be accessed directly, although this is possible.

## Running

[PostgrSQL](https://www.postgresql.org/) is required. Once installed, create a 
database, user and password. The Oracle will handle creating the necessary tables 
and indexes on initialisation.

Install package dependencies

```bash 
yarn install
```

Copy `example.env` to `.env` and input the values. See `example.env` for details 
regarding the variables.

Finally, run:

```bash
npm run dev
```

to run in Development mode, or

```bash
npm run build
npm run start
```

Oracle endpoints are available by default on http://localhost:3001

## Generating Emissions

A connection to a Mainchain (MainNet, TestNet or DevNet) is required.

Run:

```bash
npm run generate
```

to update the Validator set in the database and generate the daily xFUND emissions.

## Development/Testing Stack

All xFUND components, in addition to Mainchain DevNet and `ganache-cli` Ethereum chain
are all required to test the entire end-to-end process:

1. Run Mainchain DevNet
2. Run `ganache-cli` & deploy smart contract
3. Run xFUND Oracle
4. Run xFUND Portal

### 1. Mainchain DevNet

Clone https://github.com/unification-com/mainchain  
See https://docs.unification.io/networks/local-devnet.html for instructions on running DevNet

### 2. xFUND Smart Contract

See https://github.com/unification-com/xfund-smart-contract, specifically the section of the 
`README` covering [Deploying with ganache-cli](https://github.com/unification-com/xfund-smart-contract#deploying-with-ganache-cli)

### 3. xFUND Oracle

This repository.

### 4. xFUND Portal

See https://github.com/unification-com/xfund-portal
