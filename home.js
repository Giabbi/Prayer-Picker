import {login} from 'backend/mastercode.web';
import wixLocation from 'wix-location';
import {session} from 'wix-storage-frontend';

export function enter_login(event) {
	$w('#enter').disable()
	let email=$w('#email').value
	let password=$w('#password').value
	login(email,password)
	.then((isValid) => {
		if (isValid == 'Invalid Email'||isValid == 'Invalid Password'){
			$w('#text1').show()
			$w('#text1').text = isValid
		}
		else {
			session.setItem('id',isValid)
			wixLocation.to('/new-page')
		}
	})

}