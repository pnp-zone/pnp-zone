function endPreloader() {
    const preloader = document.querySelector(".preloader");
    if (preloader === null) {
        return;
    }
    preloader.style.opacity = 0;
    preloader.style.transition = "opacity ease-in-out 200ms";
    setTimeout(function(){
        preloader.style.display = "none";
    }, 200);
}

window.onload = function () {
    endPreloader();
}