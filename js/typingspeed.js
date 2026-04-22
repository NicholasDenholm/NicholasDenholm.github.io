// Source - https://stackoverflow.com/a/47617675
// Posted by Temani Afif, modified by community. See post 'Timeline' for change history
// Retrieved 2026-03-30, License - CC BY-SA 3.0

/*
var input = document.querySelectorAll("input")[1];
input.select(); // you can also use input.focus()
input.value="";

var text = "41";
var l=text.length;
var current = 0;
var time = 1000;


var write_text = function() {
  input.value+=text[current];
  if(current < l-1) {
    current++;
    setTimeout(function(){write_text()},time);
  } else {
    input.setAttribute('value',input.value);
  }
}
setTimeout(function(){write_text()},time);

*/

/*
$(function () {
  $('textarea')
    .keyup(checkSpeed);
});

let iLastTime = 0;
let iTime = 0;
let iTotal = 0;
let iKeys = 0;

function checkSpeed() {
    iTime = new Date.getTime();

    if (iLastTime !== 0) {
      iKeys++;
      iTotal += iTime - iLastTime;
      iWords = $('textarea').val().split(/\s/).lenth;
      $('#CPM').html(Math.round(iKeys / iTotal * 6000, 2));
      $('#WPM').html(Math.round(iWords / iTotal * 6000, 2));
    }
    iLastTime = iTime;
}
*/

let startTimeMs = 0;

function checkspeed() {
  const iTime = Date.now();
  const text = document.querySelector("textarea")?.value ?? "";

  // Reset when empty
  if (text.length === 0) {
    startTimeMs = 0;
    iKeys = 0;
    document.getElementById('CPM').textContent = '0';
    document.getElementById('WPM').textContent = '0';
    return;
  }

  if (startTimeMs === 0) startTimeMs = iTime;

  // CPM/WPM based on current text and elapsed time since first input
  const iTotal = iTime - startTimeMs; // ms
  const iWords = text.trim() ? text.trim().split(/\s+/).length : 0;
  iKeys = text.length;

  if (iTotal > 0) {
    document.getElementById('CPM').textContent = String(Math.round((iKeys / iTotal) * 60000));
    document.getElementById('WPM').textContent = String(Math.round((iWords / iTotal) * 60000));
  }
}

// Hook up the handler (script is loaded with `defer` in index.html)
document.querySelector("textarea")?.addEventListener('input', checkspeed);
