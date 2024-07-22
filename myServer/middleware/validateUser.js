const bcrypt  = require("bcrypt");
require("dotenv").config();


//Validate API secret key

const validateApiSecret = (req,res,next) =>{

  // Checking if the API secret key is provided
  if(req.header('validationKey') == "" || req.header('validationKey') == undefined){
    return res.status(401).json({
      status:false,      
      message:"Don't have authority to access"
    });
  }

  const validationToken = req.header('validationKey').replace('Bearer','');
  

  //Checking if the API secret key is valid
  bcrypt.compare(validationToken,process.env.api_secret_key, function(e, result) {
    if(e){
      return res.status(401).json({
        status:false,
        message:"Invalid API validation key",
        error: e
      });
    }
    if(!result){
      return res.status(401).json({
        status:false,
        message:"Invalid API validation key"
      });
    }
    else{
     next(); 
    }
  });
} 
module.exports = validateApiSecret;