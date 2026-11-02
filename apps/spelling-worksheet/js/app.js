/**
 * Main Application Controller for Emla Worksheet Generator
 * Dynamic Multi-Page A4 Pagination Engine, Live Text Overflow Splitter & Offline State
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // Application State
  // --------------------------------------------------------------------------
  const state = {
    currentGrade: 4,
    currentLessonIndex: 0,
    currentLessonShort: 'فارسی چهارم - درس ۱',
    currentLessonFull: 'فارسی چهارم - درس ۱: آفریدگار زیبایی',
    currentSubpartType: 'main_text',
    worksheetMode: 'blank', // 'blank', 'error', 'combined'
    activeText: '',
    isCustomText: false,
    parsedParagraphs: [],
    // Map of wordId -> { type: 'blank'|'error', original: string, misspelled?: string }
    selectedWords: new Map(),
    formVariant: 'الف',
    fontSize: 12, // Default 12pt as requested
    lineHeight: 2.0,
    schoolName: 'شهید قائمی',
    teacherName: 'آقای خراسانی',
    examDate: '',
    printAnswerKey: true,
    pageCount: 1,
    modalActiveWordId: null
  };

  // --------------------------------------------------------------------------
  // DOM References
  // --------------------------------------------------------------------------
  const dom = {
    selectGrade: document.getElementById('select-grade'),
    selectLesson: document.getElementById('select-lesson'),
    groupSubpart: document.getElementById('group-subpart'),
    selectSubpart: document.getElementById('select-subpart'),
    modeRadios: document.querySelectorAll('input[name="worksheet-mode"]'),
    inputRandomCount: document.getElementById('input-random-count'),
    btnRandomSelect: document.getElementById('btn-random-select'),
    btnParallelForm: document.getElementById('btn-parallel-form'),
    btnClearSelection: document.getElementById('btn-clear-selection'),
    btnOpenEditModal: document.getElementById('btn-open-edit-modal'),
    btnResetText: document.getElementById('btn-reset-text'),
    sliderFontSize: document.getElementById('slider-font-size'),
    indicatorFontSize: document.getElementById('indicator-font-size'),
    sliderLineHeight: document.getElementById('slider-line-height'),
    indicatorLineHeight: document.getElementById('indicator-line-height'),
    inputSchoolName: document.getElementById('input-school-name'),
    inputTeacherName: document.getElementById('input-teacher-name'),
    inputDate: document.getElementById('input-date'),
    checkPrintAnswers: document.getElementById('check-print-answers'),
    btnPrint: document.getElementById('btn-print'),
    
    // Preview Toolbar Elements
    previewArea: document.getElementById('preview-area'),
    pagesContainer: document.getElementById('pages-container'),
    tagBlankCount: document.getElementById('tag-blank-count'),
    tagErrorCount: document.getElementById('tag-error-count'),
    tagPagesCount: document.getElementById('tag-pages-count'),
    tagFormVariant: document.getElementById('tag-form-variant'),
    
    // Modals
    modalEditText: document.getElementById('modal-edit-text'),
    textareaCustomText: document.getElementById('textarea-custom-text'),
    btnCloseEditModal: document.getElementById('btn-close-edit-modal'),
    btnCancelEditText: document.getElementById('btn-cancel-edit-text'),
    btnSaveCustomText: document.getElementById('btn-save-custom-text'),
    
    modalSpellingChoice: document.getElementById('modal-spelling-choice'),
    spellingModalOriginal: document.getElementById('spelling-modal-original'),
    spellingSuggestionsContainer: document.getElementById('spelling-suggestions-container'),
    spellingCustomInput: document.getElementById('spelling-custom-input'),
    btnCloseSpellingModal: document.getElementById('btn-close-spelling-modal'),
    btnCancelSpellingChoice: document.getElementById('btn-cancel-spelling-choice'),
    btnConfirmSpellingChoice: document.getElementById('btn-confirm-spelling-choice'),
    
    toastContainer: document.getElementById('toast-container')
  };

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------
  function init() {
    loadSettingsFromStorage();
    setupDate();
    setupEventListeners();
    populateLessons();
    loadCurrentLessonText();
    renderWorksheet();
  }

  // --------------------------------------------------------------------------
  // Storage & Defaults
  // --------------------------------------------------------------------------
  function loadSettingsFromStorage() {
    try {
      const savedSchool = localStorage.getItem('emla_school_name');
      if (savedSchool) {
        state.schoolName = savedSchool;
        dom.inputSchoolName.value = savedSchool;
      }
      const savedTeacher = localStorage.getItem('emla_teacher_name');
      if (savedTeacher) {
        state.teacherName = savedTeacher;
        dom.inputTeacherName.value = savedTeacher;
      }
      const savedFontSize = localStorage.getItem('emla_font_size');
      if (savedFontSize) {
        state.fontSize = parseFloat(savedFontSize);
      } else {
        state.fontSize = 12; // Default 12pt
      }
      dom.sliderFontSize.value = state.fontSize;

      const savedLineHeight = localStorage.getItem('emla_line_height');
      if (savedLineHeight) {
        state.lineHeight = parseFloat(savedLineHeight);
      } else {
        state.lineHeight = 2.0;
      }
      dom.sliderLineHeight.value = state.lineHeight;
    } catch (e) {
      console.warn('LocalStorage not accessible', e);
    }
    applyTypography();
  }

  function saveSettingsToStorage() {
    try {
      localStorage.setItem('emla_school_name', state.schoolName);
      localStorage.setItem('emla_teacher_name', state.teacherName);
      localStorage.setItem('emla_font_size', state.fontSize);
      localStorage.setItem('emla_line_height', state.lineHeight);
    } catch (e) {
      // Ignore
    }
  }

  function setupDate() {
    const today = Shamsi.getTodayPersian('text');
    state.examDate = today;
    dom.inputDate.value = today;
  }

  function applyTypography() {
    document.documentElement.style.setProperty('--sheet-font-size', `${state.fontSize}pt`);
    document.documentElement.style.setProperty('--sheet-line-height', `${state.lineHeight}`);
    dom.indicatorFontSize.textContent = Shamsi.toPersianDigits(state.fontSize) + 'pt';
    dom.indicatorLineHeight.textContent = Shamsi.toPersianDigits(state.lineHeight);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --------------------------------------------------------------------------
  // Data Extraction
  // --------------------------------------------------------------------------
  function getBookData(grade) {
    if (grade === 4) return window.FARSI_4;
    if (grade === 5) return window.FARSI_5;
    if (grade === 6) return window.FARSI_6;
    return window.FARSI_4;
  }

  function populateLessons() {
    const book = getBookData(state.currentGrade);
    if (!book) return;

    dom.selectLesson.innerHTML = '';

    if (book.setayesh) {
      const opt = document.createElement('option');
      opt.value = 'setayesh';
      opt.textContent = `⭐ ستایش: ${book.setayesh.title || ''}`;
      dom.selectLesson.appendChild(opt);
    }

    (book.lessons || []).forEach((lesson, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      const numStr = Shamsi.toPersianDigits(lesson.lesson_number);
      const freeTag = lesson.is_free_lesson ? ' (درس آزاد)' : '';
      opt.textContent = `درس ${numStr}: ${lesson.lesson_title}${freeTag}`;
      dom.selectLesson.appendChild(opt);
    });

    if (book.niyayesh) {
      const opt = document.createElement('option');
      opt.value = 'niyayesh';
      opt.textContent = `🌟 نیایش: ${book.niyayesh.title || ''}`;
      dom.selectLesson.appendChild(opt);
    }

    dom.selectLesson.selectedIndex = 1; // Default: Lesson 1
    state.currentLessonIndex = 0;
    updateSubpartDropdown();
  }

  function updateSubpartDropdown() {
    const book = getBookData(state.currentGrade);
    const selVal = dom.selectLesson.value;

    dom.selectSubpart.innerHTML = '';
    dom.groupSubpart.style.display = 'none';
    state.currentSubpartType = 'main_text';

    if (selVal === 'setayesh' || selVal === 'niyayesh') {
      return;
    }

    const lessonIdx = parseInt(selVal, 10);
    const lesson = book.lessons[lessonIdx];
    if (!lesson) return;

    const parts = [];
    if (lesson.main_text) {
      parts.push({ id: 'main_text', title: 'متن اصلی درس' });
    } else if (lesson.is_free_lesson) {
      parts.push({ id: 'free_desc', title: 'توضیحات درس آزاد' });
    }

    const checkArray = (arr, key, titlePrefix) => {
      if (Array.isArray(arr) && arr.length > 0) {
        arr.forEach((item, i) => {
          const itemTitle = item.title || `${titlePrefix} ${Shamsi.toPersianDigits(i + 1)}`;
          parts.push({ id: `${key}_${i}`, title: `${titlePrefix}: ${itemTitle}`, data: item });
        });
      }
    };

    checkArray(lesson.read_and_think, 'read_and_think', 'بخوان و بیندیش');
    checkArray(lesson.anecdotes, 'anecdotes', 'حکایت');
    checkArray(lesson.poems, 'poems', 'شعرخوانی');
    checkArray(lesson.memorization_poems, 'memorization_poems', 'شعر حفظی');
    checkArray(lesson.fluency_readings, 'fluency_readings', 'روان‌خوانی');

    if (parts.length > 1) {
      parts.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.title;
        dom.selectSubpart.appendChild(opt);
      });
      dom.groupSubpart.style.display = 'block';
    }
  }

  function extractTextFromObject(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (obj.paragraphs && Array.isArray(obj.paragraphs)) {
      return obj.paragraphs.join('\n\n');
    }
    if (obj.full_text) return obj.full_text;
    if (obj.verses && Array.isArray(obj.verses)) {
      return obj.verses.map(v => `${v.hemistich_1}  ***  ${v.hemistich_2}`).join('\n');
    }
    if (obj.stanzas && Array.isArray(obj.stanzas)) {
      return obj.stanzas.map(s => (s.lines || []).join('\n')).join('\n\n');
    }
    if (obj.lines && Array.isArray(obj.lines)) {
      return obj.lines.join('\n');
    }
    if (obj.description) return obj.description;
    return '';
  }

  function loadCurrentLessonText() {
    const book = getBookData(state.currentGrade);
    const selVal = dom.selectLesson.value;
    let fullTitle = '';
    let shortTitle = '';
    let extracted = '';

    const gradeText = ['چهارم', 'پنجم', 'ششم'][state.currentGrade - 4];

    if (selVal === 'setayesh') {
      shortTitle = `فارسی ${gradeText} - ستایش`;
      fullTitle = `ستایش: ${book.setayesh.title || ''}`;
      extracted = extractTextFromObject(book.setayesh);
    } else if (selVal === 'niyayesh') {
      shortTitle = `فارسی ${gradeText} - نیایش`;
      fullTitle = `نیایش: ${book.niyayesh.title || ''}`;
      extracted = extractTextFromObject(book.niyayesh);
    } else {
      const idx = parseInt(selVal, 10);
      const lesson = book.lessons[idx];
      const lessonNum = Shamsi.toPersianDigits(lesson.lesson_number);
      
      shortTitle = `فارسی ${gradeText} - درس ${lessonNum}`;
      fullTitle = `فارسی ${gradeText} - درس ${lessonNum}: ${lesson.lesson_title}`;

      const subpartId = dom.selectSubpart.value;
      if (!subpartId || subpartId === 'main_text') {
        extracted = extractTextFromObject(lesson.main_text || lesson);
      } else if (subpartId === 'free_desc') {
        extracted = lesson.description || 'این درس آزاد است.';
      } else {
        const [key, partIdx] = subpartId.split('_');
        const item = (lesson[key] || [])[parseInt(partIdx, 10)];
        if (item) {
          shortTitle += ` (${item.title || ''})`;
          fullTitle += ` (${item.title || ''})`;
          extracted = extractTextFromObject(item);
        }
      }
    }

    state.currentLessonShort = shortTitle;
    state.currentLessonFull = fullTitle;
    state.activeText = extracted.trim();
    state.isCustomText = false;
    state.selectedWords.clear();
  }

  // --------------------------------------------------------------------------
  // Student Instruction / Guideline Generator
  // --------------------------------------------------------------------------
  function getStudentGuideHtml() {
    let blankCount = 0;
    let errorCount = 0;
    state.selectedWords.forEach(val => {
      if (val.type === 'blank') blankCount++;
      if (val.type === 'error') errorCount++;
    });

    const bStr = Shamsi.toPersianDigits(blankCount);
    const eStr = Shamsi.toPersianDigits(errorCount);

    if (state.worksheetMode === 'combined') {
      if (errorCount > 0 && blankCount > 0) {
        return `<strong>راهنما:</strong> در متن زیر <u>${eStr} غلط املایی</u> و <u>${bStr} جای خالی</u> وجود دارد. جاهای خالی را با کلمات مناسب مطابق متن کتاب پر کنید، کلمات نادرست را پیدا کرده و شکل درست آن‌ها را در جدول بنویسید.`;
      } else if (errorCount > 0) {
        return `<strong>راهنما:</strong> در متن زیر <u>${eStr} غلط املایی</u> وجود دارد. دور کلمات نادرست خط بکشید و شکل صحیح آن‌ها را در جدول انتهای برگه بنویسید.`;
      } else if (blankCount > 0) {
        return `<strong>راهنما:</strong> در متن زیر <u>${bStr} جای خالی</u> وجود دارد. جاهای خالی را با کلمات مناسب مطابق با متن کتاب درسی پر کنید.`;
      } else {
        return `<strong>راهنما:</strong> جاهای خالی متن زیر را با کلمات مناسب پر کنید و غلط‌های املایی را پیدا کرده و شکل صحیح آن‌ها را در جدول بنویسید.`;
      }
    } else if (state.worksheetMode === 'error') {
      if (errorCount > 0) {
        return `<strong>راهنما:</strong> در متن زیر <u>${eStr} غلط املایی</u> وجود دارد. دور کلمات نادرست خط بکشید و شکل صحیح هر یک را در جدول انتهای برگه بنویسید.`;
      } else {
        return `<strong>راهنما:</strong> در متن زیر دور کلمات نادرست خط بکشید و شکل صحیح هر یک را در جدول انتهای برگه بنویسید.`;
      }
    } else {
      // blank mode
      if (blankCount > 0) {
        return `<strong>راهنما:</strong> در متن زیر <u>${bStr} جای خالی</u> وجود دارد. جاهای خالی را با کلمات مناسب مطابق با متن کتاب درسی پر کنید.`;
      } else {
        return `<strong>راهنما:</strong> در متن زیر جاهای خالی را با کلمات مناسب مطابق با متن کتاب درسی پر کنید.`;
      }
    }
  }

  // --------------------------------------------------------------------------
  // Multi-Page A4 Pagination Engine
  // --------------------------------------------------------------------------
  function createPageSheet(pageNumber) {
    const sheet = document.createElement('section');
    sheet.className = 'page-sheet worksheet-sheet';
    sheet.id = `sheet-page-${pageNumber}`;

    const frame = document.createElement('div');
    frame.className = 'page-frame';

    const frameInner = document.createElement('div');
    frameInner.className = 'page-frame-inner';

    if (pageNumber === 1) {
      // PAGE 1 ONLY: Ultra-compact, smaller 3-Column x 2-Row Header
      const header = document.createElement('header');
      header.className = 'worksheet-header-clean';
      header.innerHTML = `
        <table class="header-table">
          <tbody>
            <tr>
              <td class="header-col-right">
                <span class="h-label">دبستان:</span>
                <span class="h-val editable-field" data-field="school">${escapeHtml(state.schoolName)}</span>
              </td>
              <td class="header-col-center">
                <span class="h-bismillah">به نام خدا</span>
              </td>
              <td class="header-col-left">
                <span class="h-label">تاریخ:</span>
                <span class="h-val editable-field" data-field="date">${escapeHtml(state.examDate)}</span>
              </td>
            </tr>
            <tr>
              <td class="header-col-right">
                <span class="h-label">آموزگار:</span>
                <span class="h-val editable-field" data-field="teacher">${escapeHtml(state.teacherName)}</span>
              </td>
              <td class="header-col-center">
                <span class="h-val" data-field="lesson">${escapeHtml(state.currentLessonShort)}</span>
              </td>
              <td class="header-col-left">
                <span class="h-label">نام و نام خانوادگی:</span>
                <span class="h-student-line"></span>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="immutable-copyright">طراحی شده توسط سامانه www.ali.id.ir</div>
      `;
      frameInner.appendChild(header);

      // Student Guidance Box
      const guideBox = document.createElement('div');
      guideBox.className = 'student-guide-box';
      guideBox.innerHTML = getStudentGuideHtml();
      frameInner.appendChild(guideBox);

      // Lesson Headline on page 1
      const headline = document.createElement('div');
      headline.className = 'lesson-headline';
      headline.textContent = state.currentLessonFull;
      frameInner.appendChild(headline);
    }
    // PAGE 2+: NO HEADER AT ALL! (Exact requirement: بجز صفحه اول، هیچ صفحه ای سربرگ نداشته باشه)

    const content = document.createElement('article');
    content.className = 'worksheet-content';
    frameInner.appendChild(content);

    frame.appendChild(frameInner);
    sheet.appendChild(frame);
    dom.pagesContainer.appendChild(sheet);

    // Sync inline editable fields on page 1
    if (pageNumber === 1) {
      frameInner.querySelectorAll('.editable-field').forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.addEventListener('blur', () => {
          const field = el.dataset.field;
          const val = el.textContent.trim();
          if (field === 'school') {
            state.schoolName = val;
            dom.inputSchoolName.value = val;
          } else if (field === 'teacher') {
            state.teacherName = val;
            dom.inputTeacherName.value = val;
          } else if (field === 'date') {
            state.examDate = val;
            dom.inputDate.value = val;
          }
          syncHeaderFields();
          saveSettingsToStorage();
        });
      });
    }

    return { sheet, frameInner, content };
  }

  function getMaxContentHeight(page) {
    const totalInner = page.frameInner.clientHeight || 1000;
    let nonContentH = 0;
    Array.from(page.frameInner.children).forEach(ch => {
      if (ch !== page.content) {
        nonContentH += ch.offsetHeight;
        const style = window.getComputedStyle(ch);
        nonContentH += (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
      }
    });
    // Return usable height with 10px safe margin
    return totalInner - nonContentH - 10;
  }

  function syncHeaderFields() {
    dom.pagesContainer.querySelectorAll('[data-field="school"]').forEach(el => el.textContent = state.schoolName);
    dom.pagesContainer.querySelectorAll('[data-field="teacher"]').forEach(el => el.textContent = state.teacherName);
    dom.pagesContainer.querySelectorAll('[data-field="date"]').forEach(el => el.textContent = state.examDate);
    dom.pagesContainer.querySelectorAll('[data-field="lesson"]').forEach(el => el.textContent = state.currentLessonShort);
  }

  function createParagraphElement(para) {
    const isPoetryVerse = para.rawText.includes('***');
    const pEl = document.createElement('div');
    pEl.className = isPoetryVerse ? 'poetry-verse' : 'worksheet-paragraph';

    if (isPoetryVerse) {
      const parts = para.rawText.split('***').map(s => s.trim());
      const hem1 = document.createElement('div');
      hem1.className = 'poetry-hemistich';
      const hem2 = document.createElement('div');
      hem2.className = 'poetry-hemistich';

      const mid = Math.ceil(para.tokens.length / 2);
      para.tokens.slice(0, mid).forEach((t, i) => {
        if (i > 0) hem1.appendChild(document.createTextNode(' '));
        renderTokenInto(t, hem1);
      });
      para.tokens.slice(mid).forEach((t, i) => {
        if (i > 0) hem2.appendChild(document.createTextNode(' '));
        renderTokenInto(t, hem2);
      });

      pEl.appendChild(hem1);
      pEl.appendChild(hem2);
      return pEl;
    }

    para.tokens.forEach((token, tIdx) => {
      if (tIdx > 0) {
        pEl.appendChild(document.createTextNode(' '));
      }
      renderTokenInto(token, pEl);
    });

    return pEl;
  }

  function renderTokenInto(token, container) {
    if (token.leading) {
      container.appendChild(document.createTextNode(token.leading));
    }

    if (token.isSelectable) {
      const span = document.createElement('span');
      span.className = 'selectable-word';
      span.id = token.id;
      span.dataset.stem = token.stem;

      const selection = state.selectedWords.get(token.id);

      const originalText = document.createElement('span');
      originalText.className = 'original-word-text';
      originalText.textContent = token.stem;
      span.appendChild(originalText);

      const blankSpan = document.createElement('span');
      blankSpan.className = 'blank-replacement';
      blankSpan.textContent = ' ';
      span.appendChild(blankSpan);

      const misspelledSpan = document.createElement('span');
      misspelledSpan.className = 'misspelled-text';
      misspelledSpan.style.display = 'none';
      span.appendChild(misspelledSpan);

      if (selection) {
        if (selection.type === 'blank') {
          // In preview: word itself is displayed dimly/faintly
          span.classList.add('is-blank');
        } else if (selection.type === 'error') {
          // In preview: highlighted in red, showing the misspelled text
          span.classList.add('is-error');
          misspelledSpan.textContent = selection.misspelled;
          misspelledSpan.style.display = 'inline';
          originalText.style.display = 'none';
        }
      }

      span.addEventListener('click', (e) => handleWordClick(token, span, e));
      container.appendChild(span);
    } else {
      container.appendChild(document.createTextNode(token.stem));
    }

    if (token.trailing) {
      container.appendChild(document.createTextNode(token.trailing));
    }
  }

  // --------------------------------------------------------------------------
  // Core Render & Dynamic Pagination Logic
  // --------------------------------------------------------------------------
  function renderWorksheet() {
    state.parsedParagraphs = TextParser.parseText(state.activeText);
    dom.pagesContainer.innerHTML = '';

    let pageCount = 1;
    let currentPage = createPageSheet(pageCount);
    let maxAllowed = getMaxContentHeight(currentPage);

    state.parsedParagraphs.forEach((para) => {
      const pEl = createParagraphElement(para);
      currentPage.content.appendChild(pEl);

      // Check if page overflows
      if (currentPage.content.offsetHeight > maxAllowed) {
        if (currentPage.content.children.length > 1) {
          currentPage.content.removeChild(pEl);
          pageCount++;
          currentPage = createPageSheet(pageCount);
          maxAllowed = getMaxContentHeight(currentPage);
          currentPage.content.appendChild(pEl);
        }

        // If this single paragraph alone still exceeds an empty page:
        if (currentPage.content.offsetHeight > maxAllowed) {
          currentPage = splitLargeParagraph(para, pEl, currentPage, () => {
            pageCount++;
            const newP = createPageSheet(pageCount);
            maxAllowed = getMaxContentHeight(newP);
            return newP;
          });
        }
      }
    });

    // Append Spelling Table if in error or combined mode
    let errorCount = 0;
    state.selectedWords.forEach(val => {
      if (val.type === 'error') errorCount++;
    });

    if (state.worksheetMode === 'error' || state.worksheetMode === 'combined' || errorCount > 0) {
      const tableContainer = createSpellingTableElement(Math.max(errorCount, 6));
      currentPage.frameInner.appendChild(tableContainer);

      maxAllowed = getMaxContentHeight(currentPage);
      if (currentPage.content.offsetHeight > maxAllowed || currentPage.frameInner.scrollHeight > currentPage.frameInner.clientHeight + 4) {
        currentPage.frameInner.removeChild(tableContainer);
        pageCount++;
        currentPage = createPageSheet(pageCount);
        const tblHeadline = document.createElement('div');
        tblHeadline.className = 'lesson-headline';
        tblHeadline.textContent = 'جدول ثبت املای صحیح واژه‌ها';
        currentPage.content.appendChild(tblHeadline);
        currentPage.frameInner.appendChild(tableContainer);
      }
    }

    state.pageCount = pageCount;
    dom.tagPagesCount.textContent = `${Shamsi.toPersianDigits(pageCount)} صفحه`;

    // Separate Answer Key Page
    buildAnswerSheet();

    // Update Toolbar summary tags
    updateSummaryTags();
  }

  function splitLargeParagraph(para, initialPEl, currentPage, createNewPageCallback) {
    currentPage.content.removeChild(initialPEl);

    let maxH = getMaxContentHeight(currentPage);
    let curPEl = document.createElement('div');
    curPEl.className = 'worksheet-paragraph';
    currentPage.content.appendChild(curPEl);

    para.tokens.forEach((token, tIdx) => {
      const testSpan = document.createElement('span');
      if (tIdx > 0) testSpan.appendChild(document.createTextNode(' '));
      renderTokenInto(token, testSpan);
      curPEl.appendChild(testSpan);

      if (currentPage.content.offsetHeight > maxH && curPEl.childNodes.length > 2) {
        curPEl.removeChild(testSpan);

        currentPage = createNewPageCallback();
        maxH = getMaxContentHeight(currentPage);

        curPEl = document.createElement('div');
        curPEl.className = 'worksheet-paragraph';
        currentPage.content.appendChild(curPEl);

        renderTokenInto(token, curPEl);
      }
    });

    return currentPage;
  }

  function createSpellingTableElement(itemCount) {
    const container = document.createElement('div');
    container.className = 'spelling-table-container';

    const title = document.createElement('div');
    title.className = 'spelling-table-title';
    title.textContent = '✏️ غلط‌های املایی متن بالا را پیدا کنید، دور آن‌ها خط بکشید و شکل صحیح آن‌ها را در جدول زیر بنویسید:';
    container.appendChild(title);

    const table = document.createElement('table');
    table.className = 'spelling-table';

    const rowsCount = Math.ceil(itemCount / 2);
    table.innerHTML = `
      <thead>
        <tr>
          <th style="width: 45px;">ردیف</th>
          <th>شکل صحیح واژه</th>
          <th style="width: 45px;">ردیف</th>
          <th>شکل صحیح واژه</th>
        </tr>
      </thead>
      <tbody>
        ${Array.from({ length: rowsCount }, (_, r) => {
          const num1 = r + 1;
          const num2 = r + 1 + rowsCount;
          return `
            <tr>
              <td>${Shamsi.toPersianDigits(num1)}</td>
              <td class="empty-cell"></td>
              <td>${num2 <= itemCount ? Shamsi.toPersianDigits(num2) : '-'}</td>
              <td class="empty-cell"></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    `;
    container.appendChild(table);
    return container;
  }

  function buildAnswerSheet() {
    const answerSheet = document.createElement('section');
    answerSheet.className = `page-sheet answer-sheet ${state.printAnswerKey ? '' : 'hide-answer-key'}`;
    answerSheet.id = 'sheet-answer';

    const frame = document.createElement('div');
    frame.className = 'page-frame';

    const frameInner = document.createElement('div');
    frameInner.className = 'page-frame-inner';

    const header = document.createElement('header');
    header.className = 'answer-header';
    header.innerHTML = `
      <div class="h-bismillah">به نام خدا</div>
      <h2 class="answer-title">پاسخنامه کاربرگ املای فارسی</h2>
      <div class="answer-subtitle">${escapeHtml(state.currentLessonFull)} - دبستان ${escapeHtml(state.schoolName)}</div>
      <div class="immutable-copyright" style="margin-top: 6px;">طراحی شده توسط سامانه www.ali.id.ir</div>
    `;
    frameInner.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'answer-grid';

    const allSelected = Array.from(state.selectedWords.values());
    if (allSelected.length === 0) {
      grid.innerHTML = '<div style="color: #64748b; font-size: 0.90rem; grid-column: span 2; text-align: center; padding: 18px;">هیچ کلمه‌ای هنوز انتخاب نشده است. با کلیک روی واژه‌ها در کاربرگ، کلمات را برگزینید.</div>';
    } else {
      allSelected.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'answer-item';
        const numStr = Shamsi.toPersianDigits(idx + 1);

        if (item.type === 'blank') {
          row.innerHTML = `
            <span class="answer-num">${numStr}.</span>
            <span style="color: #64748b; font-size: 0.82rem;">(جای خالی)</span>
            <span class="answer-correct">${escapeHtml(item.original)}</span>
          `;
        } else if (item.type === 'error') {
          row.innerHTML = `
            <span class="answer-num">${numStr}.</span>
            <span class="answer-wrong">${escapeHtml(item.misspelled)}</span>
            <span style="color: #64748b; margin: 0 4px;">⬅</span>
            <span class="answer-correct">${escapeHtml(item.original)}</span>
          `;
        }
        grid.appendChild(row);
      });
    }

    frameInner.appendChild(grid);
    frame.appendChild(frameInner);
    answerSheet.appendChild(frame);
    dom.pagesContainer.appendChild(answerSheet);
  }

  function updateSummaryTags() {
    let blankCount = 0;
    let errorCount = 0;
    state.selectedWords.forEach(val => {
      if (val.type === 'blank') blankCount++;
      if (val.type === 'error') errorCount++;
    });

    dom.tagBlankCount.textContent = `جای خالی: ${Shamsi.toPersianDigits(blankCount)}`;
    dom.tagErrorCount.textContent = `غلط املایی: ${Shamsi.toPersianDigits(errorCount)}`;

    // Update student guide box on page 1 live
    const guideBox = document.querySelector('.student-guide-box');
    if (guideBox) {
      guideBox.innerHTML = getStudentGuideHtml();
    }
  }

  // --------------------------------------------------------------------------
  // Word Click Handlers & Modals
  // --------------------------------------------------------------------------
  function handleWordClick(token, spanElement, event) {
    const existing = state.selectedWords.get(token.id);

    if (existing) {
      if (state.worksheetMode === 'combined') {
        if (existing.type === 'blank') {
          if (!Speller.hasHomophones(token.stem)) {
            showToast('این کلمه فاقد حروف هم‌صداست و قابل انتخاب برای غلط املایی نیست.', 'warning');
            state.selectedWords.delete(token.id);
          } else {
            const defaultErr = Speller.getDefaultSpellingError(token.stem);
            state.selectedWords.set(token.id, {
              type: 'error',
              original: token.stem,
              misspelled: defaultErr
            });
          }
        } else {
          state.selectedWords.delete(token.id);
        }
      } else {
        state.selectedWords.delete(token.id);
      }
      renderWorksheet();
      return;
    }

    if (state.worksheetMode === 'blank') {
      state.selectedWords.set(token.id, {
        type: 'blank',
        original: token.stem
      });
      renderWorksheet();
    } else if (state.worksheetMode === 'error') {
      if (!Speller.hasHomophones(token.stem)) {
        showToast('این کلمه فاقد حروف هم‌صداست و قابل انتخاب برای غلط املایی نیست.', 'warning');
        return;
      }

      const defaultError = Speller.getDefaultSpellingError(token.stem);
      state.selectedWords.set(token.id, {
        type: 'error',
        original: token.stem,
        misspelled: defaultError
      });

      const allErrors = Speller.generateSpellingErrors(token.stem);
      if (allErrors.length > 1) {
        openSpellingChoiceModal(token.id, token.stem, defaultError, allErrors);
      }

      renderWorksheet();
    } else if (state.worksheetMode === 'combined') {
      state.selectedWords.set(token.id, {
        type: 'blank',
        original: token.stem
      });
      renderWorksheet();
    }
  }

  function openSpellingChoiceModal(wordId, originalWord, currentError, suggestions) {
    state.modalActiveWordId = wordId;
    dom.spellingModalOriginal.textContent = originalWord;
    dom.spellingCustomInput.value = currentError;
    dom.spellingSuggestionsContainer.innerHTML = '';

    suggestions.forEach(suggestion => {
      const btn = document.createElement('button');
      btn.className = `btn ${suggestion === currentError ? 'btn-primary' : 'btn-outline'}`;
      btn.textContent = suggestion;

      btn.addEventListener('click', () => {
        dom.spellingCustomInput.value = suggestion;
        Array.from(dom.spellingSuggestionsContainer.children).forEach(c => {
          c.className = 'btn btn-outline';
        });
        btn.className = 'btn btn-primary';
      });

      dom.spellingSuggestionsContainer.appendChild(btn);
    });

    dom.modalSpellingChoice.classList.add('is-active');
  }

  function closeSpellingChoiceModal() {
    dom.modalSpellingChoice.classList.remove('is-active');
    state.modalActiveWordId = null;
  }

  function saveSpellingChoice() {
    if (!state.modalActiveWordId) return;

    const chosenError = dom.spellingCustomInput.value.trim();
    if (!chosenError) {
      showToast('لطفاً یک شکل غلط وارد کنید.', 'warning');
      return;
    }

    const item = state.selectedWords.get(state.modalActiveWordId);
    if (item) {
      item.misspelled = chosenError;
      state.selectedWords.set(state.modalActiveWordId, item);
      renderWorksheet();
    }
    closeSpellingChoiceModal();
  }

  // --------------------------------------------------------------------------
  // Random Selection & Parallel Form Generation
  // --------------------------------------------------------------------------
  function getRandomCandidates(needErrors = false) {
    const list = [];
    state.parsedParagraphs.forEach(p => {
      p.tokens.forEach(t => {
        if (t.isSelectable && t.stem.length >= 2) {
          if (needErrors) {
            if (Speller.hasHomophones(t.stem)) list.push(t);
          } else {
            list.push(t);
          }
        }
      });
    });
    return list;
  }

  function performRandomSelection(count, variantName = 'الف') {
    state.selectedWords.clear();
    state.formVariant = variantName;

    if (variantName === 'ب') {
      dom.tagFormVariant.style.display = 'inline-block';
      dom.tagFormVariant.textContent = 'فرم ب';
    } else {
      dom.tagFormVariant.style.display = 'none';
    }

    if (state.worksheetMode === 'blank') {
      const pool = getRandomCandidates(false);
      shuffleArray(pool);
      const chosen = pool.slice(0, count);
      chosen.forEach(t => {
        state.selectedWords.set(t.id, { type: 'blank', original: t.stem });
      });
    } else if (state.worksheetMode === 'error') {
      const pool = getRandomCandidates(true);
      shuffleArray(pool);
      const chosen = pool.slice(0, count);
      chosen.forEach(t => {
        state.selectedWords.set(t.id, {
          type: 'error',
          original: t.stem,
          misspelled: Speller.getDefaultSpellingError(t.stem)
        });
      });
    } else if (state.worksheetMode === 'combined') {
      const half = Math.ceil(count / 2);
      const errorPool = getRandomCandidates(true);
      shuffleArray(errorPool);
      const chosenErrors = errorPool.slice(0, half);
      const errorIds = new Set(chosenErrors.map(e => e.id));

      chosenErrors.forEach(t => {
        state.selectedWords.set(t.id, {
          type: 'error',
          original: t.stem,
          misspelled: Speller.getDefaultSpellingError(t.stem)
        });
      });

      const blankPool = getRandomCandidates(false).filter(t => !errorIds.has(t.id));
      shuffleArray(blankPool);
      const chosenBlanks = blankPool.slice(0, count - chosenErrors.length);
      chosenBlanks.forEach(t => {
        state.selectedWords.set(t.id, { type: 'blank', original: t.stem });
      });
    }

    renderWorksheet();
    showToast(`تعداد ${Shamsi.toPersianDigits(state.selectedWords.size)} کلمه به صورت تصادفی (${state.formVariant === 'ب' ? 'فرم ب' : 'فرم الف'}) انتخاب شد.`, 'success');
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // --------------------------------------------------------------------------
  // Text Editing Modal Handlers
  // --------------------------------------------------------------------------
  function openEditTextModal() {
    dom.textareaCustomText.value = state.activeText;
    dom.modalEditText.classList.add('is-active');
  }

  function closeEditTextModal() {
    dom.modalEditText.classList.remove('is-active');
  }

  function saveCustomText() {
    const newText = dom.textareaCustomText.value.trim();
    if (!newText) {
      showToast('متن نمی‌تواند خالی باشد.', 'danger');
      return;
    }

    state.activeText = newText;
    state.isCustomText = true;
    state.selectedWords.clear();
    closeEditTextModal();
    renderWorksheet();
    showToast('متن درس با موفقیت به‌روزرسانی شد.', 'success');
  }

  function resetToOriginalText() {
    loadCurrentLessonText();
    renderWorksheet();
    showToast('متن به حالت اولیه‌ی کتاب بازگردانده شد.', 'success');
  }

  // --------------------------------------------------------------------------
  // Toast Notifications
  // --------------------------------------------------------------------------
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // --------------------------------------------------------------------------
  // Event Listeners
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    dom.selectGrade.addEventListener('change', () => {
      state.currentGrade = parseInt(dom.selectGrade.value, 10);
      populateLessons();
      loadCurrentLessonText();
      renderWorksheet();
    });

    dom.selectLesson.addEventListener('change', () => {
      updateSubpartDropdown();
      loadCurrentLessonText();
      renderWorksheet();
    });

    dom.selectSubpart.addEventListener('change', () => {
      loadCurrentLessonText();
      renderWorksheet();
    });

    dom.modeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.worksheetMode = e.target.value;
        state.selectedWords.clear();
        renderWorksheet();
      });
    });

    dom.btnRandomSelect.addEventListener('click', () => {
      const count = parseInt(dom.inputRandomCount.value, 10) || 10;
      performRandomSelection(count, 'الف');
    });

    dom.btnParallelForm.addEventListener('click', () => {
      const nextVariant = state.formVariant === 'الف' ? 'ب' : 'الف';
      const count = state.selectedWords.size > 0 ? state.selectedWords.size : (parseInt(dom.inputRandomCount.value, 10) || 10);
      performRandomSelection(count, nextVariant);
    });

    dom.btnClearSelection.addEventListener('click', () => {
      state.selectedWords.clear();
      renderWorksheet();
      showToast('تمامی کلمات انتخاب‌شده پاک شدند.', 'info');
    });

    dom.btnOpenEditModal.addEventListener('click', openEditTextModal);
    dom.btnCloseEditModal.addEventListener('click', closeEditTextModal);
    dom.btnCancelEditText.addEventListener('click', closeEditTextModal);
    dom.btnSaveCustomText.addEventListener('click', saveCustomText);
    dom.btnResetText.addEventListener('click', resetToOriginalText);

    dom.btnCloseSpellingModal.addEventListener('click', closeSpellingChoiceModal);
    dom.btnCancelSpellingChoice.addEventListener('click', closeSpellingChoiceModal);
    dom.btnConfirmSpellingChoice.addEventListener('click', saveSpellingChoice);

    dom.sliderFontSize.addEventListener('input', (e) => {
      state.fontSize = parseFloat(e.target.value);
      applyTypography();
      saveSettingsToStorage();
      renderWorksheet();
    });

    dom.sliderLineHeight.addEventListener('input', (e) => {
      state.lineHeight = parseFloat(e.target.value);
      applyTypography();
      saveSettingsToStorage();
      renderWorksheet();
    });

    dom.inputSchoolName.addEventListener('input', (e) => {
      state.schoolName = e.target.value;
      syncHeaderFields();
      saveSettingsToStorage();
    });

    dom.inputTeacherName.addEventListener('input', (e) => {
      state.teacherName = e.target.value;
      syncHeaderFields();
      saveSettingsToStorage();
    });

    dom.inputDate.addEventListener('input', (e) => {
      state.examDate = e.target.value;
      syncHeaderFields();
    });

    dom.checkPrintAnswers.addEventListener('change', (e) => {
      state.printAnswerKey = e.target.checked;
      const answerSheet = document.getElementById('sheet-answer');
      if (answerSheet) {
        if (state.printAnswerKey) {
          answerSheet.classList.remove('hide-answer-key');
        } else {
          answerSheet.classList.add('hide-answer-key');
        }
      }
    });

    dom.btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  init();
});
