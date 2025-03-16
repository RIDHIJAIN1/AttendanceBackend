const Razorpay = require('razorpay');
const {RAZORPAY_KEY_ID ,RAZORPAY_KEY_SECRET} = process.env
const crypto = require("crypto");
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { stat } = require('fs');

const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});


const createOrder = async(req,res)=>{
    const amount = req.body.amount;
    const options={
        amount :amount,
        currency : "INR",
        receipt:'razorUser@gmail.com'      
    }

razorpayInstance.orders.create(options, async(err,order)=>{
     if(!err){

     const newOrder =  new Order({
        orderId :order.id,
        email:"apc@gmail.com",
        amount:amount,
        currency:"INR",
        status:"created",
     });


     await newOrder.save();

        res.status(200).send({
            success:true,
            msg:'Order Created',
            order_id:order.id,
            amount:amount,
            key_id:RAZORPAY_KEY_ID,
            options,
        
           
        })
     }
     else{
        res.status(400).send({success:false,msg:'Something went wrong!'})
     }
})
}


//Inside app.js
const verifyOrder = async (req, res) => {
    try {
      const { order_id, payment_id, amount, email } = req.body;
      const razorpay_signature = req.headers["x-razorpay-signature"];
      
      const key_secret = process.env.RAZORPAY_KEY_SECRET; 
  
      // Generate HMAC signature
      let hmac = crypto.createHmac("sha256", key_secret);
      hmac.update(order_id + "|" + payment_id);
      const generated_signature = hmac.digest("hex");
  
      if (razorpay_signature === generated_signature) {
        // ✅ Store Payment in Database
        const newPayment = new Payment({
          orderId: order_id,
          paymentId: payment_id,
          amount: amount / 100, // Convert from paisa to INR
          email: email,
          status: "success",
        });
  
        await newPayment.save(); // Save to database
  
        res.json({ success: true, message: "Payment verified and stored" });
      } else {
        res.json({ success: false, message: "Payment verification failed" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


module.exports ={
 createOrder,verifyOrder
 
};