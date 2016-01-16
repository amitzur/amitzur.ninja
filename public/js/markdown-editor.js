var $ = document.querySelector.bind(document);
Element.prototype.on = Element.prototype.addEventListener;

var $md = $(".area.md"),
	$html = $(".area.html"),
	$style= $(".area.style"),
	$mdTextbox = $(".area.md textarea"),
	$styleTextbox = $(".area.style textarea"),
	$userStyle = document.createElement("style");

$userStyle.id = "user-style";
document.head.appendChild($userStyle);

function updateMarkdown() {
	var v = $mdTextbox.value;
	$html.innerHTML = marked(v);
	// console.log(v);
	localStorage.setItem("markdown-text", v);
}

function updateStyle() {
	var v = $styleTextbox.value;
	$userStyle.textContent = v; // TODO wrap
	// console.log(v);
	localStorage.setItem("markdown-style", v);
}
  
$mdTextbox.on("keyup", updateMarkdown);
$styleTextbox.on("keyup", updateStyle);

$mdTextbox.textContent = localStorage.getItem("markdown-text");
updateMarkdown();

$styleTextbox.textContent = localStorage.getItem("markdown-style");
updateStyle();
$mdTextbox.focus();