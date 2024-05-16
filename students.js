import {isvalid,queryStudents, selectStudent, markAbsent, getDailyPrayer, getPrayer} from 'backend/backend.jsw';
import {session} from 'wix-storage-frontend';
import wixLocation from 'wix-location';

$w.onReady(function () {
	let id = session.getItem('id')
	isValid(id) // Check if user is logged in
	.then ((results)=>{
		if (results == ' ') wixLocation.to('/')
		else {
			session.setItem('class', results)
			$w('#text4').text = "Students in " + results
			queryStudents(results)
			.then((results1)=>{
				getPeriod(results1)
				.then((period) => {
					populateRepeater(results1, period) // Gets students from database and populate repeater
				})
			})
		}
	})
});

export function populateRepeater(results, period) {
	$w('#repeater1').onItemReady(($item, itemData) => {
		$item('#name').text = itemData.name
		if(itemData.hasSaidPrayer[period]) $item("#hasSaidPrayerText").text = "Has already said the prayer"
		else $item("#hasSaidPrayerText").text = "Has not said the prayer yet"
		if(itemData.isAbsent) $item("#isAbsentText").text = "Student is marked as Absent"
		else $item("#isAbsentText").text = "Student is marked as Here"
	})
	$w('#repeater1').data = results
	$w('#repeater1').show()
	$w('#text7').hide()
}

export function random_click(event) {
	let subject = session.getItem("class")
	selectStudent(subject) // Gets random student from backend
	.then((results) => {
		$w('#random').hide()
		$w('#resultText').text = "The student who says the prayer today is " + results
		session.setItem("pick", results)
		$w('#absent').show()
		
		$w('#text8').show()
		getDailyPrayer() // Scrape daily prayer (function in backend)
		.then((prayer) => {
			$w('#text6').show()
			$w('#prayer').text = prayer
			$w('#prayer').show()
			$w('#text8').hide()
		})
		queryStudents(subject) // Update the repeater
		.then((students) => {
			populateRepeater(students)
		})
	})
}

export function absent_click(event) { // Re-roll student in case he/she is absent
	$w('#absent').disable()
	$w('#text9').show()
	let student = $w('#resultText').text.slice(41) 
	let subject = session.getItem("class")
	getPeriod(subject)
	.then((period)=> {
		markAbsent(student, period)
		.then(() => {		
			selectStudent(subject)
			.then((results) => {
				$w('#resultText').text = "The student who says the prayer today is " + results
				$w('#absent').enable()
				$w('#text9').hide()
				queryStudents(subject)
				.then((students) => {
					populateRepeater(students, period)
				})
			})
		})
	})
}
