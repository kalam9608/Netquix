import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import {useState} from 'react';
import { toast } from 'react-toastify';

const stripePromise = loadStripe (
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

const CheckoutForm = ({clientSecret, handlePaymentSuccess, extraContent = <></>}) => {
  const stripe = useStripe ();
  const elements = useElements ();

  const [errorMessage, setErrorMessage] = useState (null);

  const handleSubmit = async event => {
    event.preventDefault ();

    if (elements == null) {
      return;
    }

    const {error: submitError} = await elements.submit ();
    if (submitError) {
      // Show error to your customer
      setErrorMessage (submitError.message);
      return;
    }

    const {error, paymentIntent} = await stripe.confirmPayment ({
      elements,
      clientSecret,
      confirmParams: {
        return_url: 'https://netquix-ui.vercel.app/dashboard',
      },
      redirect: 'if_required'
    });

    if (error) {
      setErrorMessage (error.message);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      toast.success("Payment succeeded");
      handlePaymentSuccess();
    } else {
      console.log("Payment failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {extraContent}
      <PaymentElement />
      <button
        className="btn btn-primary mt-4 w-100"
        type="submit"
        disabled={!stripe || !elements}
      >
        Pay
      </button>
      {errorMessage && <div className="error mt-3">{errorMessage}</div>}
    </form>
  );
};

const StripeCard = ({clientSecret, handlePaymentSuccess, extraContent = <></>, amount}) => {
  // console.log("==========>amou",amount)
  // const options = {
  //   name: 'netquix',
  //   description: 'netquix trainer payment',
  //   clientSecret,
  // };

  // const options = {
  //   payment_method_types: ['card', 'ideal', 'sepa_debit'],
  //   name: 'netquix',
  //   description: 'netquix trainer payment',
  //   mode: 'payment',
  //   // currency: 'usd',
  //   currency: 'eur',
  //   amount: amount * 100,
  //   // clientSecret,
  // };

  // const options = {
  //   payment_method_types: ['card','ach_debit', 'afterpay', 'alipay', 'jcb', 'unionpay', 'google_pay', 'apple_pay', 'microsoft_pay'],
  //   name: 'netquix',
  //   description: 'netquix trainer payment',
  //   mode: 'payment',
  //   currency: 'usd', // Change currency to 'usd'
  //   amount: amount * 100,
  // };

  const options = {
    payment_method_types: ['card', 'alipay', 'klarna', 'amazon_pay', 'cashapp', 'link', 'wechat_pay'],
    // payment_method_types: 'card,alipay,klarna,amazon_pay,acss_debit,cashapp,link,wechat_pay',
    // payment_method_types: ['card', 'afterpay', 'alipay', 'jcb', 'unionpay', 'google_pay', 'apple_pay', 'microsoft_pay'],
    // payment_method_types:  ["card", "alipay", "klarna", "amazon_pay", "acss_debit", "cashapp", "link", "wechat_pay"],
    // payment_method_types:  ['card', 'alipay', 'klarna', "amazon_pay","acss_debit","cashapp","link", "wechat_pay", "eps", "giropay", "p24"],
    // payment_method_types: [
    //   "amazon_pay", 
    //   "alipay", 
    //   "alma", 
    //   "affirm", 
    //   "afterpay_clearpay", 
    //   "au_becs_debit", 
    //   "acss_debit", 
    //   "bacs_debit", 
    //   "bancontact", 
    //   "blik", 
    //   "boleto", 
    //   "card", 
    //   "cashapp", 
    //   "crypto", 
    //   // "customer_balance", 
    //   "eps", 
    //   "fpx", 
    //   "giropay", 
    //   "grabpay", 
    //   "ideal", 
    //   "klarna", 
    //   "konbini", 
    //   "mobilepay", 
    //   "multibanco", 
    //   "ng_market", 
    //   "nz_bank_account", 
    //   "oxxo", 
    //   "p24", 
    //   "pay_by_bank", 
    //   "paypal", 
    //   "payto", 
    //   "rechnung", 
    //   "sepa_debit", 
    //   "sofort", 
    //   "south_korea_market", 
    //   "kr_market", 
    //   "swish", 
    //   "three_d_secure", 
    //   "twint", 
    //   "upi", 
    //   "us_bank_account", 
    //   "wechat_pay", 
    //   "paynow", 
    //   "pix", 
    //   "promptpay", 
    //   "revolut_pay", 
    //   "netbanking", // Wrap in quotes
    //   "id_bank_transfer", 
    //   "link", 
    //   "demo_pay"
    // ],
    name: 'netquix',
    description: 'netquix trainer payment',
    mode: 'payment',
    currency: 'usd',
    amount: amount * 100,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm clientSecret={clientSecret} handlePaymentSuccess={handlePaymentSuccess} extraContent={extraContent} />
    </Elements>
  );
};
export default StripeCard;
