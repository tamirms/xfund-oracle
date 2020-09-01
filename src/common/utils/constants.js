const TICKET_CLAIM_STATUS = {
  ISSUED: 1,
  CLAIMED: 2,
}

const STATUS_CODES = {
  ERR: {
    UNSPECIFIED: 0,
    MAINCHAIN_TX: 1,
    JWT: 2,
    MEMO_TOKEN: 3,
    MISMATCH: 4,
    ETH_ADDR: 5,
    EMISSION: 6,
    DB_NOT_FOUND: 7,
    CLAIM_TICKET: 8,
    NONCE: 9,
    DB_QUERY_ERROR: 10,
  },
  OK: 200,
}

const DEFAULT_JSON_RESPONSE = {
  success: false,
  status: STATUS_CODES.ERR.UNSPECIFIED,
  error: "",
  result: {},
}

const claimStatusLookup = (claimStatus) => {
  switch (claimStatus) {
    case TICKET_CLAIM_STATUS.ISSUED:
      return "issued"
    case TICKET_CLAIM_STATUS.CLAIMED:
      return "claimed"
    default:
      return "unknown"
  }
}

const isValidClaimStatus = (claimStatus) => {
  let isValid = false
  Object.keys(TICKET_CLAIM_STATUS).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(TICKET_CLAIM_STATUS, key)) {
      if (parseInt(claimStatus, 10) === TICKET_CLAIM_STATUS[key]) {
        isValid = true
      }
    }
  })
  return isValid
}

const errorCodeLookup = (errCode) => {
  switch (errCode) {
    case STATUS_CODES.ERR.UNSPECIFIED:
      return `[${errCode}] Unspecified Error`
    case STATUS_CODES.ERR.MAINCHAIN_TX:
      return `[${errCode}] Mainchain Tx Error`
    case STATUS_CODES.ERR.JWT:
      return `[${errCode}] JWT Error`
    case STATUS_CODES.ERR.MEMO_TOKEN:
      return `[${errCode}] Memo Token Error`
    case STATUS_CODES.ERR.MISMATCH:
      return `[${errCode}] Mismatch Error`
    case STATUS_CODES.ERR.ETH_ADDR:
      return `[${errCode}] Ethereum Address Error`
    case STATUS_CODES.ERR.EMISSION:
      return `[${errCode}] Emission Error`
    case STATUS_CODES.ERR.DB_NOT_FOUND:
      return `[${errCode}] Not Found in DB`
    case STATUS_CODES.ERR.CLAIM_TICKET:
      return `[${errCode}] Claim Ticket Error`
    case STATUS_CODES.ERR.NONCE:
      return `[${errCode}] Nonce Error`
    case STATUS_CODES.ERR.DB_QUERY_ERROR:
      return `[${errCode}] DB Query Error`
    default:
      return `Unknown error code ${errCode}`
  }
}

module.exports = {
  DEFAULT_JSON_RESPONSE,
  STATUS_CODES,
  TICKET_CLAIM_STATUS,
  claimStatusLookup,
  errorCodeLookup,
  isValidClaimStatus,
}
