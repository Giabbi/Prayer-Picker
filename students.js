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
	queryStudents(subject)
	.then ((returntype)=>{
		$w('#repeater1').onItemReady(($item, itemData) => {
			$item('#name').text = itemData.name
		})
	})
})