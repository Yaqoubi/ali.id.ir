// ============================================================
// کوییزنر (Quizner) - اسکریپت اصلی مدیریت و طراحی آزمون
// ============================================================

(function () {
  'use strict';

  // State Management
  const state = {
    selectedBookId: 'motaleat6',
    selectedLessons: [1, 2, 3], // Default selected lessons
    questionCount: 10,
    paperFormat: 'a4', // 'a4' | 'a5'
    includeAnswerKey: true,
    hasAnswerLines: true,
    answerLinesCount: 3,
    paginationMode: 'auto',
    headerSettings: {
      bismillah: 'به نام خدا',
      schoolName: 'دبستان شهید قائمی',
      educationDept: 'آموزش و پرورش شهرستان جویبار',
      examTitle: 'آزمونک ارزشیابی کلاسی',
      grade: 'پایه ششم ابتدایی',
      subject: 'مطالعات اجتماعی',
      lessonsStr: 'درس‌های ۱، ۲ و ۳',
      date: getTodayPersianDate(),
      duration: '۴۵ دقیقه',
      designerCredit: 'طراحی توسط سامانه www.ali.id.ir'
    },
    currentQuestions: [],
    poolQuestions: []
  };

  // Convert English digits to Persian
  function toPersianDigits(n) {
    if (n === null || n === undefined) return '';
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(n).replace(/[0-9]/g, function (d) {
      return persianDigits[parseInt(d, 10)];
    });
  }

  // Generate Persian Date (Shamsi approximate format)
  function getTodayPersianDate() {
    try {
      const now = new Date();
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now);
    } catch (e) {
      return '۱۴۰۳/۰۸/۱۵';
    }
  }

  // Initialize App
  function init() {
    if (!window.QUIZ_BOOKS) {
      console.error('Quizner Database not found! Please check js/data.js.');
      alert('خطا در بارگذاری اطلاعات دروس. لطفاً فایل js/data.js را بررسی نمایید.');
      return;
    }

    renderBookSelector();
    bindEvents();
    updatePrintPageStyle();
    selectBook(state.selectedBookId, true);
  }

  // Render Book Selection Cards
  function renderBookSelector() {
    const container = document.getElementById('book-selector-grid');
    if (!container) return;

    const books = window.QUIZ_SUMMARY ? window.QUIZ_SUMMARY.subjects : [];
    container.innerHTML = '';

    books.forEach(b => {
      const card = document.createElement('div');
      card.className = `book-card ${b.id === state.selectedBookId ? 'active' : ''}`;
      card.dataset.bookId = b.id;

      const gradeTagClass = b.grade.includes('ششم') ? 'tag-grade6' : 'tag-grade4';

      card.innerHTML = `
        <span class="grade-tag ${gradeTagClass}">${b.grade}</span>
        <div class="book-name">${b.subject}</div>
        <div class="q-count">${toPersianDigits(b.total_lessons)} درس | ${toPersianDigits(b.total_questions)} سوال</div>
      `;

      card.addEventListener('click', () => {
        selectBook(b.id);
      });

      container.appendChild(card);
    });
  }

  // Select a Book
  function selectBook(bookId, isInitial = false) {
    state.selectedBookId = bookId;

    // Update active book card in UI
    document.querySelectorAll('.book-card').forEach(c => {
      c.classList.toggle('active', c.dataset.bookId === bookId);
    });

    const bookData = window.QUIZ_BOOKS[bookId];
    if (!bookData) return;

    // Update defaults in header settings
    state.headerSettings.grade = bookData.metadata.grade;
    state.headerSettings.subject = bookData.metadata.subject;

    // Reset selected lessons (default select first 3 lessons or all if <= 3)
    const validLessons = bookData.lessons.filter(l => l.questions && l.questions.length > 0);
    if (isInitial && state.selectedLessons.length > 0) {
      // Keep initial
    } else {
      state.selectedLessons = validLessons.slice(0, Math.min(3, validLessons.length)).map(l => l.lesson_number);
    }

    renderLessonsList();
    updateLessonsHeaderString();
    updateHeaderInputs();
    updateQuestionPool();
    generateExam();
  }

  // Render Lessons Checklist
  function renderLessonsList() {
    const container = document.getElementById('lessons-list');
    if (!container) return;

    const bookData = window.QUIZ_BOOKS[state.selectedBookId];
    if (!bookData) return;

    container.innerHTML = '';

    bookData.lessons.forEach(lesson => {
      const qCount = lesson.questions ? lesson.questions.length : 0;
      const isChecked = state.selectedLessons.includes(lesson.lesson_number);
      const isDeleted = lesson.status && lesson.status.includes('حذف');

      const item = document.createElement('label');
      item.className = 'lesson-item';
      if (isDeleted) {
        item.style.opacity = '0.5';
        item.style.cursor = 'not-allowed';
      }

      item.innerHTML = `
        <input type="checkbox" value="${lesson.lesson_number}" ${isChecked ? 'checked' : ''} ${isDeleted ? 'disabled' : ''}>
        <div class="lesson-info">
          <span class="l-title">درس ${toPersianDigits(lesson.lesson_number)}${lesson.topic ? ': ' + lesson.topic : ''}</span>
          <span class="l-badge">${isDeleted ? 'حذف شده' : toPersianDigits(qCount) + ' سوال'}</span>
        </div>
      `;

      const checkbox = item.querySelector('input');
      checkbox.addEventListener('change', (e) => {
        const num = parseInt(e.target.value, 10);
        if (e.target.checked) {
          if (!state.selectedLessons.includes(num)) state.selectedLessons.push(num);
        } else {
          state.selectedLessons = state.selectedLessons.filter(n => n !== num);
        }
        state.selectedLessons.sort((a, b) => a - b);
        updateLessonsHeaderString();
        updateQuestionPool();
        generateExam();
      });

      container.appendChild(item);
    });

    updatePoolCountDisplay();
  }

  // Update Header Lessons String
  function updateLessonsHeaderString() {
    if (state.selectedLessons.length === 0) {
      state.headerSettings.lessonsStr = 'هیچ درسی انتخاب نشده';
    } else if (state.selectedLessons.length === 1) {
      state.headerSettings.lessonsStr = `درس ${toPersianDigits(state.selectedLessons[0])}`;
    } else {
      const numbersPersian = state.selectedLessons.map(n => toPersianDigits(n));
      state.headerSettings.lessonsStr = `درس‌های ${numbersPersian.join('، ')}`;
    }

    const input = document.getElementById('hdr-lessons-input');
    if (input) input.value = state.headerSettings.lessonsStr;
  }

  // Update Question Pool from Selected Lessons
  function updateQuestionPool() {
    const bookData = window.QUIZ_BOOKS[state.selectedBookId];
    if (!bookData) return;

    const pool = [];
    bookData.lessons.forEach(l => {
      if (state.selectedLessons.includes(l.lesson_number) && l.questions) {
        l.questions.forEach(q => {
          pool.push({
            ...q,
            book_id: state.selectedBookId,
            lesson_number: l.lesson_number,
            lesson_topic: l.topic,
            uid: `${state.selectedBookId}_L${l.lesson_number}_Q${q.index}`
          });
        });
      }
    });

    state.poolQuestions = pool;
    updatePoolCountDisplay();
  }

  // Update Pool Count in UI
  function updatePoolCountDisplay() {
    const countEl = document.getElementById('pool-count-badge');
    if (countEl) {
      countEl.textContent = `${toPersianDigits(state.poolQuestions.length)} سوال موجود`;
    }

    const qInput = document.getElementById('question-count-input');
    if (qInput) {
      qInput.max = Math.max(1, state.poolQuestions.length);
      if (parseInt(qInput.value, 10) > state.poolQuestions.length && state.poolQuestions.length > 0) {
        qInput.value = state.poolQuestions.length;
        state.questionCount = state.poolQuestions.length;
      }
    }
  }

  // Generate / Randomize Exam
  function generateExam() {
    const pool = state.poolQuestions;
    if (pool.length === 0) {
      state.currentQuestions = [];
      renderExamSheet();
      return;
    }

    const targetCount = Math.min(state.questionCount, pool.length);

    // Shuffle pool with Fisher-Yates
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    state.currentQuestions = shuffled.slice(0, targetCount);
    renderExamSheet();
  }

  // Swap / Shuffle a single question
  function swapQuestion(questionIndex) {
    const currentQ = state.currentQuestions[questionIndex];
    if (!currentQ) return;

    // Find candidates in pool not already used in current exam
    const usedUids = new Set(state.currentQuestions.map(q => q.uid));
    const availableCandidates = state.poolQuestions.filter(q => !usedUids.has(q.uid));

    if (availableCandidates.length === 0) {
      alert('تمامی سوالات موجود در درس‌های انتخابی در حال حاضر در برگه قرار دارند!');
      return;
    }

    // Pick a random candidate
    const randomIndex = Math.floor(Math.random() * availableCandidates.length);
    const newQuestion = availableCandidates[randomIndex];

    // Replace
    state.currentQuestions[questionIndex] = newQuestion;

    // Re-render
    renderExamSheet();

    // Flash animation on swapped item
    setTimeout(() => {
      const row = document.getElementById(`q-row-${questionIndex}`);
      if (row) {
        row.style.backgroundColor = '#ecfdf5';
        setTimeout(() => {
          row.style.backgroundColor = '';
        }, 600);
      }
    }, 50);
  }

  // Delete a Question
  function deleteQuestion(questionIndex) {
    state.currentQuestions.splice(questionIndex, 1);
    state.questionCount = state.currentQuestions.length;
    const qInput = document.getElementById('question-count-input');
    if (qInput) qInput.value = state.currentQuestions.length;
    renderExamSheet();
  }

  // Chunk questions for smart pagination
  function chunkQuestions(questions) {
    if (questions.length === 0) return [];
    const mode = state.paginationMode;
    if (mode === 'all') return [questions];
    if (typeof mode === 'number') {
      const chunks = [];
      for (let i = 0; i < questions.length; i += mode) {
        chunks.push(questions.slice(i, i + mode));
      }
      return chunks;
    }

    // Auto mode: ظرفیت واقعی و کامل صفحه اول (با سربرگ) و صفحات بعدی (بدون سربرگ)
    let p1Cap = 8;
    let pNextCap = 11;

    if (state.paperFormat === 'a4') {
      if (!state.hasAnswerLines) {
        p1Cap = 14; pNextCap = 18;
      } else if (state.answerLinesCount === 1) {
        p1Cap = 11; pNextCap = 14;
      } else if (state.answerLinesCount === 2) {
        p1Cap = 8; pNextCap = 11;
      } else if (state.answerLinesCount === 3) {
        p1Cap = 6; pNextCap = 9;
      } else {
        p1Cap = 5; pNextCap = 7;
      }
    } else {
      // A5
      if (!state.hasAnswerLines) {
        p1Cap = 9; pNextCap = 12;
      } else if (state.answerLinesCount === 1) {
        p1Cap = 7; pNextCap = 9;
      } else if (state.answerLinesCount === 2) {
        p1Cap = 5; pNextCap = 7;
      } else if (state.answerLinesCount === 3) {
        p1Cap = 4; pNextCap = 5;
      } else {
        p1Cap = 3; pNextCap = 4;
      }
    }

    // اگر تمام سوالات در صفحه اول جا می‌شوند (با ۱ سوال انعطاف‌پذیری برای جلوگیری از هدررفت کاغذ)
    if (questions.length <= p1Cap + (questions.length <= p1Cap + 1 && state.answerLinesCount <= 2 ? 1 : 0)) {
      return [questions];
    }

    // ابتدا صفحه اول تا ظرفیت کامل پر می‌شود، سپس سوالات باقی‌مانده به صفحات بعدی منتقل می‌شوند
    const pages = [questions.slice(0, p1Cap)];
    let rem = questions.slice(p1Cap);
    while (rem.length > 0) {
      pages.push(rem.slice(0, pNextCap));
      rem = rem.slice(pNextCap);
    }
    return pages;
  }

  // Render Exam Sheet
  function renderExamSheet() {
    const container = document.getElementById('exam-preview-container');
    if (!container) return;

    const hdr = state.headerSettings;
    const formatClass = `format-${state.paperFormat}`;

    if (state.currentQuestions.length === 0) {
      container.innerHTML = `
        <div class="exam-page ${formatClass}" style="display:flex;align-items:center;justify-content:center;color:#64748b;font-weight:600;">
          لطفاً حداقل یک درس را انتخاب نمایید تا سوالات آزمونک تولید شوند.
        </div>
      `;
      return;
    }

    // Split questions across pages
    const questionPages = chunkQuestions(state.currentQuestions);
    const totalPages = questionPages.length;

    let allPagesHtml = '';
    let globalIndex = 0;

    questionPages.forEach((pageQuestions, pageIdx) => {
      const pageNum = pageIdx + 1;
      const isFirstPage = (pageNum === 1);
      const isLastPage = (pageNum === totalPages);

      // سربرگ فقط و فقط در صفحه اول قرار می‌گیرد؛ صفحات دوم و بعدی هیچ سربرگی ندارند
      let pageHeaderHtml = '';
      if (isFirstPage) {
        pageHeaderHtml = `
          <div class="exam-header">
            <div class="header-top-grid">
              <div class="header-right">
                <div>${hdr.educationDept}</div>
                <div style="font-weight: 700;">${hdr.schoolName}</div>
                <div>سال تحصیلی ۱۴۰۶-۱۴۰۵</div>
              </div>
              <div class="header-center">
                <div class="bismillah">${hdr.bismillah}</div>
                <div class="exam-main-title">${hdr.examTitle}</div>
                <div class="exam-sub-title">${hdr.subject} - ${hdr.grade} (${hdr.lessonsStr})</div>
              </div>
              <div class="header-left">
                <div><span>تاریخ:</span> <span class="header-val">${hdr.date}</span></div>
                <div><span>مدت آزمون:</span> <span class="header-val">${hdr.duration}</span></div>
              </div>
            </div>

            <!-- نام و نام خانوادگی دانش‌آموز در سربرگ -->
            <div class="header-student-row">
              <div class="student-name-field">
                <span class="field-label">نام و نام خانوادگی دانش‌آموز:</span>
                <span class="dots-line">....................................................................................</span>
              </div>
            </div>
          </div>
        `;
      } else {
        // برای صفحات دوم و بعدی هیچ سربرگی قرار نمی‌گیرد
        pageHeaderHtml = '';
      }

      // Questions for this page
      let pageQuestionsHtml = '';
      pageQuestions.forEach(q => {
        const qNumPersian = toPersianDigits(globalIndex + 1);
        const thisIdx = globalIndex;
        globalIndex++;

        let answerSpaceHtml = '';
        if (state.hasAnswerLines) {
          let lines = '';
          for (let l = 0; l < state.answerLinesCount; l++) {
            lines += '<div class="answer-line"></div>';
          }
          answerSpaceHtml = `<div class="answer-space">${lines}</div>`;
        }

        pageQuestionsHtml += `
          <div class="question-row" id="q-row-${thisIdx}">
            <div class="q-number">${qNumPersian}</div>
            <div class="q-content">
              <div class="q-text" contenteditable="true" title="برای ویرایش متن سوال، کلیک کنید">${q.question}</div>
              ${answerSpaceHtml}
            </div>
            <div class="q-actions no-print">
              <button class="btn-icon" onclick="window.QuiznerApp.swapQuestion(${thisIdx})" title="تغییر این سوال با یک سوال تصادفی دیگر">
                🔄 تعویض سوال
              </button>
              <button class="btn-icon btn-delete" onclick="window.QuiznerApp.deleteQuestion(${thisIdx})" title="حذف این سوال">
                ✕ حذف
              </button>
            </div>
          </div>
        `;
      });

      // Footer for this page
      const pageFooterHtml = `
        <div class="exam-footer">
          <span>صفحه ${toPersianDigits(pageNum)} از ${toPersianDigits(totalPages)}</span>
          <span>${!isLastPage ? 'ادامه سوالات در صفحه بعد ←' : 'موفق و پیروز باشید'}</span>
          <span>${hdr.designerCredit}</span>
        </div>
      `;

      allPagesHtml += `
        <div class="exam-page ${formatClass}" id="exam-page-${pageNum}" style="${pageIdx > 0 ? 'margin-top: 2rem;' : ''}">
          <div class="exam-frame">
            ${pageHeaderHtml}
            <div class="exam-body">
              ${pageQuestionsHtml}
            </div>
            ${pageFooterHtml}
          </div>
        </div>
      `;
    });

    // Answer Key Sheet (Optional)
    let answerSheetHtml = '';
    if (state.includeAnswerKey) {
      let answersListHtml = '';
      state.currentQuestions.forEach((q, idx) => {
        answersListHtml += `
          <div class="ans-row">
            <div class="q-number">${toPersianDigits(idx + 1)}</div>
            <div class="ans-content">
              <div class="ans-q-title">${q.question}</div>
              <div class="ans-text" contenteditable="true" title="برای ویرایش پاسخ کلیک کنید">${q.answer}</div>
            </div>
          </div>
        `;
      });

      answerSheetHtml = `
        <div class="exam-page ${formatClass} answer-sheet" style="margin-top: 2rem;">
          <div class="exam-frame">
            <div class="answer-sheet-header">
              <div class="bismillah">${hdr.bismillah}</div>
              <div class="answer-sheet-title">کلید و پاسخ‌نامه تشریحی: ${hdr.subject} (${hdr.grade})</div>
              <div style="font-size: 0.8rem; color: #475569; margin-top: 3px;">
                ${hdr.schoolName} | ${hdr.lessonsStr} | سال تحصیلی ۱۴۰۵-۱۴۰۶
              </div>
            </div>
            <div class="exam-body">
              ${answersListHtml}
            </div>
            <div class="exam-footer">
              <span>سامانه کوئیزنر</span>
              <span>${hdr.designerCredit}</span>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = allPagesHtml + answerSheetHtml;

    // Update status in toolbar
    const statusEl = document.getElementById('preview-status-text');
    if (statusEl) {
      statusEl.textContent = `${toPersianDigits(state.currentQuestions.length)} سوال در ${toPersianDigits(totalPages)} برگه (کاغذ ${state.paperFormat.toUpperCase()})`;
    }
  }

  // Update Form Inputs from State
  function updateHeaderInputs() {
    const bindMap = {
      'hdr-bismillah': 'bismillah',
      'hdr-school': 'schoolName',
      'hdr-dept': 'educationDept',
      'hdr-title': 'examTitle',
      'hdr-grade': 'grade',
      'hdr-subject': 'subject',
      'hdr-lessons-input': 'lessonsStr',
      'hdr-date': 'date',
      'hdr-duration': 'duration'
    };

    for (const [id, key] of Object.entries(bindMap)) {
      const el = document.getElementById(id);
      if (el) el.value = state.headerSettings[key];
    }
  }

  // Bind All Event Listeners
  function bindEvents() {
    // Quick lesson select buttons
    const btnSelectAll = document.getElementById('btn-select-all-lessons');
    if (btnSelectAll) {
      btnSelectAll.addEventListener('click', () => {
        const bookData = window.QUIZ_BOOKS[state.selectedBookId];
        if (!bookData) return;
        state.selectedLessons = bookData.lessons
          .filter(l => !l.status || !l.status.includes('حذف'))
          .map(l => l.lesson_number);
        renderLessonsList();
        updateLessonsHeaderString();
        updateQuestionPool();
        generateExam();
      });
    }

    const btnDeselectAll = document.getElementById('btn-deselect-all-lessons');
    if (btnDeselectAll) {
      btnDeselectAll.addEventListener('click', () => {
        state.selectedLessons = [];
        renderLessonsList();
        updateLessonsHeaderString();
        updateQuestionPool();
        generateExam();
      });
    }

    // Question Count Input & Controls
    const qCountInput = document.getElementById('question-count-input');
    if (qCountInput) {
      qCountInput.value = state.questionCount;
      qCountInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > state.poolQuestions.length) val = Math.max(1, state.poolQuestions.length);
        e.target.value = val;
        state.questionCount = val;
        generateExam();
      });
    }

    const btnDecreaseQ = document.getElementById('btn-decrease-q');
    if (btnDecreaseQ) {
      btnDecreaseQ.addEventListener('click', () => {
        if (state.questionCount > 1) {
          state.questionCount--;
          if (qCountInput) qCountInput.value = state.questionCount;
          generateExam();
        }
      });
    }

    const btnIncreaseQ = document.getElementById('btn-increase-q');
    if (btnIncreaseQ) {
      btnIncreaseQ.addEventListener('click', () => {
        if (state.questionCount < state.poolQuestions.length) {
          state.questionCount++;
          if (qCountInput) qCountInput.value = state.questionCount;
          generateExam();
        }
      });
    }

    // Format A4 / A5 Buttons
    const btnFormatA4 = document.getElementById('btn-format-a4');
    const btnFormatA5 = document.getElementById('btn-format-a5');

    if (btnFormatA4 && btnFormatA5) {
      btnFormatA4.addEventListener('click', () => {
        state.paperFormat = 'a4';
        btnFormatA4.classList.add('active');
        btnFormatA5.classList.remove('active');
        document.body.classList.remove('print-a5');
        document.body.classList.add('print-a4');
        updatePrintPageStyle();
        renderExamSheet();
      });

      btnFormatA5.addEventListener('click', () => {
        state.paperFormat = 'a5';
        btnFormatA5.classList.add('active');
        btnFormatA4.classList.remove('active');
        document.body.classList.remove('print-a4');
        document.body.classList.add('print-a5');
        updatePrintPageStyle();
        renderExamSheet();
      });
    }

    // Answer Key Checkbox
    const chkAnswerKey = document.getElementById('chk-include-answer-key');
    if (chkAnswerKey) {
      chkAnswerKey.checked = state.includeAnswerKey;
      chkAnswerKey.addEventListener('change', (e) => {
        state.includeAnswerKey = e.target.checked;
        renderExamSheet();
      });
    }

    // Answer Space Checkbox
    const chkAnswerSpace = document.getElementById('chk-answer-space');
    const answerLinesRow = document.getElementById('answer-lines-row');
    if (chkAnswerSpace) {
      chkAnswerSpace.checked = state.hasAnswerLines;
      chkAnswerSpace.addEventListener('change', (e) => {
        state.hasAnswerLines = e.target.checked;
        if (answerLinesRow) {
          answerLinesRow.style.display = e.target.checked ? 'flex' : 'none';
        }
        renderExamSheet();
      });
    }

    // Answer Lines Count
    const selectLinesCount = document.getElementById('select-lines-count');
    if (selectLinesCount) {
      selectLinesCount.value = state.answerLinesCount;
      selectLinesCount.addEventListener('change', (e) => {
        state.answerLinesCount = parseInt(e.target.value, 10);
        renderExamSheet();
      });
    }

    // Pagination Mode
    const selectPagination = document.getElementById('select-pagination-mode');
    if (selectPagination) {
      selectPagination.value = state.paginationMode;
      selectPagination.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'auto' || val === 'all') {
          state.paginationMode = val;
        } else {
          state.paginationMode = parseInt(val, 10);
        }
        renderExamSheet();
      });
    }

    // Header Settings Inputs
    const bindMap = {
      'hdr-bismillah': 'bismillah',
      'hdr-school': 'schoolName',
      'hdr-dept': 'educationDept',
      'hdr-title': 'examTitle',
      'hdr-grade': 'grade',
      'hdr-subject': 'subject',
      'hdr-lessons-input': 'lessonsStr',
      'hdr-date': 'date',
      'hdr-duration': 'duration'
    };

    for (const [id, key] of Object.entries(bindMap)) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          state.headerSettings[key] = e.target.value;
          renderExamSheet();
        });
      }
    }

    // Accordion Toggle
    const accordionToggle = document.getElementById('header-settings-toggle');
    const accordionBody = document.getElementById('header-settings-body');
    if (accordionToggle && accordionBody) {
      accordionToggle.addEventListener('click', () => {
        const isOpen = accordionBody.classList.toggle('open');
        accordionToggle.querySelector('.acc-icon').textContent = isOpen ? '▲' : '▼';
      });
    }

    // Regenerate Entire Exam Button
    const btnRegenerate = document.getElementById('btn-regenerate-exam');
    if (btnRegenerate) {
      btnRegenerate.addEventListener('click', () => {
        generateExam();
      });
    }

    // Print Button
    const btnPrint = document.getElementById('btn-print-exam');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        printExam();
      });
    }

    // Ctrl + P shortcut listener
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        printExam();
      }
    });
  }

  // Dynamically set @page size for printing
  function updatePrintPageStyle() {
    let styleEl = document.getElementById('dynamic-print-page');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-print-page';
      document.head.appendChild(styleEl);
    }
    if (state.paperFormat === 'a5') {
      styleEl.textContent = `@page { size: A5 portrait; margin: 6mm 8mm; }`;
    } else {
      styleEl.textContent = `@page { size: A4 portrait; margin: 10mm 12mm; }`;
    }
  }

  // Print Exam
  function printExam() {
    if (state.paperFormat === 'a5') {
      document.body.classList.remove('print-a4');
      document.body.classList.add('print-a5');
    } else {
      document.body.classList.remove('print-a5');
      document.body.classList.add('print-a4');
    }
    updatePrintPageStyle();
    window.print();
  }

  // Expose global methods for inline HTML buttons
  window.QuiznerApp = {
    swapQuestion,
    deleteQuestion,
    printExam,
    generateExam
  };

  // Run on DOM loaded
  document.addEventListener('DOMContentLoaded', init);
})();
