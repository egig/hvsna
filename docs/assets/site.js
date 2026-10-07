// Minimal progressive enhancement for the static site: mobile menu, help sidebar dropdown, back to top.
(function () {
  var ICON_X = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';

  // Mobile header menu: reuses the About and Download links already in the header.
  var menuBtn = document.querySelector('header button[aria-label="Toggle menu"]');
  if (menuBtn) {
    var menuIcon = menuBtn.innerHTML;
    var menu = null;
    menuBtn.addEventListener("click", function () {
      if (menu) {
        menu.remove();
        menu = null;
        menuBtn.innerHTML = menuIcon;
        return;
      }
      var header = menuBtn.closest("header");
      var about = header.querySelector("nav a");
      var download = header.querySelector('a[href$="/download"]');
      menu = document.createElement("div");
      menu.className = "md:hidden py-4 border-t border-gray-200 dark:border-gray-700";
      var nav = document.createElement("nav");
      nav.className = "flex flex-col space-y-4";
      if (about) {
        var a = document.createElement("a");
        a.href = about.getAttribute("href");
        a.textContent = about.textContent;
        a.className = "text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors outline-none";
        nav.appendChild(a);
      }
      if (download) {
        var d = download.cloneNode(true);
        d.className = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700";
        nav.appendChild(d);
      }
      menu.appendChild(nav);
      menuBtn.closest(".max-w-3xl, .max-w-6xl").appendChild(menu);
      menuBtn.innerHTML = ICON_X;
    });
  }

  // Help sidebar dropdown (mobile/tablet): reuses the desktop link list.
  var sideBtn = document.querySelector("button[aria-expanded]");
  if (sideBtn) {
    var panel = null;
    sideBtn.addEventListener("click", function () {
      var open = !panel;
      sideBtn.setAttribute("aria-expanded", String(open));
      sideBtn.querySelector("svg").classList.toggle("rotate-180", open);
      if (!open) {
        panel.remove();
        panel = null;
        return;
      }
      var list = sideBtn.closest("nav").querySelector("div.lg\\:block ul");
      panel = document.createElement("div");
      panel.className = "mt-2 max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 p-2";
      panel.appendChild(list.cloneNode(true));
      sideBtn.parentNode.appendChild(panel);
    });
  }

  var top = document.querySelector('button[aria-label="Back to top"]');
  if (top) top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
})();
