    window.addEventListener('message', receiveMessage, false);

    function receiveMessage(event) {
        // if (event.origin === 'http://127.0.0.1:5500/origin1.html') {
        //alert('Received message: ' + event.data.data);
        console.log(event.data)

        // }

    }