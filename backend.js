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
export function queryStudents(subject) {
    return wixData.query('Students')
    .eq ('schedule',subject)
    .find (options)
    .then ((results)=>{
        return results.items
    })
}

export function getDailyPrayer() {
  const url = 'https://www.churchofengland.org/prayer-and-worship/join-us-service-daily-prayer/todays-prayer';
  
  return fetch(url)
    .then(response => response.text())
    .then(body => {
      const $ = cheerio.load(body);
      const dailyPrayer = $('#dailyprayer .inner p').first().text(); 
      return dailyPrayer;
    })
    .catch(err => {
      console.error('Failed to fetch daily prayer:', err);
      return 'Error fetching prayer.';
    });
}

export function selectStudent(subject) {
    return wixData.query("Students")
    .eq("schedule", subject)
    .find(options)
    .then((results) => {
        let newList = []
        let notAbsent = []
        for(let i = 0; i < results.items.length; i++) {
            if(!results.items[i]["hasSaidPrayer"] && !results.items[i]["isAbsent"]) newList.push(results.items[i])
            if(!results.items[i]["isAbsent"]) notAbsent.push(results.items[i])
        }
        let pick = 0
        if(newList.length == 0) {
            return resetHasSaidPrayer(results.items)
                .then((updates) => {
                    console.log(updates)
                    let pick = crypto.randomInt(0, results.items.length);
                    let student = notAbsent[pick]
                    let buffer = {
                        "_id": student["_id"],
                        "name": student["name"],
                        "schedule": student["schedule"],
                        "hasSaidPrayer": true,
                        "isAbsent": false
                    }
                    return wixData.update("Students", buffer, options)
                    .then(() => {
                        return student["name"]
                    })
                });
        }
        else {
            pick = crypto.randomInt(0, newList.length)
            let student = newList[pick]
            let buffer = {
                "_id": student["_id"],
                "name": student["name"],
                "schedule": student["schedule"],
                "hasSaidPrayer": true,
                "isAbsent": false
            }
            return wixData.update("Students", buffer, options)
            .then(() => {
                return student["name"]
            })
        }
    })
}

export function resetHasSaidPrayer(students) {
    const updates = students.map(student => {
        return wixData.update("Students", {
            "_id": student._id,
            "name": student.name,
            "schedule": student.schedule,
            "hasSaidPrayer": false,
            "isAbsent": student.isAbsent
        }, options);
    });
    return Promise.all(updates);
}

export function markAbsent(student) {
    console.log(student)
    return wixData.query("Students")
    .eq("name", student)
    .find(options)
    .then((results) => {
        let buffer = {
            "_id": results.items[0]["_id"],
            "name": results.items[0]["name"],
            "schedule": results.items[0]["schedule"],
            "hasSaidPrayer": false,
            "isAbsent": true
        }
        return wixData.update("Students", buffer, options)
    })
}

export function resetAbsence() {
    return wixData.query("Students")
    .find(options)
    .then((results) => {
        const updates = results.items.map(student => {
        return wixData.update("Students", {
            "_id": student._id,
            "name": student.name,
            "schedule": student.schedule,
            "hasSaidPrayer": student.hasSaidPrayer,
            "isAbsent": false
        }, options);
    });
    return Promise.all(updates);
    })
}
