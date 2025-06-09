let currentPage = 1;
let totalPages = 0;  

// Load Past event divs
function loadPastEvents(pageNo=1) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `events/pages/page${pageNo}.html`, true);
    xhr.onload = function () {
        console.log(xhr.status);
        if (xhr.status === 200) {
            document.getElementById('past-content').innerHTML = xhr.responseText;

            // past events
            new Swiper(".mySwiper2", {
                slidesPerView: 'auto',
                spaceBetween: 0,
                centeredSlides: false,
                pagination: {
                    el: ".swiper-pagination",
                    clickable: true
                },
            });
        }
    };
    xhr.send();
}

function createPageNumbers() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'events/pages/page-count.txt');
    xhr.onload = function () {
        if(xhr.status ===200) {
            totalPages = parseInt(xhr.responseText.trim());
            renderPagination();
        }
    };
    xhr.send();
}


// Render <1 2 3> pagination
function renderPagination() {
  const menu = document.getElementById('pagination');
  menu.innerHTML = '';

  let range = [];
  if (totalPages <= 3) {
    for (let i = 1; i <= totalPages; i++) range.push(i);
  } else {
    if (currentPage ===1) range = [1, 2, 3];
    else if (currentPage === totalPages) range = [totalPages - 2, totalPages - 1, totalPages];
    else range = [currentPage - 1, currentPage, currentPage + 1];
  }

  //previous arrow
  const prevLi = document.createElement('li');
  const prevA = document.createElement('a');
  prevA.href = "#";
  prevA.textContent = '<';
  prevA.onclick = function (e) {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      loadPastEvents(currentPage);
      renderPagination();
      scrollToHeading();
    }
  };
  prevLi.appendChild(prevA);
  menu.appendChild(prevLi);

  //dynamic loading of pag e numbers
    for (let i of range) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = "#";
    a.textContent = i;
    if (i === currentPage) a.classList.add('active');
    a.onclick = function (e) {
      e.preventDefault();
      currentPage = i;
      loadPastEvents(currentPage);
      renderPagination();
      scrollToHeading();
    };
    li.appendChild(a);
    menu.appendChild(li);
  }

  //next arrow
  const nextLi = document.createElement('li');
  const nextA = document.createElement('a');
  nextA.href = "#";
  nextA.textContent = '>';
  nextA.onclick = function (e) {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      loadPastEvents(currentPage);
      renderPagination();
      scrollToHeading();
    }
  };
  nextLi.appendChild(nextA);
  menu.appendChild(nextLi);


}

//for scrolling up to the heading PAST EVENTS on click
function scrollToHeading() {
  document.getElementById('past-events-heading').scrollIntoView({ behavior: 'smooth' });
}


document.addEventListener('DOMContentLoaded', ()=> {
  loadPastEvents();
  createPageNumbers();
});
