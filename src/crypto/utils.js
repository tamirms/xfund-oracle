require("dotenv").config()
const bech32 = require("bech32")
const createHash = require("create-hash")
const { base64ToBytes, bufferToBytes } = require("@tendermint/belt")
const jwt = require("jsonwebtoken")
const BN = require("bn.js")

const { JWT_SHARED_SECRET, JWT_ORACLE_SECRET, JWT_MEMO_TOKEN_EXPIRE } = process.env

const sha256 = (bytes) => {
  const buffer1 = bytes instanceof Buffer ? bytes : Buffer.from(bytes)
  const buffer2 = createHash("sha256").update(buffer1).digest()

  return bufferToBytes(buffer2)
}

const ripemd160 = (bytes) => {
  const buffer1 = bytes instanceof Buffer ? bytes : Buffer.from(bytes)
  const buffer2 = createHash("ripemd160").update(buffer1).digest()

  return bufferToBytes(buffer2)
}

const pubKeyToBech32 = (pubkey, prefix) => {
  const publicKey = base64ToBytes(pubkey.value)
  const hash1 = sha256(publicKey)
  const hash2 = ripemd160(hash1)
  const words = bech32.toWords(hash2)

  return bech32.encode(prefix, words)
}

const jwtiseTicket = (ticket, amount, nonce, ethAddr) => {
  const amountBn = new BN(amount * 10 ** 9)
  const jwtPayload = {
    amt: amount,
    abn: amountBn.toNumber(),
    nnc: nonce,
    eth: ethAddr,
    tkt: ticket,
  }
  return jwt.sign(jwtPayload, JWT_SHARED_SECRET)
}

const jwtiseMemo = (ethAddress, selfDelAddr) => {
  const jwtPayload = {
    eth: ethAddress,
  }
  // sign JWT with secret key concatenated with selfDelAddr.
  // selfDelAddr will be extracted from the signature.pub_key in
  // in the Mainchain Tx upon verification.
  return jwt.sign(jwtPayload, JWT_ORACLE_SECRET + selfDelAddr, { expiresIn: JWT_MEMO_TOKEN_EXPIRE })
}

const getDelegatorAddress = (operatorAddr) => {
  const address = bech32.decode(operatorAddr)
  return bech32.encode("und", address.words)
}

module.exports = {
  sha256,
  ripemd160,
  pubKeyToBech32,
  getDelegatorAddress,
  jwtiseTicket,
  jwtiseMemo,
}
