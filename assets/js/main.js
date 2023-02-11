// desktop nav bar link selection
var header = document.getElementById("header");
var nav_items = header.getElementsByClassName("nav-item");
for (var i = 0; i < nav_items.length; i++) {
  nav_items[i].addEventListener("click", function() {
  var current = document.getElementsByClassName("prsnt");
  current[0].className = current[0].className.replace(" prsnt", "");
  this.className += " prsnt";
  });
}

// mobile nav bar slider
// const navigation = document.querySelector('.navigation');
// const navContainer = document.querySelector('.nav-container');
// document.querySelector('.nav-btn').onclick = function(){
//     this.classList.toggle('active');
//     naviContainer.classList.toggle('active')
// }
// mobile nav bar slider (above code has another logic)
function openNav() {
    const navContainer = document.querySelector('.nav-container');
    const closeBtn = document.querySelector('.closebtn');
    navContainer.classList.toggle('active')
    closeBtn.classList.toggle('active')
}
function closeNav() {
    const navContainer = document.querySelector('.nav-container');
    const closeBtn = document.querySelector('.closebtn');
    navContainer.classList.toggle('active')
    closeBtn.classList.toggle('active')
}



function showEvent_1_Details() {
  let blur = document.getElementById('blur');
  blur.classList.toggle('active')
  let popup = document.getElementById('pop-up1');
  popup.classList.toggle('active')
  let html = document.getElementById('html');
  html.classList.toggle('active')
}