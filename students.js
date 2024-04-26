import {isvalid,queryStudents, selectStudent, markAbsent, getDailyPrayer} from 'backend/backend.jsw';
import {session} from 'wix-storage-frontend';
import wixLocation from 'wix-location';
$w.onReady(function () {
	let id = session.getItem('id')
	isvalid(id)
	.then ((returntype)=>{
		if (returntype == ' ') wixLocation.to('/')
		else session.setItem('class',returntype)
	})
	
	let subject = session.getItem('class')
	if (subject == null) $w('#section1').hide()
	$w('#text4').text = "Students in " + subject
	queryStudents(subject)
	.then((results)=>{
		populateRepeater(results)
	})
});

export function populateRepeater(results) {
	$w('#repeater1').onItemReady(($item, itemData) => {
		$item('#name').text = itemData.name
		if(itemData.hasSaidPrayer) $item("#hasSaidPrayerText").text = itemData.name +" has already said the prayer"
		else $item("#hasSaidPrayerText").text = itemData.name +" has not said the prayer yet"
		if(itemData.isAbsent) $item("#isAbsentText").text = itemData.name + " was marked absent for this period"
		else $item("#isAbsentText").text = itemData.name + " is marked as present for this period"
	})
	$w('#repeater1').data = results
	$w('#repeater1').show()
	$w('#text7').hide()
}

export function random_click(event) {
	let subject = session.getItem("class")
	selectStudent(subject)
	.then((results) => {
		$w('#random').hide()
		$w('#resultText').text = "The student who says the prayer today is " + results
		session.setItem("pick", results)
		$w('#absent').show()
		
		$w('#text8').show()
		getDailyPrayer()
		.then((prayer) => {
			$w('#text6').show()
			$w('#prayer').text = prayer
			$w('#prayer').show()
			$w('#text8').hide()
		})
		queryStudents(subject)
		.then((students) => {
			populateRepeater(students)
		})
	})
}

export function absent_click(event) {
	$w('#absent').disable()
	$w('#text9').show()
	let student = $w('#resultText').text.slice(41) 
	markAbsent(student)
	.then(() => {
		let subject = session.getItem("class")
		selectStudent(subject)
		.then((results) => {
			$w('#resultText').text = "The student who says the prayer today is " + results
			$w('#absent').enable()
			$w('#text9').hide()
			queryStudents(subject)
			.then((students) => {
				populateRepeater(students)
			})
		})
	})
}
