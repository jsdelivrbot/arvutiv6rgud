var socket = io.connect(window.location.href);
var subscribed = localStorage.getItem('subscribed') !== null && localStorage.getItem('subscribed').toLowerCase() === 'true';

function subscribe() {
    subscribed = true;
    localStorage.setItem('subscribed', 'true');
}

function unsubscribe() {
    subscribed = false;
    localStorage.setItem('subscribed', 'false');
}

function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + hour + ':' + min;
    return time;
}

socket.on('update', function(data) {
    console.log(data);
    $("#updTS").html(timeConverter(data.updTS));
    $("#modTS").html(timeConverter(data.modTS));
    if (data.updated && subscribed) {
        console.log('updated');
    }
});

socket.on('online', function(data) {
    console.log(data);
    $("#online").html(data.online);
});