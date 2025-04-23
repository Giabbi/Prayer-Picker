import wixData from 'wix-data';
import {fetch} from 'wix-fetch';
import cheerio from 'cheerio';

const bcrypt = require('bcrypt');
var crypto = require('crypto');

const options = {
    'suppressAuth':true
}

export function login (email, password){
    return wixData.query('Teachers')
    .eq('email', email)
    .find(options)
    .then((results)=> {
    if (results.items.length == 0){
        return 'Invalid Class Code'
    }
    if (bcrypt.compareSync(password, results.items[0]['password'])){

        if(bcrypt.compareSync(email, results.items[0]['password'])) return "Psw reset";

        let buffer = {
        "_id" : results.items[0]['_id'],
        "email" : results.items[0]['email'],
        "password" : results.items[0]['password'],
        "classes": results.items[0]['classes'],
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

export function resetPassword(username, oldPassword, newPassword) {
    return wixData.query("Teachers")
    .eq("email", username)
    .find(options)
    .then ((results) => {
        console.log(results)
        if ((bcrypt.compareSync(oldPassword, results.items[0]['password']))) {
            if (newPassword.length < 12) return "New password must be at least 12 characters"
            
            let numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
            for (let i = 0; i < newPassword.length; i++) {
                if (numbers.includes(newPassword[i])) {
                    break;
                }
                if (i == newPassword.length - 1) {
                    return "Password must contain a number";
                }
            }
            let specialChar = ["!", ".", "@", "?", "_"];
            for (let i = 0; i < newPassword.length; i++) {
                if (specialChar.includes(newPassword[i])) {
                    break;
                }
                if (i == newPassword.length - 1) {
                    return "Password must contain one of these special characters  \"!\", \".\", \"@\", \"?\", \"_\"";
                }
            }
            return bcrypt.hash(newPassword, 12)
            .then((hash) => {
                let buffer = {
                    _id: results.items[0]["_id"],
                    email: results.items[0]["email"],
                    password: hash,
                    sessionId: results.items[0]["sessionId"],
                    timestamp: results.items[0]["timestamp"],
                    classes: results.items[0]["classes"]
                }
                return wixData.update("Teachers", buffer, options)
                .then(() => {
                    return "Password updated successfully, please log in again with the new password"
                })
            })

        } else return "Wrong old password"
    })
}

export function isValid (id){
    return wixData.query('Teachers')
    .eq ('sessionId', id)
    .find(options)
    .then ((results)=>{
    if (results.items[0]['sessionId'] == id && id != null && results.items[0]['sessionId'])
        return results.items[0]['classes']
    else return ' '
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
        var period = 0
        for (let i = 0; i < results.items.length; i++) {
            if (results.items[0]["schedule"][i] == subject) {
                period = i
                break
            }
        }
        for(let i = 0; i < results.items.length; i++) {
            if(!results.items[i]["hasSaidPrayer"][period] && !results.items[i]["isAbsent"]) newList.push(results.items[i])
            if(!results.items[i]["isAbsent"]) notAbsent.push(results.items[i])
        }
        let pick = 0
        if(newList.length == 0) {
            return resetHasSaidPrayer(results.items, period)
                .then(() => {
                    let pick = crypto.randomInt(0, notAbsent.length);
                    let student = notAbsent[pick]
                    student["hasSaidPrayer"][period] = true
                    let buffer = {
                        "_id": student["_id"],
                        "name": student["name"],
                        "schedule": student["schedule"],
                        "hasSaidPrayer": student["hasSaidPrayer"],
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
            student["hasSaidPrayer"][period] = true
            let buffer = {
                "_id": student["_id"],
                "name": student["name"],
                "schedule": student["schedule"],
                "hasSaidPrayer": student["hasSaidPrayer"],
                "isAbsent": false
            }
            return wixData.update("Students", buffer, options)
            .then(() => {
                return student["name"]
            })
        }
    })
}

export function resetHasSaidPrayer(students, period) {
    const updates = students.map(student => {
        student.hasSaidPrayer[period] = false
        return wixData.update("Students", {
            "_id": student._id,
            "name": student.name,
            "schedule": student.schedule,
            "hasSaidPrayer": student.hasSaidPrayer,
            "isAbsent": student.isAbsent
        }, options);
    });
    return Promise.all(updates);
}

export function getPeriod(subject) {
    return wixData.query("Students")
    .eq("schedule", subject)
    .find(options)
    .then((results) => {
        for (let i = 0; i < results.items[0]["schedule"].length; i++) {
            if(results.items[0]["schedule"][i] == subject) {
                return i
            }
        }
    })
}

export function markAbsent(student, period) {
    return wixData.query("Students")
    .eq("name", student)
    .find(options)
    .then((results) => {
        results.items[0]["hasSaidPrayer"][period] = false
        let buffer = {
            "_id": results.items[0]["_id"],
            "name": results.items[0]["name"],
            "schedule": results.items[0]["schedule"],
            "hasSaidPrayer": results.items[0]["hasSaidPrayer"],
            "isAbsent": true
        }
        return wixData.update("Students", buffer, options)
    })
}

export function resetAbsence() {
  return wixData.query("Students")
    .limit(1000) // ensures we get up to 1000 records in one query
    .find(options)
    .then((results) => {
      // Create an array of updated items, making isAbsent = false
      const updatedItems = results.items.map(student => {
        return {
          ...student,          // spread the original student item
          isAbsent: false      // reset to false
        };
      });

      // Use bulkUpdate so we only do one backend call
      return wixData.bulkUpdate("Students", updatedItems, options);
    })
    .catch((error) => {
      console.error("resetAbsence bulkUpdate error:", error);
      throw error;
    });
}

export function resetValid() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000; 
    wixData.query('Teachers') 
    .le('timestamp', oneHourAgo) 
    .find(options)
    .then(results => {
      results.items.forEach(item => {
        let buffer = {
            "_id": item._id,
            "email": item["email"],
            "password": item["password"],
            "classes": item["classes"],
            "sessionId": null,
            "timestamp": null
        }
        wixData.update("Teachers", buffer, options)
        .catch(err => {
            console.error(`Error removing item ${item._id}: ${err}`);
          });
      });
    })
    .catch(err => {
      console.error(`Error querying collection: ${err}`);
    });
}