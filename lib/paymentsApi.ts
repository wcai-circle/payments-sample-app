import { get } from 'lodash'
import axios from 'axios'

import { getAPIHostname } from './apiTarget'

interface MetaData {
  session: {
    sessionId: string
    ipAddress: string
  }
}

export interface CreatePaymentPayload {
  idempotencyKey: string
  amount: {
    amount: string
    currency: string
  }
  verificationMethod: string
  source: {
    id: string
    type: string
  }
  keyId: string
  encryptedData: string
  metadata: MetaData
}

export interface RefundPaymentPayload {
  idempotencyKey: string
  amount: {
    amount: string
    currency: string
  }
}

const instance = axios.create({
  baseURL: getAPIHostname()
})

/**
 * Global error handler:
 * Intercepts all axios reponses and maps
 * to errorHandler object
 */
instance.interceptors.response.use(
  function(response) {
    if (get(response, 'data.data')) {
      return response.data.data
    }
    return response
  },
  function(error) {
    let response = get(error, 'response')
    if (!response) {
      response = error.toJSON()
    }
    return Promise.reject(response)
  }
)

/** Returns the axios instance */
function getInstance() {
  return instance
}

/**
 * Returns a public key used to encryption
 *
 * @returns Promise<PublicKey> {"keyId": "key1", "publicKey": "LS0tLS1CRUdJTiBQR1A..." }
 */
function getPCIPublicKey() {
  const url = '/v1/encryption/public'

  return instance.get(url)
}

/**
 * Cancel a payment
 * @param {String} id
 */
function cancelPayment(id: string, payload: any) {
  const url = `/v1/payments/${id}/cancel`

  return instance.post(url, payload)
}

/**
 * Create payment
 * @param {*} payload (contains form data and encrypted payment details)
 */
function createPayment(payload: CreatePaymentPayload) {
  const url = `/v1/payments`
  return instance.post(url, payload)
}

/**
 * Get payments
 * @param {String} from
 * @param {String} to
 * @param {String} pageBefore
 * @param {String} pageAfter
 * @param {String} pageSize
 */
function getPayments(
  from: string,
  to: string,
  pageBefore: string,
  pageAfter: string,
  pageSize: string
) {
  const nullIfEmpty = (prop: string) => {
    if (prop === '') {
      return null
    }
    return prop
  }

  const queryParams = {
    from: nullIfEmpty(from),
    to: nullIfEmpty(to),
    pageBefore: nullIfEmpty(pageBefore),
    pageAfter: nullIfEmpty(pageAfter),
    pageSize: nullIfEmpty(pageSize)
  }

  const url = `/v1/payments`

  return instance.get(url, { params: queryParams })
}

/**
 * Get a payment
 * @param {String} id
 */
function getPaymentById(id: string) {
  const url = `/v1/payments/${id}`

  return instance.get(url)
}

/**
 * Refund a payment
 * @param {String} id
 */
function refundPayment(id: string, payload: RefundPaymentPayload) {
  const url = `/v1/payments/${id}/refund`
  return instance.post(url, payload)
}

export default {
  getInstance,
  cancelPayment,
  createPayment,
  getPayments,
  getPaymentById,
  getPCIPublicKey,
  refundPayment
}
