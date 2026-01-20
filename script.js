// 데이터 저장소
let students = [];
let votes = {};
let voters = [];

// 관리자 비밀번호 (원하는 비밀번호로 변경 가능)
const ADMIN_PASSWORD = "1234";

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateStudentList();
});

// 로컬 스토리지에서 데이터 로드
function loadData() {
    const savedStudents = localStorage.getItem('students');
    const savedVotes = localStorage.getItem('votes');
    const savedVoters = localStorage.getItem('voters');
    
    if (savedStudents) students = JSON.parse(savedStudents);
    if (savedVotes) votes = JSON.parse(savedVotes);
    if (savedVoters) voters = JSON.parse(savedVoters);
}

// 로컬 스토리지에 데이터 저장
function saveData() {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('votes', JSON.stringify(votes));
    localStorage.setItem('voters', JSON.stringify(voters));
}

// 학생 추가
function addStudent() {
    const nameInput = document.getElementById('studentName');
    const numberInput = document.getElementById('studentNumber');
    
    const name = nameInput.value.trim();
    const number = numberInput.value.trim();
    
    if (!name || !number) {
        alert('이름과 학번을 모두 입력해주세요.');
        return;
    }
    
    // 중복 체크
    const isDuplicate = students.some(s => 
        s.name === name || s.number === number
    );
    
    if (isDuplicate) {
        alert('이미 등록된 이름이나 학번입니다.');
        return;
    }
    
    // 학생 추가
    students.push({
        id: Date.now(),
        name: name,
        number: number
    });
    
    // 투표 초기화
    votes[students[students.length - 1].id] = 0;
    
    // 입력 필드 초기화
    nameInput.value = '';
    numberInput.value = '';
    
    // UI 업데이트
    updateStudentList();
    saveData();
    
    // 첫 번째 입력창에 포커스
    nameInput.focus();
}

// 학생 목록 업데이트
function updateStudentList() {
    const listContainer = document.getElementById('studentList');
    const countElement = document.getElementById('studentCount');
    
    countElement.textContent = students.length;
    
    if (students.length === 0) {
        listContainer.innerHTML = '<div class="empty-message">등록된 학생이 없습니다.</div>';
        return;
    }
    
    listContainer.innerHTML = students.map(student => `
        <div class="student-item">
            <div class="student-info">
                <div class="student-name">${student.name}</div>
                <div class="student-number">학번: ${student.number}</div>
            </div>
            <button class="remove-btn" onclick="removeStudent(${student.id})">삭제</button>
        </div>
    `).join('');
}

// 학생 삭제
function removeStudent(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    students = students.filter(s => s.id !== id);
    delete votes[id];
    
    updateStudentList();
    saveData();
}

// 투표 시작
function startVoting() {
    if (students.length < 2) {
        alert('최소 2명 이상의 학생을 등록해주세요.');
        return;
    }
    
    // 투표자 선택 목록 업데이트
    updateVoterSelect();
    
    // 투표 선택지 초기 업데이트
    updateVoteOptions();
    
    // 화면 전환
    document.getElementById('adminInterface').classList.add('hidden');
    document.getElementById('voterInterface').classList.remove('hidden');
}

// 투표자 선택 목록 업데이트
function updateVoterSelect() {
    const voterSelect = document.getElementById('voterSelect');
    
    const options = students.map(student => 
        `<option value="${student.id}">${student.name} (${student.number})</option>`
    ).join('');
    
    voterSelect.innerHTML = '<option value="">선택하세요</option>' + options;
    
    // 투표자 선택 시 선택지 업데이트
    voterSelect.addEventListener('change', updateVoteOptions);
}

// 투표 선택지 업데이트
function updateVoteOptions() {
    const firstChoice = document.getElementById('firstChoice');
    const secondChoice = document.getElementById('secondChoice');
    const voterSelect = document.getElementById('voterSelect');
    const voterId = voterSelect.value;
    
    // 자기 자신 제외한 학생 목록
    const availableStudents = students.filter(student => 
        student.id != voterId
    );
    
    const options = availableStudents.map(student => 
        `<option value="${student.id}">${student.name} (${student.number})</option>`
    ).join('');
    
    firstChoice.innerHTML = '<option value="">선택하세요</option>' + options;
    secondChoice.innerHTML = '<option value="">선택하세요</option>' + options;
}

// 실시간 투표 현황 업데이트
function updateLiveStats() {
    const statsContainer = document.getElementById('liveVoteStats');
    
    if (voters.length === 0) {
        statsContainer.innerHTML = '<div class="empty-message" style="padding: 10px;">아직 투표가 없습니다</div>';
        return;
    }
    
    // 득표수 기준으로 정렬
    const sortedStudents = students
        .map(student => ({
            ...student,
            voteCount: votes[student.id] || 0
        }))
        .sort((a, b) => b.voteCount - a.voteCount);
    
    statsContainer.innerHTML = sortedStudents.map(student => `
        <div class="candidate-votes">
            <span class="candidate-name">${student.name}</span>
            <span class="votes-number">${student.voteCount}표</span>
        </div>
    `).join('');
}

