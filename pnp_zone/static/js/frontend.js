/* Register modals */
let modalList = [];

let modalCreateCampaign = [
    document.getElementById("modalCreateCampaignOpen"),
    document.getElementById("modalCreateCampaignBackground"),
    document.getElementById("modalCreateCampaignClose"),
    document.getElementById("modalCreateCampaign")
];
modalList.push(modalCreateCampaign);

modalList.forEach(item => {
    item[0].addEventListener("click", function(event) {
        item[1].style.display = "flex";
    });
    item[1].addEventListener("click", function(event) {
        item[1].style.display = "none";
    });
    item[2].addEventListener("click", function(event) {
        item[1].style.display = "none";
    });
    item[3].addEventListener("click", function (event) {
        event.stopPropagation();
    });
});