import * as BigNumber from 'bignumber.js'
import ChainManager from './chain_manager'
import { PaymentChannel } from './payment_channel'
import Payment from './payment'
import ChannelContract from './channel_contract'
import Signature from "./signature";

export default class PaymentManager {
  private chainManager: ChainManager

  private channelContract: ChannelContract

  constructor (chainManager: ChainManager, channelContract: ChannelContract) {
    this.chainManager = chainManager
    this.channelContract = channelContract
  }

  async buildPaymentForChannel (channel: PaymentChannel, price: BigNumber.BigNumber, totalValue: BigNumber.BigNumber, meta: string): Promise<Payment> {
    const digest = await this.channelContract.paymentDigest(channel.channelId, totalValue)
    const signature = await this.chainManager.sign(channel.sender, digest)

    return new Payment({
      channelId: channel.channelId,
      sender: channel.sender,
      receiver: channel.receiver,
      price,
      value: totalValue,
      channelValue: channel.value,
      signature,
      meta,
      contractAddress: channel.contractAddress,
      token: undefined
    })
  }

  async isValid (payment: Payment, paymentChannel: PaymentChannel): Promise<boolean> {
    const validIncrement = (paymentChannel.spent.plus(payment.price)).lessThanOrEqualTo(paymentChannel.value)
    const validChannelValue = paymentChannel.value.equals(payment.channelValue)
    const validChannelId = paymentChannel.channelId === payment.channelId
    const validPaymentValue = paymentChannel.value.lessThanOrEqualTo(payment.channelValue)
    const validSender = paymentChannel.sender === payment.sender
    //const isPositive = payment.value.greaterThanOrEqualTo(new BigNumber.BigNumber(0)) && payment.price.greaterThanOrEqualTo(new BigNumber.BigNumber(0))
    const isPositive = payment.value.greaterThanOrEqualTo(new BigNumber.BigNumber(0)) && payment.price.greaterThanOrEqualTo(new BigNumber.BigNumber(0))

    const canClaim = await this.channelContract.canClaim(payment.channelId, payment.value, payment.receiver, payment.signature)
    console.log('SIGNUTURE IN CLAIM:'+payment.signature)
    console.log('SIGNUTURE IN CLAIM PART R:'+payment.signature.toParts().r)
    console.log('SIGNUTURE IN CLAIM PART S:'+payment.signature.toParts().s)
    console.log('SIGNUTURE IN CLAIM PART V:'+payment.signature.toParts().v)

    return validIncrement &&
      validChannelValue &&
      validPaymentValue &&
      validSender &&
      validChannelId &&
      canClaim &&
      isPositive
  }
}
