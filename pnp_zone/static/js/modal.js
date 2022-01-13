function showModal(query) {
    document.querySelector("#modals > .background").style.display = "";
    if (Number.isInteger(query)) {
        document.querySelector(`#modals > .background > .modal > *:nth-child(${query+2})`).style.display = "";
    } else {
        console.error("Not Implemented Yet");
    }
}

function hideModal() {
    document.querySelector("#modals > .background").style.display = "none";
}
