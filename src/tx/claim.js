require("dotenv").config()
const sigUtil = require("eth-sig-util")
const Web3 = require("web3")
const jwt = require("jsonwebtoken")
const { pubKeyToBech32 } = require("../crypto/utils")
const { Validators } = require("../db/database")
const { STATUS_CODES } = require("../common/utils/constants")
const { getMemoKey } = require("../db/memoKeys/queries")

const { xFundSigDomain, xFundSigTxData, xFundSigDomainData } = require("../common/utils/constants")

const validateClaimTx = async (tx, ethSigNonce, ethSig) => {
  const res = {
    status: STATUS_CODES.ERR.UNSPECIFIED,
    errorMsg: "",
    txHash: tx.txhash,
    height: tx.height,
    ethAddr: "",
    validatorId: 0,
  }

  // initial check to see if Tx was successful/rejected
  if (
    Object.prototype.hasOwnProperty.call(tx, "codespace") ||
    Object.prototype.hasOwnProperty.call(tx, "code")
  ) {
    res.status = STATUS_CODES.ERR.MAINCHAIN_TX
    res.errorMsg = `Tx Error: ${tx.raw_log}`
    return res
  }
  // 1. check tx is edit-validator tx
  let hasEditValidatorMsg = false
  let undvaloperAddress

  for (let i = 0; i < tx.tx.value.msg.length; i += 1) {
    const msg = tx.tx.value.msg[i]
    if (msg.type === "cosmos-sdk/MsgEditValidator") {
      hasEditValidatorMsg = true
      undvaloperAddress = msg.value.address
    }
  }
  if (!hasEditValidatorMsg) {
    res.status = STATUS_CODES.ERR.MAINCHAIN_TX
    res.errorMsg = "Msg Error: Tx does not contain MsgEditValidator Msg - please send empty edit-validator tx"
    return res
  }

  // 2. check tx signature for validator address, and get validator info from DB
  const sentAddrFromSig = pubKeyToBech32(tx.tx.value.signatures[0].pub_key, "und")

  const valDbResFromSig = await Validators.findOne({
    where: { selfDelegateAddress: sentAddrFromSig },
  })

  if (!valDbResFromSig) {
    res.status = STATUS_CODES.ERR.MAINCHAIN_TX
    res.errorMsg = `Tx Error: address in tx signature ${sentAddrFromSig} does exist in db`
    return res
  }

  // 3. cross reference operator address in tx with db value
  if (undvaloperAddress !== valDbResFromSig.operatorAddress) {
    res.status = STATUS_CODES.ERR.MISMATCH
    res.errorMsg = `Db Error: operator address in tx signature ${undvaloperAddress} does not match db ${valDbResFromSig.operatorAddress}`
    return res
  }

  // 4. decode tx memo
  if (!tx.tx.value.memo) {
    res.status = STATUS_CODES.ERR.MAINCHAIN_TX
    res.errorMsg = `Tx Error: transaction ${tx.txhash} does not contain a memo`
    return res
  }

  let decodedMemo
  let ethAddr
  try {
    const memoKey = await getMemoKey(valDbResFromSig.id)
    if (!memoKey) {
      res.status = STATUS_CODES.ERR.DB_NOT_FOUND
      res.errorMsg = "memo key error"
      return res
    }
    const passPhrase = memoKey.memoKey + sentAddrFromSig
    decodedMemo = jwt.verify(tx.tx.value.memo, passPhrase)
    ethAddr = decodedMemo.eth
  } catch (err) {
    res.status = STATUS_CODES.ERR.JWT
    res.errorMsg = `failed to decode memo in tx ${tx.txhash}: ${err.message}`
    return res
  }

  if (!ethAddr) {
    res.status = STATUS_CODES.ERR.JWT
    res.errorMsg = "eth address not found in jwt"
    return res
  }

  // 5. check eth value is a valid ethereum wallet address
  if (!Web3.utils.isAddress(ethAddr)) {
    res.status = STATUS_CODES.ERR.ETH_ADDR
    res.errorMsg = `Eth Address Error: eth address "${ethAddr}" is not a valid Eth wallet address`
    return res
  }

  // 6. check the signature data from the POST request
  const domain = [...xFundSigDomain]
  const txData = [...xFundSigTxData]
  const domainData = { ...xFundSigDomainData }
  const message = {
    tx_hash: tx.txhash,
    sig_nonce: ethSigNonce,
  }
  const msgParams = JSON.stringify({
    types: {
      EIP712Domain: domain,
      TxData: txData,
    },
    domain: domainData,
    primaryType: "TxData",
    message,
  })

  const recovered = sigUtil.recoverTypedSignature({ data: JSON.parse(msgParams), sig: ethSig })

  if (Web3.utils.toChecksumAddress(ethAddr) !== Web3.utils.toChecksumAddress(recovered)) {
    res.status = STATUS_CODES.ERR.ETH_ADDR
    res.errorMsg = `Eth Sig Error: eth address "${ethAddr}" does not match recovered signature address "${recovered}"`
    return res
  }

  res.status = STATUS_CODES.OK
  res.ethAddr = ethAddr
  res.selfDelAddr = sentAddrFromSig
  res.validatorId = valDbResFromSig.id

  return res
}

module.exports = { validateClaimTx }
