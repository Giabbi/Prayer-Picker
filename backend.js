import wixData from 'wix-data';
import {fetch} from 'wix-fetch';
import cheerio from 'cheerio';

const bcrypt = require('bcrypt');
var crypto = require('crypto');

const options = {
  'suppressAuth':true
}

export function login (email, password){ // Function called in home.js
  return wixData.query('Teachers') 
  .eq('email', email)
  .find(options)
  .then((results)=> {
    if (results.items.length == 0){ // Checks for valid class code
      return 'Invalid Class'
    }
    if (bcrypt.compareSync(password, results.items[0]['password'])){ // Checks for valid password hash, if so then create session id
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


export function isValid (id){ // Check if the user is logged in for sensitive pages
    return wixData.query('Teachers')
    .eq ('sessionId',id)
    .find(options)
    .then ((results)=>{
    if (results.items[0]['sessionId'] == id && id != null && results.items[0]['sessionId'])
        return results.items[0]['email']
    else return ' '
    })
}
export function queryStudents(subject) { // Function called in students.js, queries students for repeater on frontend
    return wixData.query('Students')
    .eq ('schedule',subject)
    .find (options)
    .then ((results)=>{
        return results.items
    })
}

export function getDailyPrayer() { // Function called on students.js, scrapes the Church of England's website for daily prayers
  const url = 'https://www.churchofengland.org/prayer-and-worship/join-us-service-daily-prayer/todays-prayer';
  
  return fetch(url) // Create HTTPS request
    .then(response => response.text())
    .then(body => {
      const $ = cheerio.load(body);
      const dailyPrayer = $('#dailyprayer .inner p').first().text(); // Scrape the part with the daily prayer text and returns it to the frontend
      return dailyPrayer;
    })
    .catch(err => {
      console.error('Failed to fetch daily prayer:', err);
      return 'Error fetching prayer.';
    });
}

export function selectStudent(subject) { // Function called in students.js, picks random student and marks him accordingly
    return wixData.query("Students")
    .eq("schedule", subject) // Select students in specific class
    .find(options)
    .then((results) => {
        let newList = []
        let notAbsent = []
        var period = 0
        for (let i = 0; i < results.items.length; i++) { // Determine the period based on the stored array index
            if (results.items[0]["schedule"][i] == subject) {
                period = i
                break
            }
        }
        for(let i = 0; i < results.items.length; i++) {
            // Create list with students who did not say the prayer and are not absent
            if(!results.items[i]["hasSaidPrayer"] && !results.items[i]["isAbsent"]) newList.push(results.items[i])  
            // Create list with students who are not absent
            if(!results.items[i]["isAbsent"]) notAbsent.push(results.items[i])
        }
        let pick = 0
        if(newList.length == 0) { // If everyone has said the prayer then reset the list in the database
            return resetHasSaidPrayer(results.items, period)
                .then(() => {
                    let pick = crypto.randomInt(0, notAbsent.length);
                    let student = notAbsent[pick] // Pick a student that is not absent
                    student["hasSaidPrayer"][period] = true // Set it true to just this period
                    let buffer = {
                        "_id": student["_id"],
                        "name": student["name"],
                        "schedule": student["schedule"],
                        "hasSaidPrayer": student["hasSaidPrayer"],
                        "isAbsent": false
                    }
                    return wixData.update("Students", buffer, options) // Mark the student that has said the prayer
                    .then(() => {
                        return student["name"]
                    })
                });
        }
        else {
            pick = crypto.randomInt(0, newList.length)
            let student = newList[pick] // Pick from remaining students
            student["hasSaidPrayer"][period] = true
            let buffer = {
                "_id": student["_id"],
                "name": student["name"],
                "schedule": student["schedule"],
                "hasSaidPrayer": student["hasSaidPrayer"],
                "isAbsent": false
            }
            return wixData.update("Students", buffer, options) // Mark the student that was just picked
            .then(() => {
                return student["name"]
            })
        }
    })
}

export function resetHasSaidPrayer(students, period) { // Reset the people that said the prayer in a specific class
    const updates = students.map(student => {
        return wixData.update("Students", {
            student.hasSaidPrayer[period] = false
            "_id": student._id,
            "name": student.name,
            "schedule": student.schedule,
            "hasSaidPrayer": student.hasSaidPrayer,
            "isAbsent": student.isAbsent
        }, options);
    });
    return Promise.all(updates);
}

export function getPeriod(subject) { // Gets the current period and pass it to front-end safely
    return wixData.query("Students")
    .eq("schedule", subject)
    .find(options)
    .then((results) => {
        for (let i = 0; i < results.length; i++) {
            if(results.items[0]["schedule"][i] == subject) return i
        }
    })
}

export function markAbsent(student) { // Function called in students.js, marks absent students for the period
    return wixData.query("Students")
    .eq("name", student)
    .find(options)
    .then((results) => {
        let buffer = {
            results.items[0]["hasSaidPrayer"][period] = false
            "_id": results.items[0]["_id"],
            "name": results.items[0]["name"],
            "schedule": results.items[0]["schedule"],
            "hasSaidPrayer": results.items[0]["hasSaidPrayer"],
            "isAbsent": true
        }
        return wixData.update("Students", buffer, options)
    })
}

export function resetAbsence() { // Function called by wixJobs, every period resets absences
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

export function resetValid() { // Function called by wixJobs, every hour resets old session IDs
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