// 투표 제출
function submitVote() {
    const voterSelect = document.getElementById('voterSelect');
    const voterId = voterSelect.value;
    const firstChoice = document.getElementById('firstChoice').value;
    const secondChoice = document.getElementById('secondChoice').value;
    
    // 유효성 검사
    if (!voterId) {
        alert('본인을 선택해주세요.');
        return;
    }
    
    // 중복 투표 확인
    const alreadyVoted = voters.find(v => v.voterId == voterId);
    if (alreadyVoted) {
        alert('이미 투표를 완료했습니다!');
        return;
    }
    
    if (!firstChoice || !secondChoice) {
        alert('두 명을 모두 선택해주세요.');
        return;
    }
    
    if (firstChoice === secondChoice) {
        alert('서로 다른 학생을 선택해주세요.');
        return;
    }
    
    // 투표자 정보 찾기
    const voter = students.find(s => s.id == voterId);
    
    // 투표 기록
    votes[firstChoice] = (votes[firstChoice] || 0) + 1;
    votes[secondChoice] = (votes[secondChoice] || 0) + 1;
    
    voters.push({
        voterId: voterId,
        name: voter.name,
        number: voter.number,
        timestamp: new Date().toISOString(),
        choices: [firstChoice, secondChoice]
    });
    
    saveData();
    
    // 입력 초기화
    voterSelect.value = '';
    document.getElementById('firstChoice').value = '';
    document.getElementById('secondChoice').value = '';
    
    alert('투표가 완료되었습니다!');
    
    // 투표자 선택으로 포커스
    voterSelect.focus();
}

// 관리자 로그인 모달 표시
function showAdminLogin() {
    document.getElementById('adminModal').classList.add('active');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
}

// 관리자 모달 닫기
function closeAdminModal() {
    document.getElementById('adminModal').classList.remove('active');
}

// 관리자 비밀번호 확인
function checkAdminPassword() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        closeAdminModal();
        showResults();
    } else {
        alert('비밀번호가 틀렸습니다.');
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

// 결과 보기
function showResults() {
    if (voters.length === 0) {
        alert('아직 투표가 없습니다.');
        return;
    }
    
    // 득표수 기준으로 정렬
    const sortedStudents = students
        .map(student => ({
            ...student,
            voteCount: votes[student.id] || 0
        }))
        .sort((a, b) => b.voteCount - a.voteCount);
    
    // 1, 2위 정보 표시
    if (sortedStudents.length >= 1) {
        document.getElementById('firstWinner').textContent = sortedStudents[0].name;
        document.getElementById('firstWinnerNumber').textContent = `학번: ${sortedStudents[0].number}`;
        document.getElementById('firstWinnerVotes').textContent = `${sortedStudents[0].voteCount}표`;
    }
    
    if (sortedStudents.length >= 2) {
        document.getElementById('secondWinner').textContent = sortedStudents[1].name;
        document.getElementById('secondWinnerNumber').textContent = `학번: ${sortedStudents[1].number}`;
        document.getElementById('secondWinnerVotes').textContent = `${sortedStudents[1].voteCount}표`;
    }
    
    // 통계 정보
    document.getElementById('totalVoters').textContent = `${voters.length}명`;
    
    const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
    document.getElementById('totalVotes').textContent = `${totalVotes}표`;
    
    // 실시간 투표 현황 업데이트
    updateLiveStats();
    
    // 투표 내역 테이블 업데이트
    updateVoteDetailTable();
    
    // 화면 전환
    document.getElementById('voterInterface').classList.add('hidden');
    document.getElementById('resultInterface').classList.remove('hidden');
}

// 투표 내역 테이블 업데이트
function updateVoteDetailTable() {
    const tableBody = document.getElementById('voteDetailBody');
    
    if (voters.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">투표 내역이 없습니다</td></tr>';
        return;
    }
    
    tableBody.innerHTML = voters.map((voter, index) => {
        // 투표자가 선택한 학생들 이름 찾기
        const choice1 = students.find(s => s.id == voter.choices[0]);
        const choice2 = students.find(s => s.id == voter.choices[1]);
        
        const choice1Name = choice1 ? choice1.name : '알 수 없음';
        const choice2Name = choice2 ? choice2.name : '알 수 없음';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${voter.name}</strong></td>
                <td class="vote-choices">${choice1Name}, ${choice2Name}</td>
            </tr>
        `;
    }).join('');
}

// 투표 화면으로 돌아가기
function backToVoting() {
    document.getElementById('resultInterface').classList.add('hidden');
    document.getElementById('voterInterface').classList.remove('hidden');
}

// 전체 초기화
function resetAll() {
    if (!confirm('모든 데이터를 초기화하시겠습니까? (학생 목록, 투표 기록 모두 삭제됩니다)')) {
        return;
    }
    
    students = [];
    votes = {};
    voters = [];
    
    localStorage.clear();
    
    updateStudentList();
    
    document.getElementById('resultInterface').classList.add('hidden');
    document.getElementById('adminInterface').classList.remove('hidden');
}

// Enter 키로 학생 추가
document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('studentName');
    const numberInput = document.getElementById('studentNumber');
    const adminPassword = document.getElementById('adminPassword');
    
    if (nameInput && numberInput) {
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                numberInput.focus();
            }
        });
        
        numberInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addStudent();
            }
        });
    }
    
    if (adminPassword) {
        adminPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkAdminPassword();
            }
        });
    }
});
