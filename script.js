/* Flexi OSSD Challenge - Core JS */
(function(){
	const screens = {
		home: document.getElementById('screen-home'),
		level: document.getElementById('screen-level'),
		leaderboard: document.getElementById('screen-leaderboard'),
		reward: document.getElementById('screen-reward'),
		certificate: document.getElementById('screen-certificate')
	};

	const startForm = document.getElementById('start-form');
	const nameInput = document.getElementById('player-name');
	const gradeSelect = document.getElementById('start-grade');
	const btnNormal = document.getElementById('btn-normal');
	const btnFast = document.getElementById('btn-fast');
	const btnOpenLeaderboard = document.getElementById('btn-open-leaderboard');

	const labelStudent = document.getElementById('label-student');
	const labelMode = document.getElementById('label-mode');
	const levelBg = document.getElementById('level-bg');
	const mascotImg = document.getElementById('mascot-img');
	const mascotSay = document.getElementById('mascot-say');
	const gradeNumber = document.getElementById('grade-number');
	const btnComplete = document.getElementById('btn-complete');
	const btnNext = document.getElementById('btn-next');
	const btnExit = document.getElementById('btn-exit');
	const stage = document.querySelector('.stage');
	
	const levelInstructions = document.getElementById('level-instructions');
	const answerArea = document.getElementById('answer-area');
	const miniProgressWrap = document.getElementById('mini-progress-wrap');
	const miniProgressText = document.getElementById('mini-progress-text');
	const miniProgressBar = document.getElementById('mini-progress-bar');

	const timerEl = document.getElementById('timer');
	const progressWrap = document.getElementById('progress-wrap');
	const progressBar = document.getElementById('progress-bar');
	const progressText = document.getElementById('progress-text');

	const toastEl = document.getElementById('toast');

	const leaderboardList = document.getElementById('leaderboard-list');
	const btnBackHome = document.getElementById('btn-back-home');
	const btnClearLeaderboard = document.getElementById('btn-clear-leaderboard');

	const rewardMessage = document.getElementById('reward-message');
	const btnPlayAgain = document.getElementById('btn-play-again');
	const btnViewLeaderboard = document.getElementById('btn-view-leaderboard');
	const btnDownloadCertificate = document.getElementById('btn-download-certificate');

	const certStudentName = document.getElementById('cert-student-name');
	const certAchievement = document.getElementById('cert-achievement');
	const certDateValue = document.getElementById('cert-date-value');
	const btnCapturePhoto = document.getElementById('btn-capture-photo');
	const btnRetakePhoto = document.getElementById('btn-retake-photo');
	const btnPrintCert = document.getElementById('btn-print-cert');
	const btnBackToReward = document.getElementById('btn-back-to-reward');
	const cameraPreview = document.getElementById('camera-preview');
	const photoCanvas = document.getElementById('photo-canvas');

	const FUNNY_COMMENTS = [
		"You again? Didn’t I just pass you last grade?",
		"You’re learning faster than my cat!",
		"I should hire you as my assistant.",
		"You’re smarter than my lunch!",
		"You’re flexing that brain like a real Flexian!"
	];

	const MASCOT = {
		teaching: 'img/flexi_teaching.png',
		thinking: 'img/flexi_thinking.png',
		happy: 'img/flexi_happy.png',
		sad: 'img/flexi_sad.png',
		clap: 'img/flexi_clap.png'
	};

	let session = {
		name: '',
		mode: 'normal', // 'normal' | 'fast'
		startGrade: 1,
		currentGrade: 1,
		completed: 0,
		startTime: 0, // ms
		endTime: 0
	};

	/* Utils */
	const clamp = (v, min, max)=> Math.max(min, Math.min(max, v));
	const two = (n)=> String(n).padStart(2,'0');
	function fmtDuration(ms){
		const sec = Math.floor(ms/1000);
		const m = Math.floor(sec/60);
		const s = sec%60;
		return `${m}m ${two(s)}s`;
	}
	function showToast(text){
		toastEl.textContent = text;
		toastEl.classList.add('show');
		setTimeout(()=> toastEl.classList.remove('show'), 2200);
	}
	function setScreen(id){
		Object.values(screens).forEach(el=> el.classList.remove('active'));
		screens[id].classList.add('active');
	}

	/* Hash-based routing for separate pages */
	const ROUTES = {
		'': 'home',
		'home': 'home',
		'game': 'level',
		'leaderboard': 'leaderboard',
		'reward': 'reward',
		'certificate': 'certificate'
	};
	
	let canAccessReward = false; // Guard for reward page
	
	function navigate(route){
		window.location.hash = route;
	}
	
	function handleRoute(){
		const hash = window.location.hash.slice(1) || 'home';
		const route = hash.replace(/^\//, ''); // support #/home or #home
		
		// Route guards
		if(route === 'reward' && !canAccessReward){
			navigate('home');
			return;
		}
		if(route === 'game' && !session.name){
			navigate('home');
			return;
		}
		
		const screenId = ROUTES[route] || 'home';
		setScreen(screenId);
		
		// Render leaderboard when navigating to it
		if(route === 'leaderboard'){
			renderLeaderboard();
		}
	}
	
	window.addEventListener('hashchange', handleRoute);
	window.addEventListener('load', handleRoute);

	/* Keyboard shortcuts */
	document.addEventListener('keydown', (e)=>{
		const activeHome = screens.home.classList.contains('active');
		const activeLevel = screens.level.classList.contains('active');
		if(activeHome){
			if(e.key==='Enter'){
				// Default to Fast-Track on Enter for speed
				btnFast.click();
			}
			return;
		}
		if(activeLevel){
			if(e.key==='Enter'){
				if(!btnNext.disabled){ btnNext.click(); }
				else{ btnComplete.click(); }
			}
			if(e.key==='Escape'){
				btnExit.click();
			}
		}
	});

	/* Populate grade dropdown */
	(function initGrades(){
		const frag = document.createDocumentFragment();
		// Add placeholder option
		const placeholder = document.createElement('option');
		placeholder.value = '';
		placeholder.textContent = 'Select a grade';
		placeholder.disabled = true;
		placeholder.selected = true;
		frag.appendChild(placeholder);
		// Add grade options
		for(let g=1; g<=12; g++){
			const opt = document.createElement('option');
			opt.value = String(g);
			opt.textContent = `Grade ${g}`;
			frag.appendChild(opt);
		}
		gradeSelect.appendChild(frag);
	})();

	/* Start handlers */
	function startGame(mode){
		const name = nameInput.value.trim();
		const startGrade = parseInt(gradeSelect.value,10);
		if(!name){ nameInput.focus(); return; }
		if(!gradeSelect.value || isNaN(startGrade)){ gradeSelect.focus(); return; }

		session = {
			name,
			mode,
			startGrade,
			currentGrade: startGrade,
			completed: 0,
			startTime: mode==='fast' ? Date.now() : 0,
			endTime: 0
		};

		localStorage.setItem('flexi:lastSession', JSON.stringify(session));

		labelStudent.innerHTML = `Student: <strong>${session.name}</strong>`;
		labelMode.textContent = mode === 'fast' ? 'Fast-Track' : 'Normal';
		timerEl.hidden = mode !== 'fast';
		progressWrap.hidden = mode !== 'fast';

		loadGrade(session.currentGrade, true);
		navigate('game');
	}

	btnNormal.addEventListener('click', ()=> startGame('normal'));
	btnFast.addEventListener('click', ()=> startGame('fast'));
	btnOpenLeaderboard.addEventListener('click', ()=> navigate('leaderboard'));

	/* Level logic */
	let timerInterval = null;
	function startTimer(){
		if(timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(()=>{
			const now = Date.now();
			const elapsed = now - session.startTime;
			const m = Math.floor(elapsed/60000);
			const s = Math.floor((elapsed%60000)/1000);
			timerEl.textContent = `${two(m)}:${two(s)}`;
		}, 250);
	}
	function stopTimer(){
		if(timerInterval) clearInterval(timerInterval);
	}

	function bgForGrade(g){
		return `img/bg_grade${clamp(g,1,12)}.jpg`;
	}

	function changeMascot(newSrc, newText){
		mascotImg.classList.add('changing');
		setTimeout(()=>{
			mascotImg.src = newSrc;
			mascotSay.textContent = newText;
			mascotImg.classList.remove('changing');
		}, 300);
	}

	function loadGrade(g, first=false){
		gradeNumber.textContent = String(g);
		levelBg.style.backgroundImage = `url('${bgForGrade(g)}')`;
		const text = first 
			? `Hi ${session.name}! Welcome to Grade ${g}.`
			: `Onward to Grade ${g}!`;
		changeMascot(MASCOT.teaching, text);
		btnNext.disabled = true;
		if(session.mode==='fast'){
			progressText.textContent = `Grade ${g}/12`;
			progressBar.style.width = `${(g/12)*100}%`;
			if(first) startTimer();
		}
		
		// Load grade-specific mini-game
		if(g === 1){
			startGrade1MiniGame();
		}else if(g === 2){
			startGrade2MiniGame();
		}else if(g === 3){
			startGrade3MiniGame();
		}else if(g === 4){
			startGrade4MiniGame();
		}else if(g === 5){
			startGrade5MiniGame();
		}else if(g === 6){
			startGrade6MiniGame();
		}else if(g === 7){
			startGrade7MiniGame();
		}else if(g === 8){
			startGrade8MiniGame();
		}else if(g === 9){
			startGrade9MiniGame();
		}else if(g === 10){
			startGrade10MiniGame();
		}else if(g === 11){
			startGrade11MiniGame();
		}else if(g === 12){
			startGrade12MiniGame();
		}else{
			// Placeholder for other grades
			showPlaceholder();
		}
	}
	
	function showPlaceholder(){
		levelInstructions.textContent = 'Your question or mini-game will appear here soon.';
		answerArea.innerHTML = '<button id="btn-complete-placeholder" class="btn ghost">Complete Grade</button>';
		miniProgressWrap.style.display = 'none';
		document.getElementById('btn-complete-placeholder').addEventListener('click', ()=>{
			const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
			changeMascot(MASCOT.happy, quote);
			btnNext.disabled = false;
			if(session.mode==='fast'){
				session.completed = clamp(session.completed+1, 0, 12);
				progressText.textContent = `${session.completed}/12`;
				progressBar.style.width = `${(session.completed/12)*100}%`;
				if(session.completed>0 && session.completed%4===0){
					const elapsed = Date.now()-session.startTime;
					showToast(`🎉 You've completed ${session.completed} grades in ${fmtDuration(elapsed)}!`);
				}
			}
		});
	}
	
	/* Grade 1 Mini-Game */
	function startGrade1MiniGame(){
		miniProgressWrap.style.display = 'block';
		let currentQuestion = 0;
		let correctAnswers = 0;
		
		const questions = [
			{
				type: 'multiple-choice',
				question: 'Which one is a living thing?',
				options: ['Rock', 'Cat', 'Car', 'Doll'],
				correct: 1
			},
			{
				type: 'fill-blank',
				question: '2 + 1 =',
				correct: '3'
			},
			{
				type: 'matching',
				question: 'Match each picture to its word',
				pairs: [
					{icon: '🐱', options: ['Cat', 'Dog', 'Fish'], correct: 0},
					{icon: '☀️', options: ['Moon', 'Sun', 'Star'], correct: 1},
					{icon: '🚌', options: ['Car', 'Train', 'Bus'], correct: 2}
				]
			}
		];
		
		function updateMiniProgress(){
			const progress = (currentQuestion / questions.length) * 100;
			miniProgressText.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
			miniProgressBar.style.width = `${progress}%`;
		}
		
		function showQuestion(){
			updateMiniProgress();
			const q = questions[currentQuestion];
			
			if(q.type === 'multiple-choice'){
				showMultipleChoice(q);
			}else if(q.type === 'fill-blank'){
				showFillBlank(q);
			}else if(q.type === 'matching'){
				showMatching(q);
			}
		}
		
		function showMultipleChoice(q){
			if(q.instruction){
				levelInstructions.textContent = q.instruction;
			}else{
				levelInstructions.textContent = '';
			}
			let html = `<div class="quiz-question">${q.question}</div><div class="options">`;
			q.options.forEach((opt, idx)=>{
				html += `<button class="option-btn" data-idx="${idx}">${opt}</button>`;
			});
			html += '</div>';
			answerArea.innerHTML = html;
			
			document.querySelectorAll('.option-btn').forEach(btn=>{
				btn.addEventListener('click', ()=>{
					const idx = parseInt(btn.dataset.idx);
					if(idx === q.correct){
						btn.classList.add('correct');
						correctAnswers++;
						changeMascot(MASCOT.happy, 'Great job!');
						setTimeout(nextQuestion, 1000);
					}else{
						btn.classList.add('wrong');
						changeMascot(MASCOT.sad, 'Try again!');
						setTimeout(()=>{
							btn.classList.remove('wrong');
							changeMascot(MASCOT.teaching, q.instruction || 'Think carefully!');
						}, 1000);
					}
				});
			});
		}
		
		function showFillBlank(q){
			levelInstructions.textContent = 'Solve the math problem';
			answerArea.innerHTML = `
				<div class="fill-blank">
					<span>${q.question}</span>
					<input type="number" id="fill-input" maxlength="2" />
				</div>
				<button class="btn primary submit-btn" id="submit-fill">Submit</button>
			`;
			
			document.getElementById('submit-fill').addEventListener('click', ()=>{
				const input = document.getElementById('fill-input');
				if(input.value === q.correct){
					input.classList.add('correct');
					correctAnswers++;
					changeMascot(MASCOT.happy, 'Correct!');
					setTimeout(nextQuestion, 1000);
				}else{
					input.classList.add('wrong');
					changeMascot(MASCOT.sad, 'Not quite! Try again.');
					setTimeout(()=>{
						input.classList.remove('wrong');
						input.value = '';
						changeMascot(MASCOT.teaching, 'Solve the math problem');
					}, 1000);
				}
			});
		}
		
		function showMatching(q){
			levelInstructions.textContent = q.question;
			let html = '<div class="matching-game">';
			q.pairs.forEach((pair, idx)=>{
				html += `<div class="match-item">
					<div class="match-icon">${pair.icon}</div>
					<select class="match-select" data-idx="${idx}">
						<option value="">Select...</option>`;
				pair.options.forEach((opt, optIdx)=>{
					html += `<option value="${optIdx}">${opt}</option>`;
				});
				html += `</select></div>`;
			});
			html += '</div><button class="btn primary submit-btn" id="submit-match">Submit</button>';
			answerArea.innerHTML = html;
			
			document.getElementById('submit-match').addEventListener('click', ()=>{
				const selects = document.querySelectorAll('.match-select');
				let allCorrect = true;
				selects.forEach(sel=>{
					const idx = parseInt(sel.dataset.idx);
					const selected = parseInt(sel.value);
					if(selected === q.pairs[idx].correct){
						sel.classList.add('correct');
						sel.disabled = true; // Lock correct answers
					}else{
						sel.classList.add('wrong');
						allCorrect = false;
					}
				});
				
				if(allCorrect){
					correctAnswers++;
					changeMascot(MASCOT.happy, 'Perfect matching!');
					setTimeout(nextQuestion, 1000);
				}else{
					changeMascot(MASCOT.sad, 'Some matches are wrong. Try again!');
					setTimeout(()=>{
						// Only reset wrong answers, keep correct ones
						selects.forEach(sel=>{
							if(sel.classList.contains('wrong')){
								sel.classList.remove('wrong');
								sel.value = '';
							}
						});
						changeMascot(MASCOT.teaching, q.question);
					}, 1500);
				}
			});
		}
		
		function nextQuestion(){
			currentQuestion++;
			if(currentQuestion < questions.length){
				showQuestion();
			}else{
				finishGrade1();
			}
		}
		
		function finishGrade1(){
			miniProgressBar.style.width = '100%';
			miniProgressText.textContent = 'Complete!';
			levelInstructions.textContent = `You got ${correctAnswers} out of ${questions.length} correct!`;
			answerArea.innerHTML = '<p style="text-align:center; font-size:18px; color:#28a745;">🎉 Well done!</p>';
			
			const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
			changeMascot(MASCOT.clap, quote);
			
			if(session.mode==='fast'){
				btnNext.disabled = false;
				session.completed = clamp(session.completed+1, 0, 12);
				progressText.textContent = `${session.completed}/12`;
				progressBar.style.width = `${(session.completed/12)*100}%`;
				if(session.completed>0 && session.completed%4===0){
					const elapsed = Date.now()-session.startTime;
					showToast(`🎉 You've completed ${session.completed} grades in ${fmtDuration(elapsed)}!`);
				}
			}else{
				// Normal mode - auto finish after short delay
				setTimeout(()=>{
					finishNormal();
				}, 2000);
			}
		}
		
		showQuestion();
	}

	/* Grade 2 Mini-Game */
	function startGrade2MiniGame(){
		miniProgressWrap.style.display = 'block';
		let currentQuestion = 0;
		let correctAnswers = 0;
		
		const questions = [
			{
				type: 'fill-blank',
				question: 'What is 5 − 2 = ?',
				correct: '3'
			},
			{
				type: 'multiple-choice',
				question: 'The boy ______ a book.',
				instruction: 'Choose the correct word',
				options: ['read', 'reads'],
				correct: 1
			},
			{
				type: 'multiple-choice',
				question: 'Choose the correct spelling',
				options: ['yello', 'yellow'],
				correct: 1
			}
		];
		
		function updateMiniProgress(){
			const progress = (currentQuestion / questions.length) * 100;
			miniProgressText.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
			miniProgressBar.style.width = `${progress}%`;
		}
		
		function showQuestion(){
			updateMiniProgress();
			const q = questions[currentQuestion];
			if(q.type === 'fill-blank'){
				showFillBlank(q);
			}else{
				showMultipleChoice(q);
			}
		}
		
		function showFillBlank(q){
			levelInstructions.textContent = '';
			answerArea.innerHTML = `
				<div class="quiz-question">${q.question}</div>
				<div class="fill-blank">
					<input type="number" id="fill-input" placeholder="?" style="width:100px;" />
				</div>
				<button class="btn primary submit-btn" id="submit-fill">Submit</button>
			`;
			
			document.getElementById('submit-fill').addEventListener('click', ()=>{
				const input = document.getElementById('fill-input');
				if(input.value === q.correct){
					input.classList.add('correct');
					correctAnswers++;
					changeMascot(MASCOT.happy, 'Correct!');
					setTimeout(nextQuestion, 1000);
				}else{
					input.classList.add('wrong');
					changeMascot(MASCOT.sad, 'Try again!');
					setTimeout(()=>{
						input.classList.remove('wrong');
						input.value = '';
						changeMascot(MASCOT.teaching, 'Think about it!');
					}, 1000);
				}
			});
		}
		
		function showMultipleChoice(q){
			if(q.instruction){
				levelInstructions.textContent = q.instruction;
			}else{
				levelInstructions.textContent = '';
			}
			let html = `<div class="quiz-question">${q.question}</div><div class="options">`;
			q.options.forEach((opt, idx)=>{
				html += `<button class="option-btn" data-idx="${idx}">${opt}</button>`;
			});
			html += '</div>';
			answerArea.innerHTML = html;
			
			document.querySelectorAll('.option-btn').forEach(btn=>{
				btn.addEventListener('click', ()=>{
					const idx = parseInt(btn.dataset.idx);
					if(idx === q.correct){
						btn.classList.add('correct');
						correctAnswers++;
						changeMascot(MASCOT.happy, 'Excellent!');
						setTimeout(nextQuestion, 1000);
					}else{
						btn.classList.add('wrong');
						changeMascot(MASCOT.sad, 'Try again!');
						setTimeout(()=>{
							btn.classList.remove('wrong');
							changeMascot(MASCOT.teaching, q.instruction || 'Think carefully!');
						}, 1000);
					}
				});
			});
		}
		
		function nextQuestion(){
			currentQuestion++;
			if(currentQuestion < questions.length){
				showQuestion();
			}else{
				finishGrade2();
			}
		}
		
		function finishGrade2(){
			miniProgressBar.style.width = '100%';
			miniProgressText.textContent = 'Complete!';
			levelInstructions.textContent = `You got ${correctAnswers} out of ${questions.length} correct!`;
			answerArea.innerHTML = '<p style="text-align:center; font-size:18px; color:#28a745;">🎉 Awesome work!</p>';
			
			const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
			changeMascot(MASCOT.clap, quote);
			
			if(session.mode==='fast'){
				btnNext.disabled = false;
				session.completed = clamp(session.completed+1, 0, 12);
				progressText.textContent = `${session.completed}/12`;
				progressBar.style.width = `${(session.completed/12)*100}%`;
				if(session.completed>0 && session.completed%4===0){
					const elapsed = Date.now()-session.startTime;
					showToast(`🎉 You've completed ${session.completed} grades in ${fmtDuration(elapsed)}!`);
				}
			}else{
				// Normal mode - auto finish after short delay
				setTimeout(()=>{
					finishNormal();
				}, 2000);
			}
		}
		
		showQuestion();
	}

	/* Grade 3 Mini-Game */
	function startGrade3MiniGame(){
		miniProgressWrap.style.display = 'block';
		let currentQuestion = 0;
		let correctAnswers = 0;
		
		const questions = [
			{
				type: 'multiple-choice',
				question: 'What is 8 + 5?',
				options: ['12', '13', '14', '15'],
				correct: 1
			},
			{
				type: 'fill-blank',
				question: 'The Sun is a ______',
				correct: 'star'
			},
			{
				type: 'matching',
				question: 'Match each word to its correct plural',
				pairs: [
					{icon: 'child', options: ['childs', 'children', 'childes'], correct: 1},
					{icon: 'foot', options: ['foots', 'feet', 'feets'], correct: 1},
					{icon: 'mouse', options: ['mouses', 'mice', 'mices'], correct: 1}
				]
			}
		];
		
		function updateMiniProgress(){
			const progress = (currentQuestion / questions.length) * 100;
			miniProgressText.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
			miniProgressBar.style.width = `${progress}%`;
		}
		
		function showQuestion(){
			updateMiniProgress();
			const q = questions[currentQuestion];
			
			if(q.type === 'multiple-choice'){
				showMultipleChoice(q);
			}else if(q.type === 'fill-blank'){
				showFillBlank(q);
			}else if(q.type === 'matching'){
				showMatching(q);
			}
		}
		
		function showMultipleChoice(q){
			if(q.instruction){
				levelInstructions.textContent = q.instruction;
			}else{
				levelInstructions.textContent = '';
			}
			let html = `<div class="quiz-question">${q.question}</div><div class="options">`;
			q.options.forEach((opt, idx)=>{
				html += `<button class="option-btn" data-idx="${idx}">${opt}</button>`;
			});
			html += '</div>';
			answerArea.innerHTML = html;
			
			document.querySelectorAll('.option-btn').forEach(btn=>{
				btn.addEventListener('click', ()=>{
					const idx = parseInt(btn.dataset.idx);
					if(idx === q.correct){
						btn.classList.add('correct');
						correctAnswers++;
						changeMascot(MASCOT.happy, 'Perfect!');
						setTimeout(nextQuestion, 1000);
					}else{
						btn.classList.add('wrong');
						changeMascot(MASCOT.sad, 'Not quite!');
						setTimeout(()=>{
							btn.classList.remove('wrong');
							changeMascot(MASCOT.teaching, 'Think carefully!');
						}, 1000);
					}
				});
			});
		}
		
		function showFillBlank(q){
			levelInstructions.textContent = '';
			answerArea.innerHTML = `
				<div class="quiz-question">${q.question}</div>
				<div class="fill-blank">
					<input type="text" id="fill-input" placeholder="Type your answer" />
				</div>
				<button class="btn primary submit-btn" id="submit-fill">Submit</button>
			`;
			
			document.getElementById('submit-fill').addEventListener('click', ()=>{
				const input = document.getElementById('fill-input');
				const answer = input.value.trim().toLowerCase();
				if(answer === q.correct.toLowerCase()){
					input.classList.add('correct');
					correctAnswers++;
					changeMascot(MASCOT.happy, 'Correct!');
					setTimeout(nextQuestion, 1000);
				}else{
					input.classList.add('wrong');
					changeMascot(MASCOT.sad, 'Try again!');
					setTimeout(()=>{
						input.classList.remove('wrong');
						input.value = '';
						changeMascot(MASCOT.teaching, 'Think about it!');
					}, 1000);
				}
			});
		}
		
		function showMatching(q){
			levelInstructions.textContent = '';
			let html = `<div class="quiz-question">${q.question}</div><div class="matching-game">`;
			q.pairs.forEach((pair, idx)=>{
				html += `<div class="match-item">
					<div class="match-icon" style="font-size:18px; font-weight:700;">${pair.icon}</div>
					<select class="match-select" data-idx="${idx}">
						<option value="">Select...</option>`;
				pair.options.forEach((opt, optIdx)=>{
					html += `<option value="${optIdx}">${opt}</option>`;
				});
				html += `</select></div>`;
			});
			html += '</div><button class="btn primary submit-btn" id="submit-match">Submit</button>';
			answerArea.innerHTML = html;
			
			document.getElementById('submit-match').addEventListener('click', ()=>{
				const selects = document.querySelectorAll('.match-select');
				let allCorrect = true;
				selects.forEach(sel=>{
					const idx = parseInt(sel.dataset.idx);
					const selected = parseInt(sel.value);
					if(selected === q.pairs[idx].correct){
						sel.classList.add('correct');
						sel.disabled = true;
					}else{
						sel.classList.add('wrong');
						allCorrect = false;
					}
				});
				
				if(allCorrect){
					correctAnswers++;
					changeMascot(MASCOT.happy, 'Excellent matching!');
					setTimeout(nextQuestion, 1000);
				}else{
					changeMascot(MASCOT.sad, 'Some matches are wrong. Try again!');
					setTimeout(()=>{
						selects.forEach(sel=>{
							if(sel.classList.contains('wrong')){
								sel.classList.remove('wrong');
								sel.value = '';
							}
						});
						changeMascot(MASCOT.teaching, q.question);
					}, 1500);
				}
			});
		}
		
		function nextQuestion(){
			currentQuestion++;
			if(currentQuestion < questions.length){
				showQuestion();
			}else{
				finishGrade3();
			}
		}
		
		function finishGrade3(){
			miniProgressBar.style.width = '100%';
			miniProgressText.textContent = 'Complete!';
			levelInstructions.textContent = `You got ${correctAnswers} out of ${questions.length} correct!`;
			answerArea.innerHTML = '<p style="text-align:center; font-size:18px; color:#28a745;">🎉 Fantastic job!</p>';
			
			const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
			changeMascot(MASCOT.clap, quote);
			
			if(session.mode==='fast'){
				btnNext.disabled = false;
				session.completed = clamp(session.completed+1, 0, 12);
				progressText.textContent = `${session.completed}/12`;
				progressBar.style.width = `${(session.completed/12)*100}%`;
				if(session.completed>0 && session.completed%4===0){
					const elapsed = Date.now()-session.startTime;
					showToast(`🎉 You've completed ${session.completed} grades in ${fmtDuration(elapsed)}!`);
				}
			}else{
				// Normal mode - auto finish after short delay
				setTimeout(()=>{
					finishNormal();
				}, 2000);
			}
		}
		
		showQuestion();
	}

	/* Grade 4 Mini-Game */
	function startGrade4MiniGame(){
		miniProgressWrap.style.display = 'block';
		let currentQuestion = 0;
		let correctAnswers = 0;
		
		const questions = [
			{
				type: 'multiple-choice',
				question: 'Which process turns water into water vapor?',
				options: ['Freezing', 'Condensation', 'Evaporation', 'Melting'],
				correct: 2
			},
			{
				type: 'multiple-choice',
				question: 'She ______ to school every day.',
				instruction: 'Choose the correct word',
				options: ['go', 'goes'],
				correct: 1
			},
			{
				type: 'multiple-choice',
				question: 'Choose the correctly spelled word',
				options: ['beatiful', 'beautiful'],
				correct: 1
			}
		];
		
		function updateMiniProgress(){
			const progress = (currentQuestion / questions.length) * 100;
			miniProgressText.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
			miniProgressBar.style.width = `${progress}%`;
		}
		
		function showQuestion(){
			updateMiniProgress();
			const q = questions[currentQuestion];
			showMultipleChoice(q);
		}
		
		function showMultipleChoice(q){
			if(q.instruction){
				levelInstructions.textContent = q.instruction;
			}else{
				levelInstructions.textContent = '';
			}
			let html = `<div class="quiz-question">${q.question}</div><div class="options">`;
			q.options.forEach((opt, idx)=>{
				html += `<button class="option-btn" data-idx="${idx}">${opt}</button>`;
			});
			html += '</div>';
			answerArea.innerHTML = html;
			
			document.querySelectorAll('.option-btn').forEach(btn=>{
				btn.addEventListener('click', ()=>{
					const idx = parseInt(btn.dataset.idx);
					if(idx === q.correct){
						btn.classList.add('correct');
						correctAnswers++;
						changeMascot(MASCOT.happy, 'Outstanding!');
						setTimeout(nextQuestion, 1000);
					}else{
						btn.classList.add('wrong');
						changeMascot(MASCOT.sad, 'Not quite!');
						setTimeout(()=>{
							btn.classList.remove('wrong');
							changeMascot(MASCOT.teaching, 'Think carefully!');
						}, 1000);
					}
				});
			});
		}
		
		function nextQuestion(){
			currentQuestion++;
			if(currentQuestion < questions.length){
				showQuestion();
			}else{
				finishGrade4();
			}
		}
		
		function finishGrade4(){
			miniProgressBar.style.width = '100%';
			miniProgressText.textContent = 'Complete!';
			levelInstructions.textContent = `You got ${correctAnswers} out of ${questions.length} correct!`;
			answerArea.innerHTML = '<p style="text-align:center; font-size:18px; color:#28a745;">🎉 Amazing work!</p>';
			
			const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
			changeMascot(MASCOT.clap, quote);
			
			if(session.mode==='fast'){
				btnNext.disabled = false;
				session.completed = clamp(session.completed+1, 0, 12);
				progressText.textContent = `${session.completed}/12`;
				progressBar.style.width = `${(session.completed/12)*100}%`;
				if(session.completed>0 && session.completed%4===0){
					const elapsed = Date.now()-session.startTime;
					showToast(`🎉 You've completed ${session.completed} grades in ${fmtDuration(elapsed)}!`);
				}
			}else{
				// Normal mode - auto finish after short delay
				setTimeout(()=>{
					finishNormal();
				}, 2000);
			}
		}
		
		showQuestion();
	}

	/* Grade 5 Mini-Game */
	function startGrade5MiniGame(){
		miniProgressWrap.style.display = 'block';
		let currentQuestion = 0;
		let correctAnswers = 0;
		
		const questions = [
			{
				type: 'multiple-choice',
				question: 'What is 125 − 48?',
				options: ['67', '77', '87', '97'],
				correct: 1
			},
			{
				type: 'multiple-choice',
				question: 'If it ______ tomorrow, we will stay home.',
				instruction: 'Choose the correct word',
				options: ['rain', 'rains'],
				correct: 1
			},
			{
				type: 'multiple-choice',
				question: 'Which of the following is a renewable energy source?',
				options: ['Coal', 'Oil', 'Natural gas', 'Solar'],
				correct: 3
			},
			{
				type: 'multiple-choice',
				question: 'Circle the correctly spelled word',
				options: ['neccesary', 'necessary'],
				correct: 1
			}
		];
		
		function updateMiniProgress(){
			const progress = (currentQuestion / questions.length) * 100;
			miniProgressText.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
			miniProgressBar.style.width = `${progress}%`;
		}
		
		function showQuestion(){
			updateMiniProgress();
			const q = questions[currentQuestion];
			showMultipleChoice(q);
		}
		
		function showMultipleChoice(q){
			if(q.instruction){
				levelInstructions.textContent = q.instruction;
			}else{
				levelInstructions.textContent = '';
			}
			let html = `<div class="quiz-question">${q.question}</div><div class="options">`;
			q.options.forEach((opt, idx)=>{
				html += `<button class="option-btn" data-idx="${idx}">${opt}</button>`;
			});
			html += '</div>';
			answerArea.innerHTML = html;
			
			document.querySelectorAll('.option-btn').forEach(btn=>{
				btn.addEventListener('click', ()=>{
					const idx = parseInt(btn.dataset.idx);
					if(idx === q.correct){
						btn.classList.add('correct');
						correctAnswers++;
						changeMascot(MASCOT.happy, 'Brilliant!');
						setTimeout(nextQuestion, 1000);
					}else{
						btn.classList.add('wrong');
						changeMascot(MASCOT.sad, 'Not quite!');
						setTimeout(()=>{
							btn.classList.remove('wrong');
							changeMascot(MASCOT.teaching, 'Think carefully!');
						}, 1000);
					}
				});
			});
		}
		
		function nextQuestion(){
			currentQuestion++;
			if(currentQuestion < questions.length){
				showQuestion();
			}else{
				finishGrade5();
			}
		}
		
		function finishGrade5(){
			miniProgressBar.style.width = '100%';
			miniProgressText.textContent = 'Complete!';
			levelInstructions.textContent = `You got ${correctAnswers} out of ${questions.length} correct!`;
			answerArea.innerHTML = '<p style="text-align:center; font-size:18px; color:#28a745;">🎉 Superb performance!</p>';
			
			const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
			changeMascot(MASCOT.clap, quote);
			
			if(session.mode==='fast'){
				btnNext.disabled = false;
				session.completed = clamp(session.completed+1, 0, 12);
				progressText.textContent = `${session.completed}/12`;
				progressBar.style.width = `${(session.completed/12)*100}%`;
				if(session.completed>0 && session.completed%4===0){
					const elapsed = Date.now()-session.startTime;
					showToast(`🎉 You've completed ${session.completed} grades in ${fmtDuration(elapsed)}!`);
				}
			}else{
				// Normal mode - auto finish after short delay
				setTimeout(()=>{
					finishNormal();
				}, 2000);
			}
		}
		
		showQuestion();
	}

	/* Grade 6 Mini-Game */
	function startGrade6MiniGame(){
		miniProgressWrap.style.display = 'block';
		let currentQuestion = 0;
		let correctAnswers = 0;
		
		const questions = [
			{
				type: 'multiple-choice',
				question: 'Which organ pumps blood through the body?',
				options: ['Lungs', 'Stomach', 'Heart', 'Brain'],
				correct: 2
			},
			{
				type: 'multiple-choice',
				question: '___ going to rain today.',
				instruction: 'Choose the correct word',
				options: ["She's", "It's"],
				correct: 1
			},
			{
				type: 'matching',
				question: 'Match each ecosystem role to an example',
				pairs: [
					{icon: 'Producer', options: ['Grass', 'Lion', 'Mushroom'], correct: 0},
					{icon: 'Consumer', options: ['Grass', 'Lion', 'Mushroom'], correct: 1},
					{icon: 'Decomposer', options: ['Grass', 'Lion', 'Mushroom'], correct: 2}
				]
			}
		];
		
		function updateMiniProgress(){
			const progress = (currentQuestion / questions.length) * 100;
			miniProgressText.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
			miniProgressBar.style.width = `${progress}%`;
		}
		
		function showQuestion(){
			updateMiniProgress();
			const q = questions[currentQuestion];
			
			if(q.type === 'multiple-choice'){
				showMultipleChoice(q);
			}else if(q.type === 'matching'){
				showMatching(q);
			}
		}
		
		function showMultipleChoice(q){
			if(q.instruction){
				levelInstructions.textContent = q.instruction;
			}else{
				levelInstructions.textContent = '';
			}
			let html = `<div class="quiz-question">${q.question}</div><div class="options">`;
			q.options.forEach((opt, idx)=>{
				html += `<button class="option-btn" data-idx="${idx}">${opt}</button>`;
			});
			html += '</div>';
			answerArea.innerHTML = html;
			
			document.querySelectorAll('.option-btn').forEach(btn=>{
				btn.addEventListener('click', ()=>{
					const idx = parseInt(btn.dataset.idx);
					if(idx === q.correct){
						btn.classList.add('correct');
						correctAnswers++;
						changeMascot(MASCOT.happy, 'Excellent!');
						setTimeout(nextQuestion, 1000);
					}else{
						btn.classList.add('wrong');
						changeMascot(MASCOT.sad, 'Try again!');
						setTimeout(()=>{
							btn.classList.remove('wrong');
							changeMascot(MASCOT.teaching, 'Think carefully!');
						}, 1000);
					}
				});
			});
		}
		
		function showMatching(q){
			levelInstructions.textContent = '';
			let html = `<div class="quiz-question">${q.question}</div><div class="matching-game">`;
			q.pairs.forEach((pair, idx)=>{
				html += `<div class="match-item">
					<div class="match-icon" style="font-size:18px; font-weight:700;">${pair.icon}</div>
					<select class="match-select" data-idx="${idx}">
						<option value="">Select...</option>`;
				pair.options.forEach((opt, optIdx)=>{
					html += `<option value="${optIdx}">${opt}</option>`;
				});
				html += `</select></div>`;
			});
			html += '</div><button class="btn primary submit-btn" id="submit-match">Submit</button>';
			answerArea.innerHTML = html;
			
			document.getElementById('submit-match').addEventListener('click', ()=>{
				const selects = document.querySelectorAll('.match-select');
				let allCorrect = true;
				selects.forEach(sel=>{
					const idx = parseInt(sel.dataset.idx);
					const selected = parseInt(sel.value);
					if(selected === q.pairs[idx].correct){
						sel.classList.add('correct');
						sel.disabled = true;
					}else{
						sel.classList.add('wrong');
						allCorrect = false;
					}
				});
				
				if(allCorrect){
					correctAnswers++;
					changeMascot(MASCOT.happy, 'Perfect matching!');
					setTimeout(nextQuestion, 1000);
				}else{
					changeMascot(MASCOT.sad, 'Some matches are wrong. Try again!');
					setTimeout(()=>{
						selects.forEach(sel=>{
							if(sel.classList.contains('wrong')){
								sel.classList.remove('wrong');
								sel.value = '';
							}
						});
						changeMascot(MASCOT.teaching, q.question);
					}, 1500);
				}
			});
		}
		
		function nextQuestion(){
			currentQuestion++;
			if(currentQuestion < questions.length){
				showQuestion();
			}else{
				finishGrade6();
			}
		}
		
		function finishGrade6(){
			miniProgressBar.style.width = '100%';
			miniProgressText.textContent = 'Complete!';
			levelInstructions.textContent = `You got ${correctAnswers} out of ${questions.length} correct!`;
			answerArea.innerHTML = '<p style="text-align:center; font-size:18px; color:#28a745;">🎉 Incredible work!</p>';
			
			const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
			changeMascot(MASCOT.clap, quote);
			
			if(session.mode==='fast'){
				btnNext.disabled = false;
				session.completed = clamp(session.completed+1, 0, 12);
				progressText.textContent = `${session.completed}/12`;
				progressBar.style.width = `${(session.completed/12)*100}%`;
				if(session.completed>0 && session.completed%4===0){
					const elapsed = Date.now()-session.startTime;
					showToast(`🎉 You've completed ${session.completed} grades in ${fmtDuration(elapsed)}!`);
				}
			}else{
				// Normal mode - auto finish after short delay
				setTimeout(()=>{
					finishNormal();
				}, 2000);
			}
		}
		
		showQuestion();
	}

	/* Grade 7 Mini-Game */
	function startGrade7MiniGame(){
		miniProgressWrap.style.display = 'block';
		let currentQuestion = 0;
		let correctAnswers = 0;
		
		const questions = [
			{
				type: 'multiple-choice',
				question: 'What is −6 + 9?',
				options: ['2', '3', '4', '6'],
				correct: 1
			},
			{
				type: 'multiple-choice',
				question: 'Which body system breaks down food into nutrients?',
				options: ['Respiratory', 'Circulatory', 'Digestive', 'Nervous'],
				correct: 2
			},
			{
				type: 'fill-blank',
				question: 'The force that pulls objects toward Earth is called ______',
				correct: 'gravity'
			},
			{
				type: 'matching',
				question: 'Match each quantity to its SI unit',
				pairs: [
					{icon: 'Length', options: ['meter', 'kilogram', 'second'], correct: 0},
					{icon: 'Mass', options: ['meter', 'kilogram', 'second'], correct: 1},
					{icon: 'Time', options: ['meter', 'kilogram', 'second'], correct: 2}
				]
			}
		];
		
		function updateMiniProgress(){
			const progress = (currentQuestion / questions.length) * 100;
			miniProgressText.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
			miniProgressBar.style.width = `${progress}%`;
		}
		
		function showQuestion(){
			updateMiniProgress();
			const q = questions[currentQuestion];
			
			if(q.type === 'multiple-choice'){
				showMultipleChoice(q);
			}else if(q.type === 'fill-blank'){
				showFillBlank(q);
			}else if(q.type === 'matching'){
				showMatching(q);
			}
		}
		
		function showMultipleChoice(q){
			if(q.instruction){
				levelInstructions.textContent = q.instruction;
			}else{
				levelInstructions.textContent = '';
			}
			let html = `<div class="quiz-question">${q.question}</div><div class="options">`;
			q.options.forEach((opt, idx)=>{
				html += `<button class="option-btn" data-idx="${idx}">${opt}</button>`;
			});
			html += '</div>';
			answerArea.innerHTML = html;
			
			document.querySelectorAll('.option-btn').forEach(btn=>{
				btn.addEventListener('click', ()=>{
					const idx = parseInt(btn.dataset.idx);
					if(idx === q.correct){
						btn.classList.add('correct');
						correctAnswers++;
						changeMascot(MASCOT.happy, 'Superb!');
						setTimeout(nextQuestion, 1000);
					}else{
						btn.classList.add('wrong');
						changeMascot(MASCOT.sad, 'Try again!');
						setTimeout(()=>{
							btn.classList.remove('wrong');
							changeMascot(MASCOT.teaching, 'Think carefully!');
						}, 1000);
					}
				});
			});
		}
		
		function showFillBlank(q){
			levelInstructions.textContent = '';
			answerArea.innerHTML = `
				<div class="quiz-question">${q.question}</div>
				<div class="fill-blank">
					<input type="text" id="fill-input" placeholder="Type your answer" />
				</div>
				<button class="btn primary submit-btn" id="submit-fill">Submit</button>
			`;
			
			document.getElementById('submit-fill').addEventListener('click', ()=>{
				const input = document.getElementById('fill-input');
				const answer = input.value.trim().toLowerCase();
				if(answer === q.correct.toLowerCase()){
					input.classList.add('correct');
					correctAnswers++;
					changeMascot(MASCOT.happy, 'Perfect!');
					setTimeout(nextQuestion, 1000);
				}else{
					input.classList.add('wrong');
					changeMascot(MASCOT.sad, 'Not quite!');
					setTimeout(()=>{
						input.classList.remove('wrong');
						input.value = '';
						changeMascot(MASCOT.teaching, 'Think about it!');
					}, 1000);
				}
			});
		}
		
		function showMatching(q){
			levelInstructions.textContent = '';
			let html = `<div class="quiz-question">${q.question}</div><div class="matching-game">`;
			q.pairs.forEach((pair, idx)=>{
				html += `<div class="match-item">
					<div class="match-icon">${pair.icon}</div>
					<select class="match-select" data-idx="${idx}">
						<option value="">Select...</option>`;
				pair.options.forEach((opt, optIdx)=>{
					html += `<option value="${optIdx}">${opt}</option>`;
				});
				html += `</select></div>`;
			});
			html += '</div><button class="btn primary submit-btn" id="submit-match">Submit</button>';
			answerArea.innerHTML = html;
			
			document.getElementById('submit-match').addEventListener('click', ()=>{
				const selects = document.querySelectorAll('.match-select');
				let allCorrect = true;
				selects.forEach(sel=>{
					const idx = parseInt(sel.dataset.idx);
					const selected = parseInt(sel.value);
					if(selected === q.pairs[idx].correct){
						sel.classList.add('correct');
						sel.disabled = true;
					}else{
						sel.classList.add('wrong');
						allCorrect = false;
					}
				});
				
				if(allCorrect){
					correctAnswers++;
					changeMascot(MASCOT.happy, 'Excellent matching!');
					setTimeout(nextQuestion, 1000);
				}else{
					changeMascot(MASCOT.sad, 'Some matches are wrong. Try again!');
					setTimeout(()=>{
						selects.forEach(sel=>{
							if(sel.classList.contains('wrong')){
								sel.classList.remove('wrong');
								sel.value = '';
							}
						});
						changeMascot(MASCOT.teaching, q.question);
					}, 1500);
				}
			});
		}
		
		function nextQuestion(){
			currentQuestion++;
			if(currentQuestion < questions.length){
				showQuestion();
			}else{
				finishGrade7();
			}
		}
		
		function finishGrade7(){
			miniProgressBar.style.width = '100%';
			miniProgressText.textContent = 'Complete!';
			levelInstructions.textContent = `You got ${correctAnswers} out of ${questions.length} correct!`;
			answerArea.innerHTML = '<p style="text-align:center; font-size:18px; color:#28a745;">🎉 Outstanding performance!</p>';
			
			const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
			changeMascot(MASCOT.clap, quote);
			
			if(session.mode==='fast'){
				btnNext.disabled = false;
				session.completed = clamp(session.completed+1, 0, 12);
				progressText.textContent = `${session.completed}/12`;
				progressBar.style.width = `${(session.completed/12)*100}%`;
				if(session.completed>0 && session.completed%4===0){
					const elapsed = Date.now()-session.startTime;
					showToast(`🎉 You've completed ${session.completed} grades in ${fmtDuration(elapsed)}!`);
				}
			}else{
				// Normal mode - auto finish after short delay
				setTimeout(()=>{
					finishNormal();
				}, 2000);
			}
		}
		
		showQuestion();
	}

	/* Grade 8 Mini-Game */
	function startGrade8MiniGame(){
		miniProgressWrap.style.display = 'block';
		let currentQuestion = 0;
		let correctAnswers = 0;
		
		const questions = [
			{
				type: 'multiple-choice',
				question: 'Which particle has a negative charge?',
				options: ['Proton', 'Neutron', 'Electron', 'Nucleus'],
				correct: 2
			},
			{
				type: 'multiple-choice',
				question: 'Neither the students nor the teacher ___ arriving late.',
				instruction: 'Choose the correct verb',
				options: ['is', 'are'],
				correct: 0
			},
			{
				type: 'multiple-choice',
				question: 'Circle the correctly spelled word',
				options: ['occurence', 'occurrence'],
				correct: 1
			}
		];
		
		function updateMiniProgress(){
			const progress = (currentQuestion / questions.length) * 100;
			miniProgressText.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
			miniProgressBar.style.width = `${progress}%`;
		}
		
		function showQuestion(){
			updateMiniProgress();
			const q = questions[currentQuestion];
			showMultipleChoice(q);
		}
		
		function showMultipleChoice(q){
			if(q.instruction){
				levelInstructions.textContent = q.instruction;
			}else{
				levelInstructions.textContent = '';
			}
			let html = `<div class="quiz-question">${q.question}</div><div class="options">`;
			q.options.forEach((opt, idx)=>{
				html += `<button class="option-btn" data-idx="${idx}">${opt}</button>`;
			});
			html += '</div>';
			answerArea.innerHTML = html;
			
			document.querySelectorAll('.option-btn').forEach(btn=>{
				btn.addEventListener('click', ()=>{
					const idx = parseInt(btn.dataset.idx);
					if(idx === q.correct){
						btn.classList.add('correct');
						correctAnswers++;
						changeMascot(MASCOT.happy, 'Brilliant!');
						setTimeout(nextQuestion, 1000);
					}else{
						btn.classList.add('wrong');
						changeMascot(MASCOT.sad, 'Try again!');
						setTimeout(()=>{
							btn.classList.remove('wrong');
							changeMascot(MASCOT.teaching, 'Think carefully!');
						}, 1000);
					}
				});
			});
		}
		
		function nextQuestion(){
			currentQuestion++;
			if(currentQuestion < questions.length){
				showQuestion();
			}else{
				finishGrade8();
			}
		}
		
		function finishGrade8(){
			miniProgressBar.style.width = '100%';
			miniProgressText.textContent = 'Complete!';
			levelInstructions.textContent = `You got ${correctAnswers} out of ${questions.length} correct!`;
			answerArea.innerHTML = '<p style="text-align:center; font-size:18px; color:#28a745;">🎉 Exceptional work!</p>';
			
			const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
			changeMascot(MASCOT.clap, quote);
			
			if(session.mode==='fast'){
				btnNext.disabled = false;
				session.completed = clamp(session.completed+1, 0, 12);
				progressText.textContent = `${session.completed}/12`;
				progressBar.style.width = `${(session.completed/12)*100}%`;
				if(session.completed>0 && session.completed%4===0){
					const elapsed = Date.now()-session.startTime;
					showToast(`🎉 You've completed ${session.completed} grades in ${fmtDuration(elapsed)}!`);
				}
			}else{
				// Normal mode - auto finish after short delay
				setTimeout(()=>{
					finishNormal();
				}, 2000);
			}
		}
		
		showQuestion();
	}

	/* Grade 9 Mini-Game */
	function startGrade9MiniGame(){
		miniProgressWrap.style.display = 'block';
		let currentQuestion = 0;
		let correctAnswers = 0;
		
		const questions = [
			{
				type: 'multiple-choice',
				question: 'Which is a compound?',
				options: ['O₂', 'CO₂', 'Ne', 'Fe'],
				correct: 1
			},
			{
				type: 'multiple-choice',
				question: 'Which word means the same as analyze?',
				options: ['Argue', 'Examine', 'Avoid', 'Pretend'],
				correct: 1
			},
			{
				type: 'multiple-choice',
				question: 'Neither of the answers ___ correct.',
				instruction: 'Choose the correct verb',
				options: ['is', 'are'],
				correct: 0
			},
			{
				type: 'multiple-choice',
				question: 'Choose the correctly spelled word',
				options: ['seperate', 'separate'],
				correct: 1
			}
		];
		
		function updateMiniProgress(){
			const progress = (currentQuestion / questions.length) * 100;
			miniProgressText.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
			miniProgressBar.style.width = `${progress}%`;
		}
		
		function showQuestion(){
			updateMiniProgress();
			const q = questions[currentQuestion];
			showMultipleChoice(q);
		}
		
		function showMultipleChoice(q){
			if(q.instruction){
				levelInstructions.textContent = q.instruction;
			}else{
				levelInstructions.textContent = '';
			}
			let html = `<div class="quiz-question">${q.question}</div><div class="options">`;
			q.options.forEach((opt, idx)=>{
				html += `<button class="option-btn" data-idx="${idx}">${opt}</button>`;
			});
			html += '</div>';
			answerArea.innerHTML = html;
			
			document.querySelectorAll('.option-btn').forEach(btn=>{
				btn.addEventListener('click', ()=>{
					const idx = parseInt(btn.dataset.idx);
					if(idx === q.correct){
						btn.classList.add('correct');
						correctAnswers++;
						changeMascot(MASCOT.happy, 'Excellent!');
						setTimeout(nextQuestion, 1000);
					}else{
						btn.classList.add('wrong');
						changeMascot(MASCOT.sad, 'Try again!');
						setTimeout(()=>{
							btn.classList.remove('wrong');
							changeMascot(MASCOT.teaching, 'Think carefully!');
						}, 1000);
					}
				});
			});
		}
		
		function nextQuestion(){
			currentQuestion++;
			if(currentQuestion < questions.length){
				showQuestion();
			}else{
				finishGrade9();
			}
		}
		
		function finishGrade9(){
			miniProgressBar.style.width = '100%';
			miniProgressText.textContent = 'Complete!';
			levelInstructions.textContent = `You got ${correctAnswers} out of ${questions.length} correct!`;
			answerArea.innerHTML = '<p style="text-align:center; font-size:18px; color:#28a745;">🎉 Phenomenal work!</p>';
			
			const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
			changeMascot(MASCOT.clap, quote);
			
			if(session.mode==='fast'){
				btnNext.disabled = false;
				session.completed = clamp(session.completed+1, 0, 12);
				progressText.textContent = `${session.completed}/12`;
				progressBar.style.width = `${(session.completed/12)*100}%`;
				if(session.completed>0 && session.completed%4===0){
					const elapsed = Date.now()-session.startTime;
					showToast(`🎉 You've completed ${session.completed} grades in ${fmtDuration(elapsed)}!`);
				}
			}else{
				// Normal mode - auto finish after short delay
				setTimeout(()=>{
					finishNormal();
				}, 2000);
			}
		}
		
		showQuestion();
	}

	/* Grade 10 Mini-Game */
	function startGrade10MiniGame(){
		miniProgressWrap.style.display = 'block';
		let currentQuestion = 0;
		let correctAnswers = 0;
		
		const questions = [
			{
				type: 'multiple-choice',
				question: 'Solve for x: x + 8 = 20',
				options: ['10', '12', '14', '18'],
				correct: 1
			},
			{
				type: 'multiple-choice',
				question: 'She _____ her homework before dinner.',
				instruction: 'Choose the correct verb tense',
				options: ['finish', 'finished'],
				correct: 1
			},
			{
				type: 'matching',
				question: 'Match each organ to what it does',
				pairs: [
					{icon: 'Heart', options: ['pumps blood', 'takes in oxygen', 'helps digest food'], correct: 0},
					{icon: 'Lungs', options: ['pumps blood', 'takes in oxygen', 'helps digest food'], correct: 1},
					{icon: 'Stomach', options: ['pumps blood', 'takes in oxygen', 'helps digest food'], correct: 2}
				]
			},
			{
				type: 'multiple-choice',
				question: 'Choose the correct spelling',
				options: ['finaly', 'finally'],
				correct: 1
			}
		];
		
		function updateMiniProgress(){
			const progress = (currentQuestion / questions.length) * 100;
			miniProgressText.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
			miniProgressBar.style.width = `${progress}%`;
		}
		
		function showQuestion(){
			updateMiniProgress();
			const q = questions[currentQuestion];
			
			if(q.type === 'multiple-choice'){
				showMultipleChoice(q);
			}else if(q.type === 'matching'){
				showMatching(q);
			}
		}
		
		function showMultipleChoice(q){
			if(q.instruction){
				levelInstructions.textContent = q.instruction;
			}else{
				levelInstructions.textContent = '';
			}
			let html = `<div class="quiz-question">${q.question}</div><div class="options">`;
			q.options.forEach((opt, idx)=>{
				html += `<button class="option-btn" data-idx="${idx}">${opt}</button>`;
			});
			html += '</div>';
			answerArea.innerHTML = html;
			
			document.querySelectorAll('.option-btn').forEach(btn=>{
				btn.addEventListener('click', ()=>{
					const idx = parseInt(btn.dataset.idx);
					if(idx === q.correct){
						btn.classList.add('correct');
						correctAnswers++;
						changeMascot(MASCOT.happy, 'Superb!');
						setTimeout(nextQuestion, 1000);
					}else{
						btn.classList.add('wrong');
						changeMascot(MASCOT.sad, 'Try again!');
						setTimeout(()=>{
							btn.classList.remove('wrong');
							changeMascot(MASCOT.teaching, 'Think carefully!');
						}, 1000);
					}
				});
			});
		}
		
		function showMatching(q){
			levelInstructions.textContent = '';
			let html = `<div class="quiz-question">${q.question}</div><div class="matching-game">`;
			q.pairs.forEach((pair, idx)=>{
				html += `<div class="match-item">
					<div class="match-icon">${pair.icon}</div>
					<select class="match-select" data-idx="${idx}">
						<option value="">Select...</option>`;
				pair.options.forEach((opt, optIdx)=>{
					html += `<option value="${optIdx}">${opt}</option>`;
				});
				html += `</select></div>`;
			});
			html += '</div><button class="btn primary submit-btn" id="submit-match">Submit</button>';
			answerArea.innerHTML = html;
			
			document.getElementById('submit-match').addEventListener('click', ()=>{
				const selects = document.querySelectorAll('.match-select');
				let allCorrect = true;
				selects.forEach(sel=>{
					const idx = parseInt(sel.dataset.idx);
					const selected = parseInt(sel.value);
					if(selected === q.pairs[idx].correct){
						sel.classList.add('correct');
						sel.disabled = true;
					}else{
						sel.classList.add('wrong');
						allCorrect = false;
					}
				});
				
				if(allCorrect){
					correctAnswers++;
					changeMascot(MASCOT.happy, 'Perfect matching!');
					setTimeout(nextQuestion, 1000);
				}else{
					changeMascot(MASCOT.sad, 'Some matches are wrong. Try again!');
					setTimeout(()=>{
						selects.forEach(sel=>{
							if(sel.classList.contains('wrong')){
								sel.classList.remove('wrong');
								sel.value = '';
							}
						});
						changeMascot(MASCOT.teaching, q.question);
					}, 1500);
				}
			});
		}
		
		function nextQuestion(){
			currentQuestion++;
			if(currentQuestion < questions.length){
				showQuestion();
			}else{
				finishGrade10();
			}
		}
		
		function finishGrade10(){
			miniProgressBar.style.width = '100%';
			miniProgressText.textContent = 'Complete!';
			levelInstructions.textContent = `You got ${correctAnswers} out of ${questions.length} correct!`;
			answerArea.innerHTML = '<p style="text-align:center; font-size:18px; color:#28a745;">🎉 Outstanding achievement!</p>';
			
			const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
			changeMascot(MASCOT.clap, quote);
			
			if(session.mode==='fast'){
				btnNext.disabled = false;
				session.completed = clamp(session.completed+1, 0, 12);
				progressText.textContent = `${session.completed}/12`;
				progressBar.style.width = `${(session.completed/12)*100}%`;
				if(session.completed>0 && session.completed%4===0){
					const elapsed = Date.now()-session.startTime;
					showToast(`🎉 You've completed ${session.completed} grades in ${fmtDuration(elapsed)}!`);
				}
			}else{
				// Normal mode - auto finish after short delay
				setTimeout(()=>{
					finishNormal();
				}, 2000);
			}
		}
		
		showQuestion();
	}

	/* Grade 11 Mini-Game */
	function startGrade11MiniGame(){
		miniProgressWrap.style.display = 'block';
		let currentQuestion = 0;
		let correctAnswers = 0;
		
		const questions = [
			{
				type: 'multiple-choice',
				question: 'Speed is distance divided by ______.',
				options: ['mass', 'force', 'time', 'energy'],
				correct: 2
			},
			{
				type: 'fill-blank',
				question: '10% of 250 = ______',
				correct: '25'
			},
			{
				type: 'multiple-choice',
				question: 'The word "beneficial" most nearly means…',
				options: ['harmful', 'noisy', 'helpful', 'rare'],
				correct: 2
			},
			{
				type: 'matching',
				question: 'Match each body system to its main function',
				pairs: [
					{icon: 'Circulatory', options: ['moves blood/nutrients', 'gas exchange (O₂ in, CO₂ out)', 'breaks down food'], correct: 0},
					{icon: 'Respiratory', options: ['moves blood/nutrients', 'gas exchange (O₂ in, CO₂ out)', 'breaks down food'], correct: 1},
					{icon: 'Digestive', options: ['moves blood/nutrients', 'gas exchange (O₂ in, CO₂ out)', 'breaks down food'], correct: 2}
				]
			}
		];
		
		function updateMiniProgress(){
			const progress = (currentQuestion / questions.length) * 100;
			miniProgressText.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
			miniProgressBar.style.width = `${progress}%`;
		}
		
		function showQuestion(){
			updateMiniProgress();
			const q = questions[currentQuestion];
			
			if(q.type === 'multiple-choice'){
				showMultipleChoice(q);
			}else if(q.type === 'fill-blank'){
				showFillBlank(q);
			}else if(q.type === 'matching'){
				showMatching(q);
			}
		}
		
		function showMultipleChoice(q){
			if(q.instruction){
				levelInstructions.textContent = q.instruction;
			}else{
				levelInstructions.textContent = '';
			}
			let html = `<div class="quiz-question">${q.question}</div><div class="options">`;
			q.options.forEach((opt, idx)=>{
				html += `<button class="option-btn" data-idx="${idx}">${opt}</button>`;
			});
			html += '</div>';
			answerArea.innerHTML = html;
			
			document.querySelectorAll('.option-btn').forEach(btn=>{
				btn.addEventListener('click', ()=>{
					const idx = parseInt(btn.dataset.idx);
					if(idx === q.correct){
						btn.classList.add('correct');
						correctAnswers++;
						changeMascot(MASCOT.happy, 'Brilliant!');
						setTimeout(nextQuestion, 1000);
					}else{
						btn.classList.add('wrong');
						changeMascot(MASCOT.sad, 'Try again!');
						setTimeout(()=>{
							btn.classList.remove('wrong');
							changeMascot(MASCOT.teaching, 'Think carefully!');
						}, 1000);
					}
				});
			});
		}
		
		function showFillBlank(q){
			levelInstructions.textContent = '';
			answerArea.innerHTML = `
				<div class="quiz-question">${q.question}</div>
				<div class="fill-blank">
					<input type="number" id="fill-input" placeholder="?" />
				</div>
				<button class="btn primary submit-btn" id="submit-fill">Submit</button>
			`;
			
			document.getElementById('submit-fill').addEventListener('click', ()=>{
				const input = document.getElementById('fill-input');
				if(input.value === q.correct){
					input.classList.add('correct');
					correctAnswers++;
					changeMascot(MASCOT.happy, 'Perfect!');
					setTimeout(nextQuestion, 1000);
				}else{
					input.classList.add('wrong');
					changeMascot(MASCOT.sad, 'Not quite!');
					setTimeout(()=>{
						input.classList.remove('wrong');
						input.value = '';
						changeMascot(MASCOT.teaching, 'Calculate carefully!');
					}, 1000);
				}
			});
		}
		
		function showMatching(q){
			levelInstructions.textContent = '';
			let html = `<div class="quiz-question">${q.question}</div><div class="matching-game">`;
			q.pairs.forEach((pair, idx)=>{
				html += `<div class="match-item">
					<div class="match-icon">${pair.icon}</div>
					<select class="match-select" data-idx="${idx}">
						<option value="">Select...</option>`;
				pair.options.forEach((opt, optIdx)=>{
					html += `<option value="${optIdx}">${opt}</option>`;
				});
				html += `</select></div>`;
			});
			html += '</div><button class="btn primary submit-btn" id="submit-match">Submit</button>';
			answerArea.innerHTML = html;
			
			document.getElementById('submit-match').addEventListener('click', ()=>{
				const selects = document.querySelectorAll('.match-select');
				let allCorrect = true;
				selects.forEach(sel=>{
					const idx = parseInt(sel.dataset.idx);
					const selected = parseInt(sel.value);
					if(selected === q.pairs[idx].correct){
						sel.classList.add('correct');
						sel.disabled = true;
					}else{
						sel.classList.add('wrong');
						allCorrect = false;
					}
				});
				
				if(allCorrect){
					correctAnswers++;
					changeMascot(MASCOT.happy, 'Excellent matching!');
					setTimeout(nextQuestion, 1000);
				}else{
					changeMascot(MASCOT.sad, 'Some matches are wrong. Try again!');
					setTimeout(()=>{
						selects.forEach(sel=>{
							if(sel.classList.contains('wrong')){
								sel.classList.remove('wrong');
								sel.value = '';
							}
						});
						changeMascot(MASCOT.teaching, q.question);
					}, 1500);
				}
			});
		}
		
		function nextQuestion(){
			currentQuestion++;
			if(currentQuestion < questions.length){
				showQuestion();
			}else{
				finishGrade11();
			}
		}
		
		function finishGrade11(){
			miniProgressBar.style.width = '100%';
			miniProgressText.textContent = 'Complete!';
			levelInstructions.textContent = `You got ${correctAnswers} out of ${questions.length} correct!`;
			answerArea.innerHTML = '<p style="text-align:center; font-size:18px; color:#28a745;">🎉 Spectacular performance!</p>';
			
			const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
			changeMascot(MASCOT.clap, quote);
			
			if(session.mode==='fast'){
				btnNext.disabled = false;
				session.completed = clamp(session.completed+1, 0, 12);
				progressText.textContent = `${session.completed}/12`;
				progressBar.style.width = `${(session.completed/12)*100}%`;
				if(session.completed>0 && session.completed%4===0){
					const elapsed = Date.now()-session.startTime;
					showToast(`🎉 You've completed ${session.completed} grades in ${fmtDuration(elapsed)}!`);
				}
			}else{
				// Normal mode - auto finish after short delay
				setTimeout(()=>{
					finishNormal();
				}, 2000);
			}
		}
		
		showQuestion();
	}

	/* Grade 12 Mini-Game - FINAL GRADE! */
	function startGrade12MiniGame(){
		miniProgressWrap.style.display = 'block';
		let currentQuestion = 0;
		let correctAnswers = 0;
		
		const questions = [
			{
				type: 'multiple-choice',
				question: 'Plants mainly release ______ during photosynthesis.',
				options: ['Nitrogen', 'Carbon dioxide', 'Oxygen', 'Helium'],
				correct: 2
			},
			{
				type: 'fill-blank',
				question: 'DNA is found in the cell ______',
				correct: 'nucleus'
			},
			{
				type: 'multiple-choice',
				question: 'The word "evaluate" most nearly means…',
				options: ['ignore', 'assess', 'confuse', 'announce'],
				correct: 1
			},
			{
				type: 'multiple-choice',
				question: 'Choose the correctly spelled word',
				options: ['reccomend', 'recommend'],
				correct: 1
			},
			{
				type: 'matching',
				question: 'Match each literary term to its definition',
				pairs: [
					{icon: 'Simile', options: ['comparison using "like" or "as"', 'direct comparison without "like/as"', 'deliberate exaggeration'], correct: 0},
					{icon: 'Metaphor', options: ['comparison using "like" or "as"', 'direct comparison without "like/as"', 'deliberate exaggeration'], correct: 1},
					{icon: 'Hyperbole', options: ['comparison using "like" or "as"', 'direct comparison without "like/as"', 'deliberate exaggeration'], correct: 2}
				]
			}
		];
		
		function updateMiniProgress(){
			const progress = (currentQuestion / questions.length) * 100;
			miniProgressText.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
			miniProgressBar.style.width = `${progress}%`;
		}
		
		function showQuestion(){
			updateMiniProgress();
			const q = questions[currentQuestion];
			
			if(q.type === 'multiple-choice'){
				showMultipleChoice(q);
			}else if(q.type === 'fill-blank'){
				showFillBlank(q);
			}else if(q.type === 'matching'){
				showMatching(q);
			}
		}
		
		function showMultipleChoice(q){
			if(q.instruction){
				levelInstructions.textContent = q.instruction;
			}else{
				levelInstructions.textContent = '';
			}
			let html = `<div class="quiz-question">${q.question}</div><div class="options">`;
			q.options.forEach((opt, idx)=>{
				html += `<button class="option-btn" data-idx="${idx}">${opt}</button>`;
			});
			html += '</div>';
			answerArea.innerHTML = html;
			
			document.querySelectorAll('.option-btn').forEach(btn=>{
				btn.addEventListener('click', ()=>{
					const idx = parseInt(btn.dataset.idx);
					if(idx === q.correct){
						btn.classList.add('correct');
						correctAnswers++;
						changeMascot(MASCOT.happy, 'Amazing!');
						setTimeout(nextQuestion, 1000);
					}else{
						btn.classList.add('wrong');
						changeMascot(MASCOT.sad, 'Try again!');
						setTimeout(()=>{
							btn.classList.remove('wrong');
							changeMascot(MASCOT.teaching, 'Think carefully!');
						}, 1000);
					}
				});
			});
		}
		
		function showFillBlank(q){
			levelInstructions.textContent = '';
			answerArea.innerHTML = `
				<div class="quiz-question">${q.question}</div>
				<div class="fill-blank">
					<input type="text" id="fill-input" placeholder="Type your answer" />
				</div>
				<button class="btn primary submit-btn" id="submit-fill">Submit</button>
			`;
			
			document.getElementById('submit-fill').addEventListener('click', ()=>{
				const input = document.getElementById('fill-input');
				const answer = input.value.trim().toLowerCase();
				if(answer === q.correct.toLowerCase()){
					input.classList.add('correct');
					correctAnswers++;
					changeMascot(MASCOT.happy, 'Perfect!');
					setTimeout(nextQuestion, 1000);
				}else{
					input.classList.add('wrong');
					changeMascot(MASCOT.sad, 'Not quite!');
					setTimeout(()=>{
						input.classList.remove('wrong');
						input.value = '';
						changeMascot(MASCOT.teaching, 'Think about it!');
					}, 1000);
				}
			});
		}
		
		function showMatching(q){
			levelInstructions.textContent = '';
			let html = `<div class="quiz-question">${q.question}</div><div class="matching-game">`;
			q.pairs.forEach((pair, idx)=>{
				html += `<div class="match-item">
					<div class="match-icon">${pair.icon}</div>
					<select class="match-select" data-idx="${idx}">
						<option value="">Select...</option>`;
				pair.options.forEach((opt, optIdx)=>{
					html += `<option value="${optIdx}">${opt}</option>`;
				});
				html += `</select></div>`;
			});
			html += '</div><button class="btn primary submit-btn" id="submit-match">Submit</button>';
			answerArea.innerHTML = html;
			
			document.getElementById('submit-match').addEventListener('click', ()=>{
				const selects = document.querySelectorAll('.match-select');
				let allCorrect = true;
				selects.forEach(sel=>{
					const idx = parseInt(sel.dataset.idx);
					const selected = parseInt(sel.value);
					if(selected === q.pairs[idx].correct){
						sel.classList.add('correct');
						sel.disabled = true;
					}else{
						sel.classList.add('wrong');
						allCorrect = false;
					}
				});
				
				if(allCorrect){
					correctAnswers++;
					changeMascot(MASCOT.happy, 'Outstanding!');
					setTimeout(nextQuestion, 1000);
				}else{
					changeMascot(MASCOT.sad, 'Some matches are wrong. Try again!');
					setTimeout(()=>{
						selects.forEach(sel=>{
							if(sel.classList.contains('wrong')){
								sel.classList.remove('wrong');
								sel.value = '';
							}
						});
						changeMascot(MASCOT.teaching, q.question);
					}, 1500);
				}
			});
		}
		
		function nextQuestion(){
			currentQuestion++;
			if(currentQuestion < questions.length){
				showQuestion();
			}else{
				finishGrade12();
			}
		}
		
		function finishGrade12(){
			miniProgressBar.style.width = '100%';
			miniProgressText.textContent = 'Complete!';
			levelInstructions.textContent = `You got ${correctAnswers} out of ${questions.length} correct!`;
			answerArea.innerHTML = '<p style="text-align:center; font-size:24px; color:#28a745;">🎓 OSSD COMPLETE! 🎓</p>';
			
			const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
			changeMascot(MASCOT.clap, quote);
			
			if(session.mode==='fast'){
				btnNext.disabled = false;
				session.completed = clamp(session.completed+1, 0, 12);
				progressText.textContent = `${session.completed}/12`;
				progressBar.style.width = `${(session.completed/12)*100}%`;
			}else{
				// Normal mode - auto finish after short delay
				setTimeout(()=>{
					finishNormal();
				}, 2000);
			}
		}
		
		showQuestion();
	}

	btnComplete.addEventListener('click', ()=>{
		// Placeholder success path
		const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
		changeMascot(MASCOT.happy, quote);
		btnNext.disabled = false;
		if(session.mode==='fast'){
			session.completed = clamp(session.completed+1, 0, 12);
			progressText.textContent = `${session.completed}/12`;
			progressBar.style.width = `${(session.completed/12)*100}%`;
			if(session.completed>0 && session.completed%4===0){
				const elapsed = Date.now()-session.startTime;
				showToast(`🎉 You’ve completed ${session.completed} grades in ${fmtDuration(elapsed)}!`);
			}
		}
	});

	btnNext.addEventListener('click', ()=>{
		const g = session.currentGrade;
		if(session.mode==='normal'){
			finishNormal();
			return;
		}
		if(g>=12){
			finishJourney();
			return;
		}
		session.currentGrade = g+1;
		loadGrade(session.currentGrade);
	});

btnExit.addEventListener('click', ()=>{
		// On Fast-Track, show reward screen with their progress
		if(session.mode==='fast' && session.startTime && session.completed>0){
			finishJourney();
		}else{
			stopTimer();
			navigate('home');
		}
	});

	/* Finishers */
function finishNormal(){
		// Show reward screen for Normal Mode too
		const gradeName = `Grade ${session.currentGrade}`;
		rewardMessage.textContent = `🎉 Congratulations, ${session.name}! You've completed ${gradeName}!`;
		canAccessReward = true;
		navigate('reward');
		confettiBurst();
		// Don't add to leaderboard for normal mode (only single grade)
}

	function finishJourney(){
		stopTimer();
		session.endTime = Date.now();
		const elapsed = session.endTime - session.startTime;
		const gradesDone = session.completed; // Use actual completed count
		const endGrade = session.startGrade + gradesDone - 1;
		const gradeRange = gradesDone === 1 ? `Grade ${session.startGrade}` : `Grades ${session.startGrade} - ${endGrade}`;
		rewardMessage.textContent = `🎉 Congratulations, ${session.name}! You've completed ${gradeRange} in ${fmtDuration(elapsed)}!`;
		canAccessReward = true; // Unlock reward page
		navigate('reward');
		confettiBurst();
		updateLeaderboard({ name: session.name, grades: gradesDone, ms: elapsed });
	}

	/* Leaderboard */
	function readLeaderboard(){
		try{
			return JSON.parse(localStorage.getItem('flexi:leaderboard')||'[]');
		}catch{ return []; }
	}
	function writeLeaderboard(rows){
		localStorage.setItem('flexi:leaderboard', JSON.stringify(rows.slice(0,25)));
	}
	function compareRows(a,b){
		if(b.grades!==a.grades) return b.grades-a.grades; // more grades first
		return a.ms-b.ms; // faster first
	}
	function updateLeaderboard(entry){
		const rows = readLeaderboard();
		rows.push(entry);
		rows.sort(compareRows);
		writeLeaderboard(rows);
	}
	function deleteEntry(index){
		const rows = readLeaderboard();
		rows.splice(index, 1);
		writeLeaderboard(rows);
		renderLeaderboard();
		showToast('Entry deleted');
	}
	function renderLeaderboard(){
		const rows = readLeaderboard();
		leaderboardList.innerHTML = '';
		rows.forEach((r, idx)=>{
			const li = document.createElement('li');
			li.innerHTML = `
				<span>${escapeHtml(r.name)}</span>
				<span class="leader-stats">
					<span>${r.grades} Grades – ${fmtDuration(r.ms)}</span>
					<button class="btn-delete" data-index="${idx}" aria-label="Delete entry">×</button>
				</span>
			`;
			leaderboardList.appendChild(li);
		});
		// Attach delete handlers
		document.querySelectorAll('.btn-delete').forEach(btn=>{
			btn.addEventListener('click', (e)=>{
				const index = parseInt(e.target.dataset.index, 10);
				deleteEntry(index);
			});
		});
	}
	function escapeHtml(s){
		return s.replace(/[&<>"]+/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
	}

	btnBackHome.addEventListener('click', ()=> navigate('home'));
	btnClearLeaderboard.addEventListener('click', ()=> {
		localStorage.removeItem('flexi:leaderboard');
		renderLeaderboard();
		showToast('Leaderboard cleared');
	});
	btnViewLeaderboard.addEventListener('click', ()=> navigate('leaderboard'));
	btnPlayAgain.addEventListener('click', ()=> {
		canAccessReward = false; // Reset reward access
		navigate('home');
	});

	/* Confetti (simple canvas) */
	const canvas = document.getElementById('confetti-canvas');
	const ctx = canvas.getContext('2d');
	let confettiItems = [];
	function resizeCanvas(){
		canvas.width = window.innerWidth; canvas.height = window.innerHeight;
	}
	function confettiBurst(){
		resizeCanvas();
		confettiItems = Array.from({length: 180}, ()=>({
			x: Math.random()*canvas.width,
			y: -20 - Math.random()*canvas.height*0.3,
			s: 6+Math.random()*8,
			vy: 2+Math.random()*3,
			vx: -1+Math.random()*2,
			rot: Math.random()*Math.PI,
			vr: -0.1+Math.random()*0.2,
			c: Math.random()>0.5? '#f06143' : '#00475a'
		}));
		requestAnimationFrame(tickConfetti);
	}
	function tickConfetti(){
		ctx.clearRect(0,0,canvas.width,canvas.height);
		let alive = false;
		for(const p of confettiItems){
			p.x += p.vx; p.y += p.vy; p.rot += p.vr;
			if(p.y<canvas.height+20){ alive = true; }
			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.rotate(p.rot);
			ctx.fillStyle = p.c;
			ctx.fillRect(-p.s/2, -p.s/2, p.s, p.s);
			ctx.restore();
		}
		if(alive) requestAnimationFrame(tickConfetti);
	}
	window.addEventListener('resize', resizeCanvas);

	/* Certificate Page */
	let cameraStream = null;

	btnDownloadCertificate.addEventListener('click', ()=>{
		// Populate certificate with student info
		certStudentName.textContent = session.name;
		if(session.mode === 'normal'){
			certAchievement.textContent = `Grade ${session.currentGrade}`;
		}else{
			const endGrade = session.startGrade + session.completed - 1;
			certAchievement.textContent = session.completed === 1 ? `Grade ${session.startGrade}` : `Grades ${session.startGrade} - ${endGrade}`;
		}
		const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
		certDateValue.textContent = today;
		
		// Reset camera state
		photoCanvas.classList.remove('show');
		cameraPreview.classList.remove('hide');
		btnRetakePhoto.style.display = 'none';
		btnCapturePhoto.style.display = 'inline-block';
		
		// Start camera
		startCamera();
		navigate('certificate');
	});

	function startCamera(){
		if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
			navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
				.then(stream => {
					cameraStream = stream;
					cameraPreview.srcObject = stream;
				})
				.catch(err => {
					console.error('Camera error:', err);
					showToast('Camera not available');
				});
		}else{
			showToast('Camera not supported on this device');
		}
	}

	function stopCamera(){
		if(cameraStream){
			cameraStream.getTracks().forEach(track => track.stop());
			cameraStream = null;
		}
	}

	btnCapturePhoto.addEventListener('click', ()=>{
		const ctx2 = photoCanvas.getContext('2d');
		photoCanvas.width = cameraPreview.videoWidth;
		photoCanvas.height = cameraPreview.videoHeight;
		ctx2.drawImage(cameraPreview, 0, 0);
		
		// Show captured photo, hide video
		photoCanvas.classList.add('show');
		cameraPreview.classList.add('hide');
		btnCapturePhoto.style.display = 'none';
		btnRetakePhoto.style.display = 'inline-block';
		
		stopCamera();
		showToast('Photo captured!');
	});

	btnRetakePhoto.addEventListener('click', ()=>{
		photoCanvas.classList.remove('show');
		cameraPreview.classList.remove('hide');
		btnRetakePhoto.style.display = 'none';
		btnCapturePhoto.style.display = 'inline-block';
		startCamera();
	});

	btnPrintCert.addEventListener('click', ()=>{
		window.print();
	});

	btnBackToReward.addEventListener('click', ()=>{
		stopCamera();
		navigate('reward');
	});

	// Stop camera when leaving certificate page
	window.addEventListener('hashchange', ()=>{
		if(!window.location.hash.includes('certificate')){
			stopCamera();
		}
	});

})();


