$(document).ready(function() {
    var socket = io.connect(window.location.href);
    var subscribed = localStorage.getItem('subscribed') !== null && localStorage.getItem('subscribed').toLowerCase() === 'true';

    function setSubscStatus(newSubscriptionStatus) {
        // in case if user manually denies access
        if (Notification.permission == 'denied') {
            newSubscriptionStatus = false;
        }
        subscribed = newSubscriptionStatus;
        if (subscribed) {
            $("#sub").find('text').html('Ei taha teavitusi!');
            localStorage.setItem('subscribed', 'true');
        } else {
            $("#sub").find('text').html('Teavita mind!');
            localStorage.setItem('subscribed', 'false');
        }
    }
    setSubscStatus(subscribed);

    $("#sub").click(function() {
        if (!Notification) {
            console.log('Desktop notifications not available in your browser. Try Chromium.');
        }

        if (Notification.permission !== "granted") {
            if (Notification.permission == 'denied') {
                $("#notif").show();
            }
            Notification.requestPermission().then(permission => {
                if (permission == 'granted') {
                    setSubscStatus(true);
                } else {
                    $("#notif").show();
                    setSubscStatus(false);
                }
            });
        } else {
            // just invert subsription status
            setSubscStatus(!subscribed);
        }
    });

    $(".close").click(function() {
        $("#notif").hide();
    });

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
            if (Notification && Notification.permission == "granted") {
                let n = new Notification('Arvutivõrgud', {
                    icon: window.location.href + '/cancer.png',
                    body: "Ehhee... Tulemused on uuendatud!",
                });
                n.onclick = function() {
                    window.open('https://www.ttu.ee/public/i/infotehnoloogia-teaduskond/Instituudid/automaatikainstituut/oppeained/ReinP/Kontrollerid/ISP0040_Hinne_nimedeta_2017_kevad.pdf', 'Results').focus();
                    n.close();
                };
            } else {
                console.log('cant send notification');
            }
        }
    });

    socket.on('online', function(data) {
        console.log(data);
        $("#online").html(data.online);
    });
});