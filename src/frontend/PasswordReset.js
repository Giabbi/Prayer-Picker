import wixLocation from 'wix-location';
import {session} from 'wix-storage-frontend';
import {resetPassword} from 'backend/backend.jsw';

let isHiddenOld = true
let isHiddenNew = true

$w.onReady(function () {
	let username = session.getItem("username")

	if (username == null) wixLocation.to("/")

});

$w('#reset').onClick((event) => {
    resetPassword(session.getItem("username"), $w('#oldPassword').value, $w('#newPassword').value)
	.then((results) => {
		if(results === "Password updated successfully, please log in again with the new password") {
			$w('#error').hide()
			$w('#success').show()
			setTimeout(()=>{wixLocation.to("/")}, 5000)		
		} else {
			$w('#error').text = results
			$w('#error').show()
		}
	})
})

$w('#text6').onClick((event) => {
    if(isHiddenOld) {
		$w('#oldPassword').inputType = "text"
		$w('#text6').text = "Hide"
		isHiddenOld = false
	} else {
		$w('#oldPassword').inputType = "password"
		$w('#text6').text = "Show"
		isHiddenOld = true
	}
})

$w('#text5').onClick((event) => {
    if(isHiddenNew) {
		$w('#newPassword').inputType = "text"
		$w('#text5').text = "Hide"
		isHiddenNew = false
	} else {
		$w('#newPassword').inputType = "password"
		$w('#text5').text = "Show"
		isHiddenNew = true
	}
})