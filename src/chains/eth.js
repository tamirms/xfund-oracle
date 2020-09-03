require("dotenv").config()
const BN = require("bn.js")
const Web3 = require("web3")

const { ETHEREUM_PKEY, ETH_RPC, XFUND_CONTRACT_ADDRESS } = process.env
const web3 = new Web3(Web3.givenProvider || ETH_RPC)

const generateTicketMsg = (claimantAddr, amount, nonce) =>
  Web3.utils.soliditySha3(
    { type: "address", value: claimantAddr },
    { type: "uint256", value: amount.toNumber() },
    { type: "uint256", value: nonce },
    { type: "address", value: Web3.utils.toChecksumAddress(XFUND_CONTRACT_ADDRESS) },
  )

const generateClaimTicket = async (addr, amount, nonce) => {
  const ticket = {
    ticket: null,
    amount: 0,
    nonce: 0,
  }
  try {
    const amountBn = new BN(amount * 10 ** 9)
    const ticketMsg = generateTicketMsg(addr, amountBn, nonce)
    ticket.ticket = await web3.eth.accounts.sign(ticketMsg, ETHEREUM_PKEY)
    ticket.amount = amount
    ticket.amountBn = amountBn.toNumber()
    ticket.nonce = nonce
  } catch (err) {
    console.log(err.toString())
    throw err
  }
  return ticket
}

module.exports = { generateClaimTicket }
