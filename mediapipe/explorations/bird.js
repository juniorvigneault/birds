let allBirdImages;
let birdsDetected;
let birdImage;


window.onload = () => {
    birdImage = document.querySelector('#bird_image');

    window.addEventListener('message', receiveMessage, false);


    function receiveMessage(event) {

        let bird = event.data
        console.log(bird)

        birdImage.src = bird




    }
}