const togglePassword = document.getElementById("showPassword");
const password = document.getElementById("password");
togglePassword.addEventListener("click", function (e) {
   password.setAttribute("type", password.getAttribute("type") === "password" ? "text" : "password");
});