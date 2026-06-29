/* Kimmax - Core JS
   HTML component assembler + shared site behaviours
*/

// Load a script dynamically and return a promise that resolves when it's ready
function loadScript(src) {
	return new Promise(function(resolve, reject) {
		var script = document.createElement('script');
		script.src = src;
		script.onload = resolve;
		script.onerror = reject;
		document.body.appendChild(script);
	});
}

async function includeHTML() {
	const elements = [...document.querySelectorAll('[main-content]')];
	for (const el of elements) {
		const file = el.getAttribute('main-content');
		try {
			const res = await fetch(file);
			const html = res.ok ? await res.text() : '<p>Content not found.</p>';
			const temp = document.createElement('div');
			temp.innerHTML = html;
			while (temp.firstChild) {
				el.parentNode.insertBefore(temp.firstChild, el);
			}
			el.parentNode.removeChild(el);
		} catch(e) {
			el.innerHTML = 'Failed to load.';
		}
	}
}

// Run includes first, then load Phantom scripts in the correct order
includeHTML().then(async function() {
	await loadScript('assets/js/jquery.min.js');
	await loadScript('assets/js/browser.min.js');
	await loadScript('assets/js/breakpoints.min.js');
	await loadScript('assets/js/util.js');

	// Pre-move #menu to <body> before main.js runs.
	// main.js does appendTo($body) which would trigger a CSS transition flash
	// if the element moves mid-render. By doing it here with transitions
	// suppressed, main.js finds it already in place and its appendTo is a no-op.
	var menu = document.getElementById('menu');
	if (menu) {
		menu.style.transition = 'none';
		document.body.appendChild(menu);
		menu.offsetHeight; // force reflow so the suppression takes effect
		menu.style.transition = '';
	}

	await loadScript('assets/js/main.js');

	// Contact Us nav link — smooth scroll to #contact section, focus name field
	document.addEventListener('click', function(e) {
		var link = e.target.closest('a[href="#contact"]');
		if (!link) return;
		e.preventDefault();
		// Close the slide-over menu if open
		if (document.body.classList.contains('is-menu-visible')) {
			document.body.classList.remove('is-menu-visible');
		}
		var target = document.getElementById('contact');
		if (!target) return;
		var headerHeight = document.getElementById('header') ? document.getElementById('header').offsetHeight : 64;
		var top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;
		window.scrollTo({ top: top, behavior: 'smooth' });
		// Focus name field after scroll completes
		setTimeout(function() {
			var nameField = document.getElementById('name');
			if (nameField) nameField.focus();
		}, 600);
	});

	// window.load already fired before main.js was dynamically loaded,
	// so its $(window).on('load') callback never runs. Remove is-preload
	// manually to trigger the page-load tile animations.
	setTimeout(function() {
		document.body.classList.remove('is-preload');
	}, 100);
});
