// main window resize

// window size beginning 
let winheight = 100;
let winsize = 100;
let win2;
// window resize amount over time
let x = 5;
// stores url to be loaded into window
let temploc;
let openAviaryButton;

window.onload = (event) => {
  console.log('page loaded')

  openAviaryButton = document.getElementById('openAviaryButton');

  openAviaryButton.addEventListener('click', () => {
    console.log('Aviary Opened!');
    openAviary()
  })
  // runP5();
}

function openAviary() {
  if (!(window.resizeTo && document.all) && !(window.resizeTo && document.getElementById)) {
    window.open();
    return;
  }
  win2 = window.open("aviary.html", "", "scrollbars");
  win2.moveTo(0, 0);
  win2.resizeTo(100, 100);
  // go2();
}



function go2() {
  if (winheight >= screen.availHeight - 3) {
    x = 0;
  }
  win2.resizeBy(5, x);
  winheight += 5;
  winsize += 5;
  if (winsize >= screen.width - 5) {
    // win2.location = temploc;
    winheight = 100;
    winsize = 100;
    x = 5;
    return;
  }
  setTimeout(go2, 50);
}