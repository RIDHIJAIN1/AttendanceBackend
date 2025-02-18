// const Razorpay = require('razorpay');
// const {RAZORPAY_KEY_ID ,RAZORPAY_KEY_SECRET} = process.env

// const razorpayInstance = new Razorpay({
//     key_id: RAZORPAY_KEY_ID,
//     key_secret: RAZORPAY_KEY_SECRET,
// });


// const createOrder = async(req,res)=>{
//     const amount = req.body.amount;
//     const options={
//         amount :amount,
//         currency : "INR",
//         receipt:'razorUser@gmail.com'

//     }

// razorpayInstance.orders.create(options, (err,order)=>{
//      if(!err){
//         res.status(200).send({
//             success:true,
//             msg:'Order Created',
//             order_id:order.id,
//             amount:amount,
//             key_id:RAZORPAY_KEY_ID,
//             user_name : req.body.name,

//         })
//      }
//      else{
//         res.status(400).send({success:false,msg:'Something went wrong!'})
//      }
// })
// }

// module.exports ={
//  createOrder,
 
// };