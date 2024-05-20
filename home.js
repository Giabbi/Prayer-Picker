import {login} from 'backend/mastercode.web';
import wixLocation from 'wix-location';
import {session} from 'wix-storage-frontend';

$w.onReady(function () {
	$w('#email').onKeyPress((event) => { // Event listener for enter key on class code field
		if(event.key == "Enter") enter_click()
	})
	$w('#password').onKeyPress((event) => { // Event listener for enter key on password field
		if (event.key == "Enter") enter_click()
	})
});

export function enter_login(event) {
	$w('#enter').disable()
	$w('#email').disable()
	$w('#password').disable()
	$w('#image2').show() // Show loading gif
	let email= $w('#email').value
	let password= $w('#password').value
	login(email,password)
	.then((isValid) => {
		if (isValid == 'Invalid Class Code' || isValid == 'Invalid Password'){
			$w('#enter').enable()
			$w('#email').enable()
			$w('#password').enable()
			$w('#image2').hide()
			$w('#text1').show()
			$w('#text1').text = isValid
		}
		else {
			session.setItem('id', isValid) // Set session id
			wixLocation.to('/students')
		}
	})

}
