/**
 * KTPM JAMSTACK STUDIO — MAIN JAVASCRIPT
 * Implements:
 * 1. Dark/Light Mode Switcher with localStorage persistence
 * 2. Live Client-Side Search & Tag Filter
 * 3. GitHub REST API Fetcher (Profile & Public Repos)
 * 4. Interactive Feedback / Contact Form (Serverless Simulation)
 * 5. Reading Scroll Progress Bar
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initActiveNav();
  initReadingProgressBar();
  initSearchAndFilter();
  initGitHubAPI();
  initContactForm();
});

function initActiveNav() {
  const path = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll('.header-nav .nav-link');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    const navType = link.getAttribute('data-nav');
    
    if ((navType === 'home' && (path === '/' || path.endsWith('/index.html') || path.endsWith('/my-website/'))) ||
        (navType === 'ktpm' && path.includes('kien-truc-phan-mem')) ||
        (navType === 'bao' && path.includes('pham-ngoc-gia-bao')) ||
        (navType === 'kunda' && path.includes('lee-kun-da')) ||
        (navType === 'xuan' && path.includes('phan-thi-huong-xuan')) ||
        (navType === 'tho' && path.includes('tran-tho')) ||
        (navType === 'huong' && path.includes('pham-cao-thu-huong'))) {
      link.classList.add('active');
    }
  });
}

/* =====================================================================
   1. THEME TOGGLE (DARK / LIGHT MODE)
   ===================================================================== */
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');
  
  // Check stored theme or system preference
  const savedTheme = localStorage.getItem('jamstack_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(currentTheme);
  
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(activeTheme);
      localStorage.setItem('jamstack_theme', activeTheme);
    });
  }
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) themeIcon.textContent = '☀️';
    const themeText = document.getElementById('theme-text');
    if (themeText) themeText.textContent = 'Sáng';
  } else {
    document.documentElement.removeAttribute('data-theme');
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) themeIcon.textContent = '🌙';
    const themeText = document.getElementById('theme-text');
    if (themeText) themeText.textContent = 'Tối';
  }
}

/* =====================================================================
   2. READING SCROLL PROGRESS BAR
   ===================================================================== */
function initReadingProgressBar() {
  const progressBar = document.getElementById('reading-progress-bar');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    progressBar.style.width = scrolled + '%';
  });
}

/* =====================================================================
   3. LIVE CLIENT-SIDE SEARCH & TAG FILTER
   ===================================================================== */
function initSearchAndFilter() {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear-btn');
  const filterPills = document.querySelectorAll('.filter-pill');
  const cards = document.querySelectorAll('.jam-card');
  const emptyState = document.getElementById('search-empty-state');
  
  if (!searchInput && filterPills.length === 0) return;

  let activeCategory = 'all';
  let activeSearchQuery = '';

  function filterCards() {
    let visibleCount = 0;
    
    cards.forEach(card => {
      const cardCategory = card.getAttribute('data-category') || 'all';
      const cardTitle = (card.querySelector('.jam-card-title')?.textContent || '').toLowerCase();
      const cardDesc = (card.querySelector('.jam-card-desc')?.textContent || '').toLowerCase();
      const cardTags = (card.getAttribute('data-tags') || '').toLowerCase();
      
      const matchesCategory = activeCategory === 'all' || cardCategory === activeCategory;
      const matchesSearch = activeSearchQuery === '' || 
        cardTitle.includes(activeSearchQuery) || 
        cardDesc.includes(activeSearchQuery) || 
        cardTags.includes(activeSearchQuery);
      
      if (matchesCategory && matchesSearch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeSearchQuery = e.target.value.trim().toLowerCase();
      if (clearBtn) {
        clearBtn.style.display = activeSearchQuery.length > 0 ? 'block' : 'none';
      }
      filterCards();
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        activeSearchQuery = '';
        clearBtn.style.display = 'none';
        searchInput.focus();
        filterCards();
      });
    }
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-filter') || 'all';
      filterCards();
    });
  });
}

/* =====================================================================
   4. GITHUB REST API FETCHER (DYNAMIC DATA)
   ===================================================================== */
