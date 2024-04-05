window.onmessage = function (event) {
    // Retrieve the image path from the message data
    let imagePath = event.data.path;

    // Find the existing img element in the document
    let img = document.querySelector('img');

    // Set the src attribute of the existing img element to the received image path
    img.src = imagePath;
    console.log(img);
};