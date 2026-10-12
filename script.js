/* roman — страница цен: калькулятор, бургер-меню, sticky-бар, год в футере. */
(function () {
	'use strict';

	/* ─── Год в футере ─── */
	var yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = String(new Date().getFullYear());

	/* ─── Бургер-меню ─── */
	var burger = document.getElementById('nav-burger');
	var links = document.getElementById('nav-links');
	if (burger && links) {
		burger.addEventListener('click', function () {
			var open = links.classList.toggle('is-open');
			burger.setAttribute('aria-expanded', open ? 'true' : 'false');
		});
		links.addEventListener('click', function (ev) {
			if (ev.target.tagName === 'A') {
				links.classList.remove('is-open');
				burger.setAttribute('aria-expanded', 'false');
			}
		});
	}

	/* ─── Sticky-бар: прянем, когда виден финальный блок ─── */
	var sticky = document.getElementById('sticky-bar');
	var final = document.getElementById('contact');
	if (sticky && final && 'IntersectionObserver' in window) {
		new IntersectionObserver(function (entries) {
			sticky.style.opacity = entries[0].isIntersecting ? '0' : '1';
			sticky.style.pointerEvents = entries[0].isIntersecting ? 'none' : '';
			sticky.style.transition = 'opacity 0.25s';
		}, { threshold: 0.2 }).observe(final);
	}

	/* ─── Калькулятор-визард ─── */
	var wizard = document.getElementById('calc-wizard');
	if (!wizard) return;

	var steps = wizard.querySelectorAll('.calc-step');
	var bar = document.getElementById('calc-bar');
	var stepNum = document.getElementById('calc-step-num');
	var current = 1;

	function show(n) {
		current = Math.min(Math.max(n, 1), steps.length);
		for (var i = 0; i < steps.length; i++) {
			steps[i].classList.toggle('is-active', Number(steps[i].getAttribute('data-step')) === current);
		}
		if (bar) bar.style.width = (current / steps.length) * 100 + '%';
		if (stepNum) stepNum.textContent = String(current);
		// Прокрутка к калькулятору, чтобы после «Далее» не терялся контекст
		var top = wizard.getBoundingClientRect().top;
		if (top < 0 || top > window.innerHeight * 0.4) {
			wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function formatRub(n) {
		// 123456 → «123 456 ₽» с неразрывными пробелами
		return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0') + '\u00A0₽';
	}

	function formatDays(d) {
		var n = Math.max(1, Math.round(d));
		var last = n % 10, last2 = n % 100;
		var word = 'дней';
		if (last === 1 && last2 !== 11) word = 'день';
		else if (last >= 2 && last <= 4 && (last2 < 12 || last2 > 14)) word = 'дня';
		return n + ' ' + word;
	}
	function calc() {
		var type = wizard.querySelector('input[name="calc-type"]:checked');
		var speed = wizard.querySelector('input[name="calc-speed"]:checked');
		var extras = wizard.querySelectorAll('input[name="calc-extra"]:checked');

		var base = type ? Number(type.getAttribute('data-base')) : 0;
		var days = type ? Number(type.getAttribute('data-days')) : 1;
		var mult = speed ? Number(speed.getAttribute('data-mult')) : 1;

		var addSum = 0;
		var names = [];
		for (var i = 0; i < extras.length; i++) {
			addSum += Number(extras[i].getAttribute('data-add'));
			names.push(extras[i].value);
		}

		var total = (base + addSum) * mult;
		// Вилка +30%: цена «от» всегда обсуждается по конкретной задаче
		var low = total;
		var high = total * 1.3;
		// Срочность сокращает срок, но не ниже половины
		var termDays = Math.max(1, days / (mult > 1 ? 2 : 1));

		var typeName = type ? type.value : '';
		var speedName = speed ? speed.value : '';
		return {
			type: typeName,
			speed: speedName,
			extras: names,
			low: low,
			high: high,
			term: formatDays(termDays),
			summary: buildSummary(typeName, names, speedName)
		};
	}

	function buildSummary(typeName, extras, speedName) {
		var parts = ['Тип: ' + typeName];
		parts.push(extras.length ? 'Опции: ' + extras.join(', ') : 'Опции: не выбраны');
		parts.push('Срок: ' + speedName);
		return parts.join(' · ');
	}

	function renderResult() {
		var r = calc();
		var totalEl = document.getElementById('calc-total');
		var termEl = document.getElementById('calc-term');
		var sumEl = document.getElementById('calc-summary');
		var tgEl = document.getElementById('calc-tg');

		if (totalEl) {
			totalEl.textContent = r.low === r.high
				? formatRub(r.low)
				: formatRub(r.low) + ' — ' + formatRub(r.high);
		}
		if (termEl) termEl.textContent = 'срок: ' + r.term;
		if (sumEl) sumEl.textContent = r.summary;

		if (tgEl) {
			var msg = 'Здравствуйте! Посчитал на сайте расчёт:' +
				'\nТип сайта: ' + r.type +
				'\nОпции: ' + (r.extras.length ? r.extras.join(', ') : 'нет') +
				'\nСрок: ' + r.speed +
				'\nОценка: ' + formatRub(r.low) + ' — ' + formatRub(r.high) +
				'\nСрок выполнения: ' + r.term +
				'\nХочу обсудить проект.';
			tgEl.href = 'https://t.me/aauser14?text=' + encodeURIComponent(msg);
		}
	}

	wizard.addEventListener('click', function (ev) {
		var t = ev.target.closest('[data-calc-next], [data-calc-prev], [data-calc-reset]');
		if (!t) return;
		if (t.hasAttribute('data-calc-next')) {
			if (current === 3) renderResult();
			show(current + 1);
		} else if (t.hasAttribute('data-calc-prev')) {
			show(current - 1);
		} else if (t.hasAttribute('data-calc-reset')) {
			var radios = wizard.querySelectorAll('input[type="radio"]');
			for (var i = 0; i < radios.length; i++) radios[i].checked = false;
			var defType = wizard.querySelector('input[name="calc-type"]');
			var defSpeed = wizard.querySelector('input[name="calc-speed"]');
			if (defType) defType.checked = true;
			if (defSpeed) defSpeed.checked = true;
			var checks = wizard.querySelectorAll('input[type="checkbox"]');
			for (var j = 0; j < checks.length; j++) checks[j].checked = false;
			show(1);
		}
	});

	// Клик по варианту на шаге 1 — авто-переход вперёд
	wizard.addEventListener('change', function (ev) {
		if (ev.target.name === 'calc-type' && current === 1) show(2);
	});

	show(1);
})();

