// Load Past event divs
function loadPastEvents(pageNo = 1) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `events/pages/page${pageNo}.html`, true);
    xhr.onload = function () {
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

// Load page 1 by default when document is ready
document.addEventListener('DOMContentLoaded', () => {
    loadPastEvents();

        });