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

	function loadGrade(g, first=false){
		gradeNumber.textContent = String(g);
		levelBg.style.backgroundImage = `url('${bgForGrade(g)}')`;
		mascotImg.src = MASCOT.teaching;
		mascotSay.textContent = first 
			? `Hi ${session.name}! Welcome to Grade ${g}.`
			: `Onward to Grade ${g}!`;
		btnNext.disabled = true;
		if(session.mode==='fast'){
			const done = session.completed;
			progressText.textContent = `${done}/12`;
			progressBar.style.width = `${(done/12)*100}%`;
			if(first) startTimer();
		}
	}

	btnComplete.addEventListener('click', ()=>{
		// Placeholder success path
		mascotImg.src = MASCOT.happy;
		const quote = FUNNY_COMMENTS[Math.floor(Math.random()*FUNNY_COMMENTS.length)];
		mascotSay.textContent = quote;
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
		rewardMessage.textContent = `🎉 Congratulations, ${session.name}! You've completed ${gradesDone} grade${gradesDone !== 1 ? 's' : ''} in ${fmtDuration(elapsed)}!`;
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
			certAchievement.textContent = `${session.completed} Grade${session.completed !== 1 ? 's' : ''}`;
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


