/* Register modals */
let modalList = [];

let modalCreateCampaign = [
    document.getElementById("modalCreateCampaignOpen"),
    document.getElementById("modalCreateCampaignBackground"),
    document.getElementById("modalCreateCampaignClose"),
    document.getElementById("modalCreateCampaign")
];
modalList.push(modalCreateCampaign);

let modalJoinBBB = [
    document.getElementById("modalJoinBBBOpen"),
    document.getElementById("modalJoinBBBBackground"),
    document.getElementById("modalJoinBBBClose"),
    document.getElementById("modalJoinBBB")
];
modalList.push(modalJoinBBB);

modalList.forEach(item => {
    if (item[0] !== null) {
        item[0].addEventListener("click", function(event) {
            item[1].style.display = "flex";
        });
    }
    if (item[1] !== null) {
        item[1].addEventListener("click", function(event) {
            item[1].style.display = "none";
        });
    }
    if (item[2] !== null) {
        item[2].addEventListener("click", function(event) {
            item[1].style.display = "none";
        });
    }
    if (item[3] !== null) {
        item[3].addEventListener("click", function (event) {
            event.stopPropagation();
        });
    }
});