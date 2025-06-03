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


function showEvent_2_Details() {
  let blur = document.getElementById('blur');
  blur.classList.toggle('active')
  let popup = document.getElementById('pop-up2');
  popup.classList.toggle('active')
  let html = document.getElementById('html');
  html.classList.toggle('active')
}

function showEvent_3_Details() {
  let blur = document.getElementById('blur');
  blur.classList.toggle('active')
  let popup = document.getElementById('pop-up3');
  popup.classList.toggle('active')
  let html = document.getElementById('html');
  html.classList.toggle('active')
}


function showEvent_4_Details() {
  let blur = document.getElementById('blur');
  blur.classList.toggle('active')
  let popup = document.getElementById('pop-up4');
  popup.classList.toggle('active')
  let html = document.getElementById('html');
  html.classList.toggle('active')
}




function showEvent_5_Details() {
  let blur = document.getElementById('blur');
  blur.classList.toggle('active')
  let popup = document.getElementById('pop-up5');
  popup.classList.toggle('active')
  let html = document.getElementById('html');
  html.classList.toggle('active')
}


function showEvent_6_Details() {
  let blur = document.getElementById('blur');
  blur.classList.toggle('active')
  let popup = document.getElementById('pop-up6');
  popup.classList.toggle('active')
  let html = document.getElementById('html');
  html.classList.toggle('active')
}


function showEvent_7_Details() {
  let blur = document.getElementById('blur');
  blur.classList.toggle('active')
  let popup = document.getElementById('pop-up7');
  popup.classList.toggle('active')
  let html = document.getElementById('html');
  html.classList.toggle('active')
}



function showEvent_8_Details() {
  let blur = document.getElementById('blur');
  blur.classList.toggle('active')
  let popup = document.getElementById('pop-up8');
  popup.classList.toggle('active')
  let html = document.getElementById('html');
  html.classList.toggle('active')
}


// Load Past event divs
$(document).ready(function() {
  $.get("events/pages/page-count.txt", function(data) {
    const pageCount = parseInt(data.trim(), 10);

    for(let i=1; i<=pageCount; i++) {
      $.get(`events/pages/page${i}.html`, function(pastEvent) {
        
        $('#past-content').append(pastEvent);
      })
    }
  });
});
		