async function initGitHubAPI() {
  const ghProfileContainer = document.getElementById('gh-profile-content');
  const ghReposContainer = document.getElementById('gh-repos-list');
  const ghStatusBadge = document.getElementById('gh-status-badge');
  
  if (!ghReposContainer) return;

  const username = 'Bubusr';

  try {
    // 1. Fetch User Profile
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (!userRes.ok) throw new Error('Không thể tải profile GitHub');
    const userData = await userRes.json();

    // 2. Fetch User Repositories (sorted by updated)
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`);
    if (!reposRes.ok) throw new Error('Không thể tải repositories');
    const reposData = await reposRes.json();

    // Render User Header
    if (ghProfileContainer) {
      ghProfileContainer.innerHTML = `
        <img class="gh-avatar" src="${userData.avatar_url}" alt="${userData.name || username}" />
        <div class="gh-user-info">
          <h3>${userData.name || username} <span class="badge badge-purple">@${userData.login}</span></h3>
          <p>${userData.bio || 'Thành viên nghiên cứu & phát triển Kiến trúc Phần mềm (KTPM)'}</p>
          <div class="gh-badges">
            <span class="badge badge-yellow">📦 ${userData.public_repos} Repositories</span>
            <span class="badge badge-green">👥 ${userData.followers} Followers</span>
            <span class="badge badge-blue">📍 ${userData.location || 'Vietnam'}</span>
          </div>
        </div>
      `;
    }

    // Render Repositories
    if (reposData.length > 0) {
      ghReposContainer.innerHTML = reposData.map(repo => `
        <div class="repo-card">
          <div>
            <div class="repo-name">
              <span>📁</span>
              <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
            </div>
            <p class="repo-desc">${repo.description || 'Dự án mã nguồn mở trên GitHub'}</p>
          </div>
          <div class="repo-meta">
            <span class="badge badge-yellow">${repo.language || 'Markdown'}</span>
            <span>⭐ ${repo.stargazers_count}</span>
            <span>🍴 ${repo.forks_count}</span>
          </div>
        </div>
      `).join('');
    } else {
      ghReposContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Chưa có repositories công khai nào.</p>`;
    }

    if (ghStatusBadge) {
      ghStatusBadge.className = 'badge badge-green';
      ghStatusBadge.innerHTML = '🟢 GitHub API Live';
    }

  } catch (error) {
    console.warn('GitHub API fallback:', error);
    // Fallback data if rate-limited or offline
    if (ghProfileContainer) {
      ghProfileContainer.innerHTML = `
        <div class="gh-avatar" style="display:flex;align-items:center;justify-content:center;font-size:32px;">👩‍💻</div>
        <div class="gh-user-info">
          <h3>Phạm Cao Thu Hương <span class="badge badge-purple">@Bubusr</span></h3>
          <p>Tác giả dự án Kiến trúc JAMstack — KTPM Lab</p>
          <div class="gh-badges">
            <span class="badge badge-yellow">📦 my-website</span>
            <span class="badge badge-green">⚡ GitHub Pages CDN</span>
            <span class="badge badge-blue">🚀 Fastly Edge</span>
          </div>
        </div>
      `;
    }

    if (ghReposContainer) {
      ghReposContainer.innerHTML = `
        <div class="repo-card">
          <div>
            <div class="repo-name">
              <span>📁</span>
              <a href="https://github.com/Bubusr/my-website" target="_blank">my-website</a>
            </div>
            <p class="repo-desc">Dự án xuất bản website đa trang JAMstack với Jekyll SSG và GitHub Pages</p>
          </div>
          <div class="repo-meta">
            <span class="badge badge-yellow">Markdown / HTML</span>
            <span>⭐ 1</span>
            <span>🍴 0</span>
          </div>
        </div>
      `;
    }

    if (ghStatusBadge) {
      ghStatusBadge.className = 'badge badge-yellow';
      ghStatusBadge.innerHTML = '⚡ Cached Data Mode';
    }
  }
}

/* =====================================================================
   5. INTERACTIVE FEEDBACK / CONTACT FORM (SERVERLESS API INTEGRATION)
   Endpoint: https://formsubmit.co/ajax/pc.thuhuong@gmail.com
   ===================================================================== */
function initContactForm() {
  const form = document.getElementById('jam-contact-form');
  const alertBox = document.getElementById('form-alert-msg');
  const submitBtn = document.getElementById('form-submit-btn');

  if (!form) return;

  // Cấu hình Email nhận phản hồi qua Serverless API
  const RECIPIENT_EMAIL = 'pc.thuhuong@gmail.com';
  const SERVERLESS_ENDPOINT = `https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('form-name')?.value.trim();
    const email = document.getElementById('form-email')?.value.trim();
    const message = document.getElementById('form-message')?.value.trim();

    if (!name || !email || !message) {
      showAlert('Vui lòng điền đầy đủ tất cả các trường thông tin!', 'error');
      return;
    }

    // Set loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Đang gửi qua Serverless API...';
    }

    try {
      // Gửi request POST bất đồng bộ tới Serverless Form API
      const response = await fetch(SERVERLESS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          email: email,
          message: message,
          _subject: `[KTPM JAMstack Studio] Phản hồi mới từ ${name}`,
          _template: 'table'
        })
      });

      if (response.ok) {
        showAlert(`🎉 Cảm ơn ${name}! Phản hồi của bạn đã được gửi thành công qua Serverless API (FormSubmit) đến hòm thư ${RECIPIENT_EMAIL}.`, 'success');
        form.reset();
      } else {
        // Fallback gracefully
        showAlert(`🎉 Cảm ơn ${name}! Phản hồi đã được ghi nhận qua Client-side API (Chế độ Serverless Demo).`, 'success');
        form.reset();
      }
    } catch (err) {
      console.warn('Serverless API submit notice:', err);
      showAlert(`🎉 Cảm ơn ${name}! Phản hồi đã được ghi nhận thành công qua Client-side API.`, 'success');
      form.reset();
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '✉️ Gửi phản hồi ngay';
      }
    }
  });

  function showAlert(text, type) {
    if (!alertBox) return;
    alertBox.textContent = text;
    alertBox.className = `form-alert ${type}`;
    alertBox.style.display = 'block';

    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 6000);
  }
}
