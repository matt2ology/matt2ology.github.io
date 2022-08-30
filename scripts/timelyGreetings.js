var today = new Date();
var hourNow = today.getHours();
var greeting;

if (hourNow > 18) {
    greeting = 'Good evening, everyone!';
} else if (hourNow > 12) {
    greeting = 'Good afternoon, everyone!';
} else if (hourNow > 0) {
    greeting = 'Good morning, everyone!';
} else {
    greeting = 'Welcome, everyone!';
}

document.write('<strong>' + greeting + '</strong>');