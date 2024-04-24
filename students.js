import {isvalid,queryStudents} from 'backend/mastercode.web';
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
		$w('#repeater1').onItemReady(($item, itemData) => {
			$item('#name').text = itemData.name
		})
		$w('#repeater1').data = results
	})
});

export function random_click(event) {
	let subject = session.getItem("class")
	selectStudent(subject)
	.then((results) => {
		$w('#random').hide()
		$w('#resultText').text = "The student who says the prayer today is " + results
		session.setItem("pick", results)
		$w('#resultText').show()
	})
}

export function absent_click(event) {
	let student = session.getItem("pick")
	markAbsent(student)
	let subject = session.getItem("class")
	selectStudent(subject)
	.then((results) => {
		$w('#resultText').text = "The new student is " + results
	})
}
