let selectedCandidates = {}; // {position: candidateId}

const positions = ['President', 'Vice President', 'Secretary', 'Auditor', 'Treasurer', 'PIO'];

// Load candidates on page load
document.addEventListener('DOMContentLoaded', loadCandidates);

// Dynamic form logic for grade and strand
document.getElementById('grade').addEventListener('change', function() {
  const grade = parseInt(this.value);
  const strandSelect = document.getElementById('strand');
  const tvlSubSelect = document.getElementById('tvlSub');
  if (grade === 11 || grade === 12) {
    strandSelect.style.display = 'block';
    strandSelect.required = true;
  } else {
    strandSelect.style.display = 'none';
    strandSelect.required = false;
    tvlSubSelect.style.display = 'none';
    tvlSubSelect.required = false;
  }
});

document.getElementById('strand').addEventListener('change', function() {
  const tvlSubSelect = document.getElementById('tvlSub');
  if (this.value === 'TVL') {
    tvlSubSelect.style.display = 'block';
    tvlSubSelect.required = true;
  } else {
    tvlSubSelect.style.display = 'none';
    tvlSubSelect.required = false;
  }
});

// Login form submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const lrn = document.getElementById('lrn').value.trim();
  const name = document.getElementById('name').value.trim();
  const grade = parseInt(document.getElementById('grade').value);
  const section = document.getElementById('section').value.trim();
  let strand = document.getElementById('strand').value;
  if (strand === 'TVL') {
    strand += ' - ' + document.getElementById('tvlSub').value;
  }

  // Validation
  if (!lrn || !name || !grade || !section) {
    alert('Please fill all required fields.');
    return;
  }
  if (grade < 7 || grade > 12) {
    alert('Invalid grade.');
    return;
  }
  if ((grade === 11 || grade === 12) && !strand) {
    alert('Strand is required for grades 11-12.');
    return;
  }

  // Check if LRN already voted
  const voters = JSON.parse(localStorage.getItem('voters') || '[]');
  if (voters.some(v => v.lrn === lrn)) {
    alert('This LRN has already voted. You can only vote once.');
    // Show results directly if already voted
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('votingSection').style.display = 'block';
    document.getElementById('candidates').style.display = 'none';
    document.getElementById('voteBtn').style.display = 'none';
    loadResults();
    return;
  }

  // Store voter data
  voters.push({ lrn, name, grade, section, strand: strand || null });
  localStorage.setItem('voters', JSON.stringify(voters));

  // Show voting section
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('votingSection').style.display = 'block';
});

function loadCandidates() {
  const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
  const container = document.getElementById('candidates');
  container.innerHTML = '';
  positions.forEach(position => {
    const positionCandidates = candidates.filter(c => c.position === position);
    if (positionCandidates.length === 0) return;
    const section = document.createElement('div');
    section.className = 'position-section';
    section.innerHTML = `<h3>${position}</h3>`;
    positionCandidates.forEach(candidate => {
      const div = document.createElement('div');
      div.className = 'candidate';
      div.innerHTML = `
        <img src="${candidate.image}" alt="${candidate.name}">
        <span>${candidate.name}</span>
      `;
      div.onclick = () => selectCandidate(position, candidate.id, div);
      section.appendChild(div);
    });
    container.appendChild(section);
  });
  checkVoteBtn();
}

function selectCandidate(position, id, element) {
  // Deselect previous in this position
  const positionSection = element.closest('.position-section');
  positionSection.querySelectorAll('.candidate').forEach(c => c.classList.remove('selected'));
  element.classList.add('selected');
  selectedCandidates[position] = id;
  checkVoteBtn();
}

function checkVoteBtn() {
  const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
  const hasAll = positions.every(pos => {
    const posCandidates = candidates.filter(c => c.position === pos);
    return posCandidates.length === 0 || selectedCandidates[pos];
  });
  document.getElementById('voteBtn').disabled = !hasAll;
  // Update progress indicator
  const selectedCount = Object.keys(selectedCandidates).length;
  const totalPositions = positions.filter(pos => candidates.some(c => c.position === pos)).length;
  const progressText = `Selected ${selectedCount} of ${totalPositions} positions`;
  document.getElementById('voteProgress').textContent = progressText;
}

document.getElementById('voteBtn').onclick = () => {
  if (Object.keys(selectedCandidates).length === 0) return;

  // Get current voter
  const voters = JSON.parse(localStorage.getItem('voters') || '[]');
  const currentVoter = voters[voters.length - 1];

  // Store votes
  const votes = JSON.parse(localStorage.getItem('votes') || '[]');
  Object.keys(selectedCandidates).forEach(position => {
    votes.push({ position, candidateId: selectedCandidates[position], voterLrn: currentVoter.lrn });
  });
  localStorage.setItem('votes', JSON.stringify(votes));

  alert('Votes submitted! You can only vote once.');
  // Hide voting
  document.getElementById('candidates').style.display = 'none';
  document.getElementById('voteBtn').style.display = 'none';
  document.getElementById('voteProgress').style.display = 'none';
  loadResults();
};

function loadResults() {
  const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
  const votes = JSON.parse(localStorage.getItem('votes') || '[]');
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '<h2>Results</h2>';
  positions.forEach(position => {
    const posCandidates = candidates.filter(c => c.position === position);
    if (posCandidates.length === 0) return;
    const posVotes = votes.filter(v => v.position === position);
    const results = {};
    let totalVotes = 0;
    posCandidates.forEach(c => results[c.name] = 0);
    posVotes.forEach(v => {
      const candidate = posCandidates.find(c => c.id === v.candidateId);
      if (candidate) {
        results[candidate.name]++;
        totalVotes++;
      }
    });
    const maxVotes = Math.max(...Object.values(results));
    resultsDiv.innerHTML += `<h3>${position}</h3>`;
    Object.keys(results).forEach(name => {
      const votes = results[name];
      const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
      const isWinner = votes === maxVotes && votes > 0;
      resultsDiv.innerHTML += `
        <div class="result-item ${isWinner ? 'winner' : ''}">
          <strong>${name}${isWinner ? ' (Winner)' : ''}</strong>: ${votes} votes (${percentage}%)
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    });
  });
}
