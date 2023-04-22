function showPopup() {
    if (!confirm('create class call?')) return;

    window.location.href = `http://143.42.228.48:3000/room/${window.location.href.split('/')[4]}`;
}

function joinCall() {
    window.location.href = `http://143.42.228.48:3000/room/${window.location.href.split('/')[4]}`;
}