import wixData from 'wix-data';
const bcrypt = require('bcrypt');
const options = {
  'suppressAuth':true
}
var crypto = require('crypto')

export function login (email,password){
  return wixData.query('Teachers')
  .eq('email',email)
  .find(options)
  .then((results)=> {
    if (results.items.length==0){
      return 'Invalid Email'
    }
    if (bcrypt.compareSync(password,results.items[0]['password'])){
      let buffer = {
        "_id" : results.items[0]['_id'],
        "email" : results.items[0]['email'],
        "password" : results.items[0]['password'],
        "sessionId" : crypto.randomBytes(127).toString('hex'),
        "timestamp" : Date.now()
      }
      return wixData.update('Teachers',buffer,options)
      .then(()=>{
          return buffer['sessionId']
      })
    }
    else return 'Invalid Password'
  })
}

export function isvalid (id){
  return wixData.query('Teachers')
  .eq ('sessionId',id)
  .find(options)
  .then ((results)=>{
    if (results.items[0]['sessionId'] == id && id != null && results.items[0]['sessionId'])
      return true
    else return false
  })
}