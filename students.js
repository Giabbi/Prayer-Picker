import {isValid, queryStudents, selectStudent, markAbsent, getDailyPrayer, getPeriod} from 'backend/backend.jsw';
import {session} from 'wix-storage-frontend';
import wixLocation from 'wix-location';

$w.onReady(function () {
	let id = session.getItem('id')
	isValid(id)
	.then ((results)=>{
		if (results == ' ' || results == undefined || results == null) wixLocation.to('/notlogged')
		else {
			$w('#classSelection').options = prepareDataForDropdown(results);
		}
	})
});

export function prepareDataForDropdown(classes) {
		return classes.map(classItem => {
			return {
				label: classItem,  
				value: classItem   
			};
		});
}

export function populateRepeater(results, period) {
	let subject = session.getItem("class")
	$w('#repeater1').onItemReady(($item, itemData) => {
		$item('#name').text = itemData.name
		if(itemData.hasSaidPrayer[period]) $item("#hasSaidPrayerText").text = "Has already said the prayer"
		else $item("#hasSaidPrayerText").text = "Has not said the prayer yet"
		if(itemData.isAbsent) {
			if(subject === "Upper School all Hands") $item("#isAbsentText").text = "Staff member is marked as Absent"
			else $item("#isAbsentText").text = "Student is marked as Absent"
		}
		else {
			if (subject === "Upper School all Hands") $item("#isAbsentText").text = "Staff member is marked as Here"
			else $item("#isAbsentText").text = "Student is marked as Here"
		}
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
		if (subject === "Upper School all Hands") $w('#resultText').text = "The staff member who says the prayer today is " + results
		else $w('#resultText').text = "The student who says the prayer today is " + results
		session.setItem("pick", results)
		$w('#absent').show()
		
		$w('#text8').show()
		getDailyPrayer()
		.then((prayer) => {
			$w('#text6').show()
			$w('#prayer').text = prayer
			$w('#prayer').show()
			$w('#text8').hide()
			queryStudents(subject)
			.then((students) => {
				getPeriod(subject)
				.then((period) => {
					populateRepeater(students, period)
				})
			})
		})
	})
}

export function absent_click(event) {
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
				if (subject === "Upper School all Hands") $w('#resultText').text = "The staff member who says the prayer today is " + results
				else $w('#resultText').text = "The student who says the prayer today is " + results
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

$w('#classSelection').onChange((event) => {
    let subject = $w('#classSelection').value    
	session.setItem('class', subject)
	if (subject === "Upper School all Hands") {
		$w('#text4').text = "Staff in " + subject
		$w('#resultText').text = "Pick a staff member to say the prayer"
		$w('#random').label = "Pick Random Staff"
		$w('#absent').label = "Staff member is absent"
	} else {
		$w('#text4').text = "Students in " + subject
		$w('#resultText').text = "Pick a student to say the prayer"
		$w('#random').label = "Pick Random Student"
		$w('#absent').label = "Student is absent (reroll)"
	}
	$w('#section2').show()
	$w('#section1').show()
	queryStudents(subject)
	.then((results1)=>{
		getPeriod(subject)
		.then((period) => {
			populateRepeater(results1, period)
		})
	})
})