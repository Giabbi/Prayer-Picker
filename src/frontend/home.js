import {login} from 'backend/backend.jsw';
import wixLocation from 'wix-location';
import {session} from 'wix-storage-frontend';

let isHidden = true

$w.onReady(function () {
	$w('#email').onKeyPress((event) => {
		if(event.key == "Enter") enter_click()
	})
	$w('#password').onKeyPress((event) => {
		if (event.key == "Enter") enter_click()
	})
});

export function enter_click(event) {
	$w('#enter').disable()
	$w('#email').disable()
	$w('#password').disable()
	$w('#image2').show()
	let email = $w('#email').value
	let password = $w('#password').value
	login(email,password)
	.then((isValid) => {
		if (isValid === 'Invalid Class Code' || isValid === 'Invalid Password'){
			$w('#enter').enable()
			$w('#email').enable()
			$w('#password').enable()
			$w('#image2').hide()
			$w('#text1').show()
			$w('#text1').text = isValid
		}
		else if(isValid === 'Psw reset') {
			session.setItem("username", $w('#email').value);
			wixLocation.to("/passwordreset")
		}
		else {
			session.setItem('id', isValid)
			wixLocation.to('/students')
		}
	}) 
}

$w('#text6').onClick((event) => {
    if(isHidden) {
		$w('#password').inputType = "text"
		$w('#text6').text = "Hide"
		isHidden = false
	} else {
		$w('#password').inputType = "password"
		$w('#text6').text = "Show"
		isHidden = true
	}
})